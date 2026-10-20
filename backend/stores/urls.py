
from django.urls import path

from .views import (
    CurrentUserView,
    LoginView,
    LogoutView,
    StoreListView,
    csrf_token_view,
    StoreUserListCreateView,
    StoreUserDetailView,
)

urlpatterns = [
    path("auth/csrf/", csrf_token_view, name="csrf-token"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/me/", CurrentUserView.as_view(), name="current-user"),
    path("stores/", StoreListView.as_view(), name="store-list"),

    path(
        "stores/<int:store_id>/users/",
        StoreUserListCreateView.as_view(),
        name="store-users",
    ),
    path(
        "stores/<int:store_id>/users/<int:membership_id>/",
        StoreUserDetailView.as_view(),
        name="store-user-detail",
    ),
]
