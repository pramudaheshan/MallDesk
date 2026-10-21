# MallDesk — Multi-Store Retail Management System

![image](frontend\public\MallDesk Retail Dashboard Showcase.png)

MallDesk is a multi-store retail operations platform engineered with **Django REST Framework** and **React + TypeScript**. It features strict server-side store isolation, role-based access control (RBAC), catalog management, real-time analytics, and a store-grounded AI Assistant.

---

## 1. Business Case & Core Philosophy

Retail enterprises often operate across multiple branch stores with staff assigned to specific locations with varying responsibilities:
- Information from one store **must never be exposed** to unauthorized personnel.
- Staff permissions are **enforced strictly on the backend** on every request; the server never trusts the client blindly.
- The AI Assistant provides deterministic, contextual operational intelligence grounded **only in the selected active store's data**.

---

## 2. Technology Stack

- **Backend**: Python 3, Django, Django REST Framework (DRF), Relational Database (SQLite default)
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Authentication**: Session-based with CSRF tokens (`/api/auth/csrf/`, `/api/auth/login/`, `/api/auth/me/`)
- **Architecture**: Modular Django apps (`stores`, `products`, `assistant`) + Component-driven SPA

---

## 3. Role-Based Access Control (RBAC) Matrix

| Feature / Action | Administrator | Store Manager | Staff Member |
| :--- | :---: | :---: | :---: |
| **Switch assigned stores** | ✅ | ✅ | ✅ |
| **View Store Products & Stock** | ✅ | ✅ | ✅ |
| **Store Overview & Analytics** | ✅ | ✅ | ✅ |
| **Ask Store AI Assistant** | ✅ | ✅ | ✅ |
| **Create New Products** | ✅ | ✅ | ❌ *(HTTP 403)* |
| **Edit Name, Description, Selling Price, Stock** | ✅ | ✅ | ❌ *(HTTP 403)* |
| **Edit Restricted Fields (`cost_price`, `supplier`)** | ✅ | ❌ *(HTTP 403)* | ❌ *(HTTP 403)* |
| **Delete Products** | ✅ | ❌ *(HTTP 403)* | ❌ *(HTTP 403)* |
| **Assign Users / Change User Roles** | ✅ | ❌ *(HTTP 403)* | ❌ *(HTTP 403)* |
| **Remove Store User Access** | ✅ | ❌ *(HTTP 403)* | ❌ *(HTTP 403)* |

> **Restricted Fields Rule**: If a Store Manager submits an update containing restricted fields (`cost_price` or `supplier`), even alongside permitted fields, the entire update is rejected (`HTTP 403`) to prevent silent partial updates.

---

## 4. Demo Credentials & Sample Data

Run the seed command to populate stores, distinct inventory, and accounts for all roles:

```bash
python manage.py seed_data
```

### Test User Accounts

| Username | Password | Assigned Role | Accessible Store(s) | Isolation Scope |
| :--- | :--- | :--- | :--- | :--- |
| **`admin_colombo`** | `MallDesk123!` | Administrator | Colombo Store | Cannot view or modify Kandy Store |
| **`manager_colombo`** | `MallDesk123!` | Store Manager | Colombo Store | Cannot view or modify Kandy Store; restricted fields blocked |
| **`staff_colombo`** | `MallDesk123!` | Staff Member | Colombo Store | **No access to Kandy Store**; read-only products + assistant |
| **`admin_multi`** | `MallDesk123!` | Administrator | **Colombo Store & Kandy Store** | Can switch between both stores in topbar |
| **`staff_kandy`** | `MallDesk123!` | Staff Member | Kandy Store | **No access to Colombo Store**; read-only products + assistant |

---

## 5. Installation & Setup Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Backend Setup (Django)

1. Open a terminal in the `backend/` directory:
   ```bash
   cd backend
   ```
2. Activate your virtual environment:
   - **Windows PowerShell**:
     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     source .venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run migrations and seed sample data:
   ```bash
   python manage.py migrate
   python manage.py seed_data
   ```
5. Start the Django API server (runs on `http://127.0.0.1:8000`):
   ```bash
   python manage.py runserver
   ```

---

### Frontend Setup (React + TypeScript)

1. Open a new terminal in the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the development server (runs on `http://localhost:5173` with proxy to backend `/api`):
   ```bash
   npm run dev
   ```
4. To build production assets:
   ```bash
   npm run build
   ```

---

## 6. Automated Tests & Verification

### Running Backend Tests
Execute the automated test suite covering store isolation, role permissions, restricted fields, and assistant isolation:

```bash
python manage.py test
```

### What the Test Suite Proves:
1. **Store Access Isolation**:
   - `test_user_cannot_access_unassigned_store` (`products.tests`): Staff assigned to Colombo receive `HTTP 403 Forbidden` when attempting to access products in Kandy.
   - `test_admin_cannot_manage_unassigned_store` (`stores.tests`): An administrator of Store A cannot manage users in Store B.
   - `test_user_cannot_query_unassigned_store` (`assistant.tests`): Querying the assistant for an unassigned store ID returns `HTTP 403`.
2. **Role Permissions**:
   - `test_staff_cannot_create_product` (`products.tests`): Staff members receive `HTTP 403` when attempting product creation.
   - `test_manager_cannot_assign_users` & `test_staff_cannot_assign_users` (`stores.tests`): Only store administrators can add or manage users.
3. **Combined Updates & Restricted Fields**:
   - `test_manager_cannot_partially_update_restricted_fields` (`products.tests`): When a manager updates `name` alongside forbidden `supplier`, the server rejects the entire request (`HTTP 403`) and commits zero partial changes to the database.
4. **Assistant Data Isolation**:
   - `test_user_can_query_assigned_store` (`assistant.tests`): Proves that assistant answers contain items strictly from the active store and never leak cross-store products.

### Running Frontend Verification
To verify TypeScript compilation:
```bash
cd frontend
npm run typecheck
```

---

## 7. Key Features Implemented

1. **Sign-In & Multi-Store Selector**:
   - Clean, secure login with organization authentication.
   - Topbar store dropdown allowing quick switching between assigned locations.
2. **Redesigned SaaS Store Overview**:
   - Clean white cards, subtle shadows, and orange accents (`#f97316`).
   - Interactive KPI metrics (click-to-filter by Low Stock, Catalog Value, Active SKUs).
   - Real-time stock alerts for out-of-stock and low-threshold items.
   - Dynamic SVG charts for **Catalog Concentration** (Valuation vs. Units) and **Health Breakdown**.
   - Embedded live **Store Intelligence Assistant** widget.
3. **Product Catalog Management**:
   - Searchable, filterable, sortable inventory table.
   - Modal for creating/editing items with role-aware field restrictions.
4. **Store User Administration**:
   - Administrator-only access to view team memberships, update roles, and invite/create accounts.
5. **AI Store Assistant**:
   - Deterministic NLP responses answering stock queries, pricing queries, product lists, and inventory counts restricted to active store.
