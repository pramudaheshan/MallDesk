
from rest_framework import serializers

from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    store_name = serializers.CharField(
        source="store.name",
        read_only=True,
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "store",
            "store_name",
            "name",
            "description",
            "selling_price",
            "cost_price",
            "supplier",
            "stock_quantity",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
                "id",
                "store",
                "store_name",
                "created_at",
                "updated_at",
        ]

    def validate_selling_price(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Selling price cannot be negative."
            )
        return value

    def validate_cost_price(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Cost price cannot be negative."
            )
        return value
