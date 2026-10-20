
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    return JsonResponse({
        "status": "ok",
        "application": "MallDesk API",
    })


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check),
    path("api/", include("stores.urls")),
    path("api/", include("products.urls")),
    path("api/assistant/", include("assistant.urls")),
]