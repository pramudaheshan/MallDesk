
import re

from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from products.models import Product
from stores.permissions import get_store_membership


LOW_STOCK_THRESHOLD = 5


def generate_answer(message, products):
    """
    Generate a deterministic answer using only the supplied store's products.
    """
    text = message.lower().strip()

    if any(word in text for word in ["low stock", "low on stock", "running low"]):
        low_stock = products.filter(
            stock_quantity__lte=LOW_STOCK_THRESHOLD
        ).order_by("stock_quantity", "name")

        if not low_stock.exists():
            return "There are no products with low stock in this store."

        items = [
            f"{product.name} ({product.stock_quantity} left)"
            for product in low_stock
        ]
        return "Products with low stock: " + ", ".join(items) + "."

    if any(phrase in text for phrase in [
        "how many products",
        "product count",
        "number of products",
        "total products",
    ]):
        count = products.count()
        return f"There are {count} products in this store."

    price_match = re.search(
        r"(?:more than|over|above|greater than)\s*(?:rs\.?|lkr)?\s*([\d,]+(?:\.\d{1,2})?)",
        text,
    )

    if price_match:
        amount = price_match.group(1).replace(",", "")
        try:
            amount = float(amount)
        except ValueError:
            return "Please provide a valid price amount."

        matching = products.filter(
            selling_price__gt=amount
        ).order_by("-selling_price", "name")

        if not matching.exists():
            return f"No products have a selling price above Rs. {amount:,.2f}."

        items = [
            f"{product.name} (Rs. {product.selling_price:,.2f})"
            for product in matching
        ]
        return "Products above that price: " + ", ".join(items) + "."

    if any(word in text for word in ["list products", "show products", "all products"]):
        items = products.order_by("name")

        if not items.exists():
            return "There are no products in this store yet."

        return "Products in this store: " + ", ".join(
            product.name for product in items
        ) + "."

    if "stock" in text and any(word in text for word in ["total", "how much", "quantity"]):
        total = sum(products.values_list("stock_quantity", flat=True))
        return f"The total stock quantity in this store is {total} units."

    return (
        "I can help with product counts, low-stock products, total stock "
        "quantity, product lists, and products above a selling price. "
        "What would you like to know?"
    )


class AssistantChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = request.data.get("message")
        store_id = request.data.get("store_id")

        if not isinstance(message, str) or not message.strip():
            return Response(
                {"detail": "A message is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not store_id:
            return Response(
                {"detail": "An active store is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            store_id = int(store_id)
            if store_id <= 0:
                raise ValueError
        except (TypeError, ValueError):
            return Response(
                {"detail": "The store ID must be a positive integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verify that the authenticated user belongs to this store.
        # Never trust the client-provided store ID without this check.
        membership = get_store_membership(request.user, store_id)

        # Every assistant query is restricted to this store.
        products = Product.objects.filter(store=membership.store)

        answer = generate_answer(message.strip(), products)

        return Response({
            "answer": answer,
            "store_id": membership.store_id,
            "store_name": membership.store.name,
        })
