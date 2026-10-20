
from django.conf import settings
from django.db import models


class Store(models.Model):
    name = models.CharField(max_length=150)
    location = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class StoreMembership(models.Model):
    class Role(models.TextChoices):
        ADMIN = "admin", "Administrator"
        MANAGER = "manager", "Store Manager"
        STAFF = "staff", "Staff"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="store_memberships",
    )
    store = models.ForeignKey(
        Store,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "store"],
                name="unique_user_store_membership",
            )
        ]

    def __str__(self):
        return f"{self.user} - {self.store} ({self.role})"
