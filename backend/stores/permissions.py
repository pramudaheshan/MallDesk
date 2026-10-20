
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import BasePermission

from .models import StoreMembership


def get_store_membership(user, store_id):
    """
    Return the user's membership for a store.
    Reject access if the user is not a member.
    """
    membership = (
        StoreMembership.objects
        .filter(user=user, store_id=store_id)
        .select_related("store")
        .first()
    )

    if membership is None:
        raise PermissionDenied(
            "You do not have access to this store."
        )

    return membership


def require_store_admin(user, store_id):
    membership = get_store_membership(user, store_id)

    if membership.role != StoreMembership.Role.ADMIN:
        raise PermissionDenied(
            "Only store administrators can manage users."
        )

    return membership


def require_product_manager(user, store_id):
    membership = get_store_membership(user, store_id)

    if membership.role not in [
        StoreMembership.Role.ADMIN,
        StoreMembership.Role.MANAGER,
    ]:
        raise PermissionDenied(
            "You do not have permission to manage products."
        )

    return membership