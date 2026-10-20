
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Store, StoreMembership

User = get_user_model()


class StoreUserManagementTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.admin = User.objects.create_user(
            username="admin_test",
            password="testpass123",
        )
        self.manager = User.objects.create_user(
            username="manager_test",
            password="testpass123",
        )
        self.staff = User.objects.create_user(
            username="staff_test",
            password="testpass123",
        )
        self.target = User.objects.create_user(
            username="target_test",
            password="testpass123",
        )

        self.store = Store.objects.create(
            name="Colombo Store",
            location="Colombo",
        )

        self.other_store = Store.objects.create(
            name="Kandy Store",
            location="Kandy",
        )

        StoreMembership.objects.create(
            user=self.admin,
            store=self.store,
            role="admin",
        )
        StoreMembership.objects.create(
            user=self.manager,
            store=self.store,
            role="manager",
        )
        StoreMembership.objects.create(
            user=self.staff,
            store=self.store,
            role="staff",
        )

    def test_admin_can_assign_existing_user(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            f"/api/stores/{self.store.id}/users/",
            {"username": "target_test", "role": "staff"},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            StoreMembership.objects.filter(
                user=self.target,
                store=self.store,
                role="staff",
            ).exists()
        )

    def test_manager_cannot_assign_users(self):
        self.client.force_authenticate(user=self.manager)

        response = self.client.post(
            f"/api/stores/{self.store.id}/users/",
            {"username": "target_test", "role": "staff"},
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_staff_cannot_assign_users(self):
        self.client.force_authenticate(user=self.staff)

        response = self.client.post(
            f"/api/stores/{self.store.id}/users/",
            {"username": "target_test", "role": "staff"},
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_admin_can_change_user_role(self):
        membership = StoreMembership.objects.create(
            user=self.target,
            store=self.store,
            role="staff",
        )
        self.client.force_authenticate(user=self.admin)

        response = self.client.patch(
            f"/api/stores/{self.store.id}/users/{membership.id}/",
            {"role": "manager"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        membership.refresh_from_db()
        self.assertEqual(membership.role, "manager")

    def test_manager_cannot_change_user_role(self):
        membership = StoreMembership.objects.create(
            user=self.target,
            store=self.store,
            role="staff",
        )
        self.client.force_authenticate(user=self.manager)

        response = self.client.patch(
            f"/api/stores/{self.store.id}/users/{membership.id}/",
            {"role": "manager"},
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        membership.refresh_from_db()
        self.assertEqual(membership.role, "staff")

    def test_admin_can_remove_user_membership(self):
        membership = StoreMembership.objects.create(
            user=self.target,
            store=self.store,
            role="staff",
        )
        self.client.force_authenticate(user=self.admin)

        response = self.client.delete(
            f"/api/stores/{self.store.id}/users/{membership.id}/"
        )

        self.assertEqual(response.status_code, 204)
        self.assertFalse(
            StoreMembership.objects.filter(id=membership.id).exists()
        )

    def test_manager_cannot_remove_user_membership(self):
        membership = StoreMembership.objects.create(
            user=self.target,
            store=self.store,
            role="staff",
        )
        self.client.force_authenticate(user=self.manager)

        response = self.client.delete(
            f"/api/stores/{self.store.id}/users/{membership.id}/"
        )

        self.assertEqual(response.status_code, 403)
        self.assertTrue(
            StoreMembership.objects.filter(id=membership.id).exists()
        )

    def test_admin_cannot_manage_unassigned_store(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            f"/api/stores/{self.other_store.id}/users/",
            {"username": "target_test", "role": "staff"},
            format="json",
        )

        self.assertEqual(response.status_code, 403)
