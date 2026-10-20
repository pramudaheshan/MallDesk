
from django.urls import path

from .views import (
    StoreProductDetailView,
    StoreProductListCreateView,
)

urlpatterns = [
    path(
        "stores/<int:store_id>/products/",
        StoreProductListCreateView.as_view(),
        name="store-products",
    ),
    path(
        "stores/<int:store_id>/products/<int:product_id>/",
        StoreProductDetailView.as_view(),
        name="store-product-detail",
    ),
]
