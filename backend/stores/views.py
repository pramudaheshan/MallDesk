
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import StoreMembership

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404

from rest_framework.exceptions import PermissionDenied

from .models import StoreMembership
from .permissions import get_store_membership, require_store_admin
from .serializers import StoreMembershipSerializer

User = get_user_model()

@ensure_csrf_cookie
def csrf_token_view(request):
    return JsonResponse({
        "detail": "CSRF cookie set",
        "csrfToken": get_token(request),
    })


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"detail": "Username and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(
            request,
            username=username,
            password=password,
        )

        if user is None:
            return Response(
                {"detail": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        login(request, user)

        return Response({
            "message": "Login successful.",
            "user": {
                "id": user.id,
                "username": user.get_username(),
            },
        })


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({"message": "Logout successful."})


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        memberships = StoreMembership.objects.filter(
            user=request.user
        ).select_related("store")

        return Response({
            "id": request.user.id,
            "username": request.user.get_username(),
            "stores": [
                {
                    "id": membership.store_id,
                    "name": membership.store.name,
                    "location": membership.store.location,
                    "role": membership.role,
                }
                for membership in memberships
            ],
        })


class StoreListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        memberships = StoreMembership.objects.filter(
            user=request.user
        ).select_related("store")

        return Response([
            {
                "id": membership.store_id,
                "name": membership.store.name,
                "location": membership.store.location,
                "role": membership.role,
            }
            for membership in memberships
        ])


class StoreUserListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, store_id):
        membership = get_store_membership(
            request.user, store_id
        )

        users = StoreMembership.objects.filter(
            store=membership.store
        ).select_related(
            "user", "store"
        ).order_by("id")

        serializer = StoreMembershipSerializer(
            users, many=True
        )
        return Response(serializer.data)

    def post(self, request, store_id):
        membership = require_store_admin(
            request.user, store_id
        )

        username = request.data.get("username")
        role = request.data.get("role")

        if not isinstance(username, str) or not username.strip():
            return Response(
                {"username": "A username is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if role not in StoreMembership.Role.values:
            return Response(
                {"role": "Invalid store role."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(
            username=username.strip()
        ).first()

        if user is None:
            return Response(
                {"username": "User does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if StoreMembership.objects.filter(
            user=user,
            store=membership.store,
        ).exists():
            return Response(
                {"detail": "User is already assigned to this store."},
                status=status.HTTP_409_CONFLICT,
            )

        try:
            with transaction.atomic():
                new_membership = StoreMembership.objects.create(
                    user=user,
                    store=membership.store,
                    role=role,
                )
        except IntegrityError:
            return Response(
                {"detail": "User is already assigned to this store."},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(
            StoreMembershipSerializer(new_membership).data,
            status=status.HTTP_201_CREATED,
        )


class StoreUserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_membership(self, request, store_id, membership_id):
        acting_membership = get_store_membership(
            request.user, store_id
        )

        target = get_object_or_404(
            StoreMembership.objects.select_related("user", "store"),
            pk=membership_id,
            store=acting_membership.store,
        )

        return acting_membership, target

    def patch(self, request, store_id, membership_id):
        acting, target = self.get_membership(
            request, store_id, membership_id
        )

        if acting.role != StoreMembership.Role.ADMIN:
            raise PermissionDenied(
                "Only store administrators can change user roles."
            )

        if set(request.data.keys()) != {"role"}:
            return Response(
                {"detail": "Only the role field can be updated."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = StoreMembershipSerializer(
            target,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)

    def delete(self, request, store_id, membership_id):
        acting, target = self.get_membership(
            request, store_id, membership_id
        )

        if acting.role != StoreMembership.Role.ADMIN:
            raise PermissionDenied(
                "Only store administrators can remove users."
            )

        if target.user_id == request.user.id:
            return Response(
                {"detail": "You cannot remove your own membership."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target.delete()
        return Response(
            status=status.HTTP_204_NO_CONTENT
        )
