
from rest_framework import serializers

from django.contrib.auth import get_user_model

from .models import StoreMembership

User = get_user_model()


class StoreMembershipSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )
    store_name = serializers.CharField(
        source="store.name",
        read_only=True,
    )

    class Meta:
        model = StoreMembership
        fields = [
            "id",
            "user",
            "username",
            "store",
            "store_name",
            "role",
        ]
        read_only_fields = [
            "id",
            "user",
            "store",
            "username",
            "store_name",
        ]

    def validate_role(self, value):
        if value not in StoreMembership.Role.values:
            raise serializers.ValidationError(
                "Invalid store role."
            )
        return value
