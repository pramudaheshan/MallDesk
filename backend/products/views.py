
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from stores.models import Store, StoreMembership
from stores.permissions import (
    get_store_membership,
    require_product_manager,
)

from .models import Product
from .serializers import ProductSerializer


class StoreProductListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, store_id):
        membership = get_store_membership(
            request.user, store_id
        )

        products = Product.objects.filter(
            store=membership.store
        ).order_by("id")

        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)

    def post(self, request, store_id):
        membership = require_product_manager(
            request.user, store_id
        )

        serializer = ProductSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # The store comes from the authorised membership,
        # not from a store ID submitted in the request body.
        product = serializer.save(store=membership.store)

        return Response(
            ProductSerializer(product).data,
            status=status.HTTP_201_CREATED,
        )


class StoreProductDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_product(self, user, store_id, product_id):
        membership = get_store_membership(user, store_id)

        # A product belonging to another store cannot be
        # accessed by changing product_id in the URL.
        product = get_object_or_404(
            Product,
            pk=product_id,
            store=membership.store,
        )
        return membership, product

    def get(self, request, store_id, product_id):
        _, product = self.get_product(
            request.user, store_id, product_id
        )
        return Response(ProductSerializer(product).data)

    def patch(self, request, store_id, product_id):
        membership, product = self.get_product(
            request.user, store_id, product_id
        )

        if membership.role == StoreMembership.Role.STAFF:
            raise PermissionDenied(
                "Staff cannot edit products."
            )

        restricted_fields = {"cost_price", "supplier"}

        # Reject the entire request if a manager submits
        # either restricted field, even with valid fields.
        if (
            membership.role == StoreMembership.Role.MANAGER
            and restricted_fields.intersection(request.data.keys())
        ):
            raise PermissionDenied(
                "Managers cannot change cost price or supplier."
            )

        serializer = ProductSerializer(
            product,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        product = serializer.save()

        return Response(ProductSerializer(product).data)

    def delete(self, request, store_id, product_id):
        membership, product = self.get_product(
            request.user, store_id, product_id
        )

        if membership.role != StoreMembership.Role.ADMIN:
            raise PermissionDenied(
                "Only store administrators can delete products."
            )

        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
