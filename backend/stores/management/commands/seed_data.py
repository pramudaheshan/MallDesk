from decimal import Decimal
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from products.models import Product
from stores.models import Store, StoreMembership

User = get_user_model()

DEFAULT_PASSWORD = "MallDesk123!"


class Command(BaseCommand):
    help = "Seeds sample data with stores, distinct products, and users for all roles."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("Seeding MallDesk sample database..."))

        # 1. Create Stores
        store_colombo, _ = Store.objects.get_or_create(
            name="Colombo Store",
            defaults={"location": "Colombo 03, Sri Lanka"},
        )
        store_kandy, _ = Store.objects.get_or_create(
            name="Kandy Store",
            defaults={"location": "Dalada Veediya, Kandy, Sri Lanka"},
        )

        self.stdout.write(self.style.SUCCESS(f"Stores ready: {store_colombo.name}, {store_kandy.name}"))

        # 2. Create Users
        users_data = [
            ("admin_colombo", "admin.colombo@malldesk.lk", "Admin", "Colombo", True),
            ("manager_colombo", "manager.colombo@malldesk.lk", "Manager", "Colombo", False),
            ("staff_colombo", "staff.colombo@malldesk.lk", "Staff", "Colombo", False),
            ("admin_multi", "admin.multi@malldesk.lk", "Admin", "Multi-Store", True),
            ("staff_kandy", "staff.kandy@malldesk.lk", "Staff", "Kandy", False),
        ]

        created_users = {}
        for username, email, first_name, last_name, is_staff in users_data:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": email,
                    "first_name": first_name,
                    "last_name": last_name,
                    "is_staff": is_staff,
                },
            )
            user.set_password(DEFAULT_PASSWORD)
            user.save()
            created_users[username] = user

        # 3. Create Store Memberships
        memberships_data = [
            ("admin_colombo", store_colombo, "admin"),
            ("manager_colombo", store_colombo, "manager"),
            ("staff_colombo", store_colombo, "staff"),       # Single store access (Colombo only)
            ("admin_multi", store_colombo, "admin"),         # Multi-store access (Colombo)
            ("admin_multi", store_kandy, "admin"),           # Multi-store access (Kandy)
            ("staff_kandy", store_kandy, "staff"),           # Single store access (Kandy only)
        ]

        for username, store, role in memberships_data:
            user = created_users[username]
            StoreMembership.objects.update_or_create(
                user=user,
                store=store,
                defaults={"role": role},
            )

        self.stdout.write(self.style.SUCCESS("Users and memberships successfully assigned."))

        # 4. Create Distinct Products for Colombo Store
        colombo_products = [
            {
                "name": "ThinkPad Carbon X1",
                "description": "Premium ultrabook with 16GB RAM and 512GB SSD",
                "selling_price": Decimal("385000.00"),
                "cost_price": Decimal("320000.00"),
                "supplier": "Lenovo Sri Lanka",
                "stock_quantity": 2,  # Low stock
            },
            {
                "name": "Dell UltraSharp 27 Monitor",
                "description": "4K IPS USB-C Hub Monitor with 99% sRGB",
                "selling_price": Decimal("145000.00"),
                "cost_price": Decimal("115000.00"),
                "supplier": "Dell Technologies",
                "stock_quantity": 4,  # Low stock
            },
            {
                "name": "Logitech MX Master 3S",
                "description": "Performance wireless mouse with quiet clicks and 8K sensor",
                "selling_price": Decimal("32500.00"),
                "cost_price": Decimal("24000.00"),
                "supplier": "Logitech Regional",
                "stock_quantity": 18,
            },
            {
                "name": "Keychron Q1 Pro Mechanical Keyboard",
                "description": "Wireless custom mechanical keyboard with Gateron Jupiter switches",
                "selling_price": Decimal("58000.00"),
                "cost_price": Decimal("42000.00"),
                "supplier": "Keychron Direct",
                "stock_quantity": 25,
            },
            {
                "name": "Anker 10-in-1 USB-C Docking Station",
                "description": "Dual HDMI 4K multiport hub with 100W Power Delivery",
                "selling_price": Decimal("28500.00"),
                "cost_price": Decimal("19500.00"),
                "supplier": "Anker Innovations",
                "stock_quantity": 12,
            },
        ]

        for item in colombo_products:
            Product.objects.update_or_create(
                store=store_colombo,
                name=item["name"],
                defaults=item,
            )

        # 5. Create Distinct Products for Kandy Store
        kandy_products = [
            {
                "name": "Zebra DS2208 2D Barcode Scanner",
                "description": "Handheld corded omnidirectional barcode scanner",
                "selling_price": Decimal("24500.00"),
                "cost_price": Decimal("18000.00"),
                "supplier": "Zebra Technologies",
                "stock_quantity": 20,
            },
            {
                "name": "Epson TM-T88VI Thermal Receipt Printer",
                "description": "High-speed POS receipt printer with Ethernet and USB",
                "selling_price": Decimal("78000.00"),
                "cost_price": Decimal("62000.00"),
                "supplier": "Epson Lanka",
                "stock_quantity": 8,
            },
            {
                "name": "Heavy-Duty Electronic Cash Drawer",
                "description": "Steel cash drawer with RJ12 receipt printer kick connector",
                "selling_price": Decimal("19500.00"),
                "cost_price": Decimal("14000.00"),
                "supplier": "RetailPoint Supply",
                "stock_quantity": 6,
            },
            {
                "name": "Sunmi V2 Pro Mobile POS Terminal",
                "description": "Android smart handheld terminal with built-in thermal printer",
                "selling_price": Decimal("65000.00"),
                "cost_price": Decimal("49000.00"),
                "supplier": "Sunmi Global",
                "stock_quantity": 3,  # Low stock
            },
            {
                "name": "Ergonomic Mesh Task Chair",
                "description": "High back office chair with adjustable lumbar support",
                "selling_price": Decimal("45000.00"),
                "cost_price": Decimal("31000.00"),
                "supplier": "Comfort Seating LK",
                "stock_quantity": 0,  # Out of stock
            },
        ]

        for item in kandy_products:
            Product.objects.update_or_create(
                store=store_kandy,
                name=item["name"],
                defaults=item,
            )

        self.stdout.write(self.style.SUCCESS("Products seeded with distinct items for store isolation checks."))
        self.stdout.write("")
        self.stdout.write(self.style.HTTP_INFO("=" * 68))
        self.stdout.write(self.style.HTTP_INFO("DEMO TEST CREDENTIALS (Password for all: MallDesk123!)"))
        self.stdout.write(self.style.HTTP_INFO("=" * 68))
        self.stdout.write("1. admin_colombo   | Admin        | Access: Colombo Store only")
        self.stdout.write("2. manager_colombo | Manager      | Access: Colombo Store only")
        self.stdout.write("3. staff_colombo   | Staff        | Access: Colombo Store only (NO Kandy access)")
        self.stdout.write("4. admin_multi     | Admin        | Access: Colombo Store AND Kandy Store")
        self.stdout.write("5. staff_kandy     | Staff        | Access: Kandy Store only (NO Colombo access)")
        self.stdout.write(self.style.HTTP_INFO("=" * 68))
