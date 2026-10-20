
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from stores.models import Store, StoreMembership
from products.models import Product

User = get_user_model()


class AssistantSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.user = User.objects.create_user(
            username="assistant_user",
            password="testpass123",
        )
        self.other_user = User.objects.create_user(
            username="other_user",
            password="testpass123",
        )

        self.store_a = Store.objects.create(
            name="Colombo Store",
            location="Colombo",
        )
        self.store_b = Store.objects.create(
            name="Kandy Store",
            location="Kandy",
        )

        StoreMembership.objects.create(
            user=self.user,
            store=self.store_a,
            role="staff",
        )

        Product.objects.create(
            store=self.store_a,
            name="Colombo Rice",
            description="Rice sold in Colombo",
            selling_price="500.00",
            cost_price="400.00",
            supplier="Supplier A",
            stock_quantity=2,
        )

        Product.objects.create(
            store=self.store_b,
            name="Secret Kandy Product",
            description="Must not be exposed",
            selling_price="900.00",
            cost_price="700.00",
            supplier="Supplier B",
            stock_quantity=1,
        )

    def test_user_can_query_assigned_store(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            "/api/assistant/chat/",
            {
                "store_id": self.store_a.id,
                "message": "Show all products",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("Colombo Rice", response.data["answer"])
        self.assertNotIn(
            "Secret Kandy Product",
            response.data["answer"],
        )

    def test_user_cannot_query_unassigned_store(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            "/api/assistant/chat/",
            {
                "store_id": self.store_b.id,
                "message": "Show all products",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertNotIn(
            "Secret Kandy Product",
            str(response.data),
        )

    def test_unauthenticated_user_cannot_use_assistant(self):
        response = self.client.post(
            "/api/assistant/chat/",
            {
                "store_id": self.store_a.id,
                "message": "Show all products",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)