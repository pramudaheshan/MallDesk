
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from stores.models import Store, StoreMembership
from .models import Product


User = get_user_model()


class ProductPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.colombo = Store.objects.create(
            name="Colombo",
            location="Colombo, Sri Lanka",
        )
        self.kandy = Store.objects.create(
            name="Kandy",
            location="Kandy, Sri Lanka",
        )

        self.admin = User.objects.create_user(
            username="test_admin",
            password="test-password-123",
        )
        self.manager = User.objects.create_user(
            username="test_manager",
            password="test-password-123",
        )
        self.staff = User.objects.create_user(
            username="test_staff",
            password="test-password-123",
        )

        StoreMembership.objects.create(
            user=self.admin,
            store=self.colombo,
            role="admin",
        )
        StoreMembership.objects.create(
            user=self.manager,
            store=self.colombo,
            role="manager",
        )
        StoreMembership.objects.create(
            user=self.staff,
            store=self.colombo,
            role="staff",
        )

        self.product = Product.objects.create(
            store=self.colombo,
            name="Laptop",
            description="Test laptop",
            selling_price=Decimal("250000.00"),
            cost_price=Decimal("210000.00"),
            supplier="ABC Tech",
            stock_quantity=10,
        )

    def test_staff_cannot_create_product(self):
        self.client.force_authenticate(user=self.staff)

        response = self.client.post(
            f"/api/stores/{self.colombo.id}/products/",
            {
                "name": "Keyboard",
                "selling_price": "3500.00",
                "cost_price": "2200.00",
                "supplier": "ABC Tech",
                "stock_quantity": 5,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(Product.objects.count(), 1)

    def test_manager_cannot_partially_update_restricted_fields(self):
        self.client.force_authenticate(user=self.manager)

        response = self.client.patch(
            f"/api/stores/{self.colombo.id}/products/{self.product.id}/",
            {
                "name": "Changed Laptop",
                "supplier": "Unauthorised Supplier",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)

        self.product.refresh_from_db()
        self.assertEqual(self.product.name, "Laptop")
        self.assertEqual(self.product.supplier, "ABC Tech")

    def test_user_cannot_access_unassigned_store(self):
        self.client.force_authenticate(user=self.staff)

        response = self.client.get(
            f"/api/stores/{self.kandy.id}/products/"
        )

        self.assertEqual(response.status_code, 403)

    def test_manager_can_update_ordinary_fields(self):
        self.client.force_authenticate(user=self.manager)

        response = self.client.patch(
            f"/api/stores/{self.colombo.id}/products/{self.product.id}/",
            {"name": "Updated Laptop"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)

        self.product.refresh_from_db()
        self.assertEqual(self.product.name, "Updated Laptop")
