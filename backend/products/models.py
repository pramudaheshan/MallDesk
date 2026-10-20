
from django.db import models


class Product(models.Model):
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="products",
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    selling_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )
    cost_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )
    supplier = models.CharField(max_length=200)
    stock_quantity = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.store.name}"
