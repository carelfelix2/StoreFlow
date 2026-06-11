# Felix Snack POS — Comprehensive Implementation Plan

> **Generated:** 2026-06-11
> **Status:** Awaiting Approval
> **Target:** MVP → Production

---

## Table of Contents

1. [Module Inventory](#1-module-inventory)
2. [Project Architecture](#2-project-architecture)
3. [Database Relationships](#3-database-relationships)
4. [API Structure](#4-api-structure)
5. [Frontend Structure](#5-frontend-structure)
6. [Authentication Strategy](#6-authentication-strategy)
7. [Realtime Strategy](#7-realtime-strategy)
8. [QRIS Integration Strategy](#8-qris-integration-strategy)
9. [Development Phases (MVP → Production)](#9-development-phases)
10. [Risk Analysis & Mitigation](#10-risk-analysis--mitigation)

---

## 1. Module Inventory

### 1.1 Backend Modules (Laravel API)

| Module | Responsibility | Priority |
|--------|---------------|----------|
| **Auth Module** | Login, logout, session management, role-based access | P0 — Phase 1 |
| **User Management** | CRUD users, role assignment, activate/deactivate | P1 — Phase 1 |
| **Category Module** | CRUD product categories with slug, color, icon | P0 — Phase 2 |
| **Product Module** | CRUD products, multi-unit support, SKU/barcode, stock, pricing | P0 — Phase 2 |
| **Product Unit Module** | Multi-satuan conversion (pcs, renteng, dus, karton) | P0 — Phase 2 |
| **Order Module** | Create/submit/review/approve/cancel/complete orders, status workflow engine | P0 — Phase 3/4 |
| **Cart Module** | Draft order management (staff-side cart persistence) | P0 — Phase 3 |
| **Payment Module** | Cash payment, QRIS generation, webhook handler, manual paid fallback | P0 — Phase 5 |
| **Receipt Module** | Receipt data generation, print status tracking, reprint support | P1 — Phase 6 |
| **Stock Module** | Stock deduction on payment, stock movements (sale, stock_in, adjustment, return, void), low-stock alerts | P0 — Phase 7 |
| **Report Module** | Daily sales, cash vs QRIS, top products, gross profit, stock report | P1 — Phase 8 |
| **Customer Display Module** | Device token management, display session, current order broadcast | P2 — Phase 9 |
| **Store Settings Module** | Store name, address, phone, receipt footer, logo, printer config | P1 — Phase 10 |
| **Audit Log Module** | Order logs, payment logs — immutable audit trail | P0 — baked into Phase 3/5 |

### 1.2 Frontend Modules (Next.js)

| Module | Responsibility | Priority |
|--------|---------------|----------|
| **Auth UI** | Login page, role-based redirect, protected route middleware | P0 — Phase 1 |
| **Dashboard** | Owner dashboard with summary cards, quick actions | P1 — Phase 10 |
| **Product Management UI** | Product table, search, category filter, product form, unit form, low stock badge | P0 — Phase 2 |
| **Staff Order UI** | Mobile-first order input, search, category chips, cart, submit | P0 — Phase 3 |
| **Cashier UI** | Order queue (left), order detail (right), payment panel, realtime updates | P0 — Phase 4/5 |
| **Payment UI** | Cash dialog, QRIS dialog, change calculation, status polling | P0 — Phase 5 |
| **Receipt UI** | Thermal 80mm receipt preview, browser print, reprint | P1 — Phase 6 |
| **Stock UI** | Stock list, low stock alerts, stock adjustment form | P1 — Phase 7 |
| **Reports UI** | Daily sales card, top products table, cash/QRIS breakdown | P1 — Phase 8 |
| **Customer Display UI** | Fullscreen order display, QRIS display, payment success | P2 — Phase 9 |
| **Settings UI** | Store settings form | P2 — Phase 10 |
| **Layout System** | App shell: sidebar (desktop), bottom nav (mobile), header | P0 — Phase 0 |

### 1.3 Shared/Infrastructure Modules

| Module | Responsibility | Priority |
|--------|---------------|----------|
| **API Client** | Centralized Axios/fetch wrapper with auth token injection, error handling | P0 — Phase 0 |
| **Type Definitions** | TypeScript types mirroring backend models (User, Product, Order, Payment, Report) | P0 — Phase 0 |
| **Format Utilities** | `formatCurrency()`, `formatDate()`, `formatOrderNumber()` | P0 — Phase 0 |
| **State Stores (Zustand)** | Cart store, cashier active order store, auth store, UI state | P0 — Phase 0/3 |
| **Validation Schemas (Zod)** | Login, product, order, payment, settings validation | P0 — Phase 0/1 |
| **Realtime Client** | Pusher/Laravel Reverb client with typed event handlers | P0 — Phase 4 |

---

## 2. Project Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT DEVICES                           │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Laptop   │  │ HP Staff │  │ HP Staff │  │ Customer   │  │
│  │ Kasir    │  │ (x3)     │  │ (x3)     │  │ Display    │  │
│  │ 1366x768 │  │ Mobile   │  │ Mobile   │  │ Fullscreen │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│       │             │             │              │          │
└───────┼─────────────┼─────────────┼──────────────┼──────────┘
        │             │             │              │
        ▼             ▼             ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                   NEXT.JS FRONTEND (Vercel)                  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  App Router                                           │   │
│  │  ├── (auth)/login          → Login Page              │   │
│  │  ├── (dashboard)/dashboard → Owner Dashboard         │   │
│  │  ├── (dashboard)/cashier   → Cashier POS Screen      │   │
│  │  ├── (dashboard)/orders    → Order History           │   │
│  │  ├── (dashboard)/products  → Product Management      │   │
│  │  ├── (dashboard)/stock     → Stock Management        │   │
│  │  ├── (dashboard)/reports   → Reports                 │   │
│  │  ├── (dashboard)/settings  → Store Settings          │   │
│  │  ├── staff/order           → Staff Order Input (HP)  │   │
│  │  ├── staff/order-success   → Success Confirmation    │   │
│  │  └── customer-display/[id] → Customer Display        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  State: Zustand (cart, UI) + TanStack Query (data)   │   │
│  │  Forms: React Hook Form + Zod                        │   │
│  │  UI:   shadcn/ui + Tailwind CSS + Lucide Icons       │   │
│  │  Types: /src/types/*.ts                              │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────┬────────────────────────────────────────────────┘
             │ HTTPS (REST + Realtime)
             ▼
┌─────────────────────────────────────────────────────────────┐
│                   LARAVEL API BACKEND (VPS)                  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Controllers → Services → Repositories → Models      │   │
│  │                                                       │   │
│  │  Middleware:                                           │   │
│  │  ├── auth:sanctum (token validation)                  │   │
│  │  ├── role:owner|kasir|staff (role gate)               │   │
│  │  ├── validate:order (order status guards)             │   │
│  │  └── webhook:midtrans (signature validation)          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Events (Realtime):                                   │   │
│  │  ├── order.submitted → Broadcast to cashier          │   │
│  │  ├── order.updated   → Broadcast to related devices  │   │
│  │  ├── payment.paid    → Broadcast to cashier/display  │   │
│  │  └── stock.low       → Broadcast to owner/kasir      │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────┬────────────────────────────────────────────────┘
             │
    ┌────────┼────────┬──────────────┐
    ▼        ▼        ▼              ▼
┌────────┐ ┌──────┐ ┌────────┐ ┌──────────┐
│PostgreSQL│ │Pusher│ │Midtrans│ │Printer   │
│Database │ │/Reverb│ │Gateway │ │(Browser  │
│         │ │       │ │(QRIS)  │ │ Print)   │
└────────┘ └──────┘ └────────┘ └──────────┘
```

### 2.2 Monorepo Structure

```
e:/StoreFlow/
├── frontend/                    # Next.js 15 App
│   ├── src/
│   │   ├── app/                 # App Router pages & layouts
│   │   ├── components/          # React components (organized by domain)
│   │   ├── hooks/               # Custom hooks
│   │   ├── lib/                 # API client, formatters, constants
│   │   ├── store/               # Zustand stores
│   │   └── types/               # TypeScript type definitions
│   ├── public/                  # Static assets (logo, etc.)
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   ├── package.json
│   └── .env.local
│
├── backend/                     # Laravel 11 API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/
│   │   │   ├── Middleware/
│   │   │   └── Resources/
│   │   ├── Models/
│   │   ├── Services/
│   │   ├── Events/
│   │   └── Enums/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── routes/
│   │   └── api.php
│   ├── composer.json
│   └── .env
│
├── docs/                        # All markdown documentation (existing)
│   ├── 00_PROJECT_OVERVIEW.md
│   ├── ...
│   └── 16_IMPLEMENTATION_PLAN.md
│
└── README.md
```

### 2.3 Data Flow

```
Staff HP                    Backend API                    Cashier Laptop
────────                    ───────────                    ──────────────
                                                             
1. Search Products ──────► GET /products ──► Return list     
                                                             
2. Build Cart (local        (Zustand store,                
   state only)              no API call yet)               
                                                             
3. Submit Order ──────────► POST /orders                    
                            ├── Validate stock              
                            ├── Create order (submitted)    
                            ├── Emit order.submitted ──────► 4. Receive realtime
                            └── Return order_number            notification
                                                             
                                                          5. Click order ────────► PATCH /orders/{id}/review
                                                                                     (status → reviewing)
                                                             
                                                          6. Edit items ──────────► PATCH /orders/{id}/items
                                                             
                                                          7. Approve ─────────────► PATCH /orders/{id}/approve
                                                                                     (status → approved)
                                                             
                                                          8. Cash Payment ────────► POST /orders/{id}/payments/cash
                                                                                     ├── Validate amount
                                                                                     ├── Create payment (paid)
                                                                                     ├── Reduce stock
                                                                                     ├── Create stock_movement
                                                                                     ├── Emit payment.paid ───► Customer Display
                                                                                     └── Return receipt data
                                                             
                                                          9. Print Receipt ───────► POST /orders/{id}/print
                                                                                     (status → printed)
```

### 2.4 Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Frontend-Backend Separation** | Next.js (frontend) + Laravel (API) | Separation of concerns; Laravel excels at API/ORM/queues; Next.js excels at React/SSR |
| **API Style** | REST + Realtime Events | REST for CRUD; WebSocket/Pusher for realtime order queue |
| **State Management** | Zustand (local UI/cart) + TanStack Query (server data) | Zustand is minimal and fast for POS cart; TanStack Query handles caching/revalidation/mutations |
| **Database** | PostgreSQL | Rich enum support, better for multi-tenant (SaaS future), JSONB for logs |
| **Auth** | Laravel Sanctum (token-based) | Stateless token auth for SPA; simple setup; no OAuth complexity needed for POS |
| **Payment Gateway** | Midtrans (sandbox → production) | Best Indonesian docs; QRIS support built-in; webhook infrastructure |
| **Realtime** | Pusher (MVP) → Laravel Reverb (self-host) | Pusher is zero-config for MVP; Reverb for cost savings at scale |
| **Printing** | Browser `window.print()` with thermal CSS (MVP) → QZ Tray/ESC/POS (v2) | Browser print works immediately with zero setup; ESC/POS for production quality |
| **Deployment** | Vercel (frontend) + VPS (backend + DB) | Vercel free tier sufficient for frontend; VPS for backend control and Midtrans webhook stability |

---

## 3. Database Relationships

### 3.1 Entity Relationship Diagram (ERD)

```
┌──────────────┐       ┌──────────────────┐
│   users      │       │  store_settings   │
├──────────────┤       ├──────────────────┤
│ id (PK)      │       │ id (PK)          │
│ name         │       │ store_name       │
│ email (UQ)   │       │ address          │
│ password     │       │ phone            │
│ role (ENUM)  │       │ receipt_footer   │
│ is_active    │       │ logo             │
│ created_at   │       │ qris_provider    │
│ updated_at   │       │ printer_type     │
└──────┬───────┘       │ created_at       │
       │               │ updated_at       │
       │               └──────────────────┘
       │
       │ (created_by)          (cashier_id)
       │  ┌──────────────────────────┘
       ▼  ▼
┌──────────────────────────────────────────────────────────┐
│                        orders                             │
├──────────────────────────────────────────────────────────┤
│ id (PK)                    │ customer_id (FK, nullable)  │
│ order_number (UQ)          │ created_by (FK → users)     │
│ cashier_id (FK → users)    │ status (ENUM: draft..voided)│
│ subtotal                   │ discount_total              │
│ tax_total                  │ grand_total                 │
│ notes                      │ submitted_at                │
│ approved_at                │ paid_at                     │
│ completed_at               │ cancelled_at                │
│ created_at / updated_at                                   │
└──────┬────────────┬────────────────┬─────────────────────┘
       │            │                │
       │  ┌─────────┘                └──────────────┐
       ▼  ▼                                         ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐
│ order_items  │  │  payments    │  │   order_logs         │
├──────────────┤  ├──────────────┤  ├──────────────────────┤
│ id (PK)      │  │ id (PK)      │  │ id (PK)              │
│ order_id(FK) │  │ order_id(FK) │  │ order_id (FK)        │
│ product_id   │  │ method(ENUM) │  │ user_id (FK, null)   │
│ product_name │  │ status(ENUM) │  │ action               │
│ unit_name    │  │ amount       │  │ old_value (JSON)     │
│ qty          │  │ paid_amount  │  │ new_value (JSON)     │
│ conversion   │  │ change_amount│  │ created_at           │
│ base_qty     │  │ gateway      │  └──────────────────────┘
│ price        │  │ gateway_ref  │
│ cost_price   │  │ qris_url     │  ┌──────────────────────┐
│ subtotal     │  │ expired_at   │  │   payment_logs       │
│ created_at   │  │ paid_at      │  ├──────────────────────┤
│ updated_at   │  │ created_at   │  │ id (PK)              │
└──────┬───────┘  │ updated_at   │  │ payment_id (FK)      │
       │          └──────────────┘  │ event                │
       │                            │ payload (JSON)       │
       │ (product_id)               │ created_at           │
       ▼                            └──────────────────────┘
┌──────────────────────────────────────────┐
│               products                    │
├──────────────────────────────────────────┤
│ id (PK)              │ category_id (FK)  │
│ name                 │ sku (UQ, nullable)│
│ barcode (nullable)   │ image (nullable)  │
│ base_unit            │ cost_price        │
│ selling_price        │ stock             │
│ min_stock            │ is_active         │
│ created_at / updated_at                  │
└──────┬───────────────────────────────────┘
       │
       ├──────────────────────────┐
       ▼                          ▼
┌──────────────┐  ┌──────────────────────────────┐
│  categories  │  │       product_units           │
├──────────────┤  ├──────────────────────────────┤
│ id (PK)      │  │ id (PK)                      │
│ name         │  │ product_id (FK → products)   │
│ slug (UQ)    │  │ unit_name                    │
│ color        │  │ conversion_to_base           │
│ icon         │  │ selling_price                │
│ is_active    │  │ is_default                   │
│ created_at   │  │ created_at / updated_at      │
│ updated_at   │  └──────────────────────────────┘
└──────────────┘
                                          
┌──────────────────────────────────────────┐
│             stock_movements              │
├──────────────────────────────────────────┤
│ id (PK)          │ product_id (FK)       │
│ order_id (FK)    │ type (ENUM)           │
│ qty              │ stock_before          │
│ stock_after      │ notes (nullable)      │
│ created_by (FK)  │ created_at            │
└──────────────────┴───────────────────────┘

┌──────────────────────┐
│      customers       │
├──────────────────────┤
│ id (PK)              │
│ name                 │
│ phone (nullable)     │
│ address (nullable)   │
│ type (ENUM)          │
│ created_at/updated_at│
└──────────────────────┘
```

### 3.2 Relationship Summary

| Parent | Child | Type | On Delete | Notes |
|--------|-------|------|-----------|-------|
| `categories` | `products` | 1:N | RESTRICT | Cannot delete category with products |
| `products` | `product_units` | 1:N | CASCADE | Units deleted with product |
| `products` | `order_items` | 1:N | RESTRICT | Cannot delete sold products (soft delete instead) |
| `products` | `stock_movements` | 1:N | RESTRICT | Audit trail preserved |
| `users` | `orders` (created_by) | 1:N | RESTRICT | Staff record preserved |
| `users` | `orders` (cashier_id) | 1:N | SET NULL | Cashier may be deactivated |
| `users` | `stock_movements` | 1:N | RESTRICT | Audit trail |
| `customers` | `orders` | 1:N | SET NULL | Optional customer reference |
| `orders` | `order_items` | 1:N | CASCADE | Items deleted with order |
| `orders` | `payments` | 1:1 | CASCADE | One payment per order |
| `orders` | `order_logs` | 1:N | CASCADE | Logs cleaned with order |
| `orders` | `stock_movements` | 1:N | RESTRICT | Stock movement preserved |
| `payments` | `payment_logs` | 1:N | CASCADE | Logs cleaned with payment |
| `store_settings` | — | singleton | — | Single row table |

### 3.3 Critical Data Integrity Rules

1. **Price Snapshots**: `order_items.price` and `order_items.cost_price` are snapshots at order time. Never JOIN to `products.selling_price` for historical orders.
2. **Stock Deduction Timing**: Stock decrements ONLY on `payment.status = 'paid'`. Never on order submission or approval.
3. **Grand Total Recalculation**: Backend MUST recalculate `grand_total` on every order mutation. Never trust `grand_total` from the frontend.
4. **Order Status State Machine**: Status transitions enforced at the application layer (see [Section 4.3](#43-order-status-state-machine)).
5. **Webhook Idempotency**: `gateway_reference` on payments is unique. Re-processed webhooks must be ignored if payment already `paid`.
6. **Soft Delete for Products**: Products with existing `order_items` cannot be hard-deleted. Use `is_active = false`.
7. **Stock Movement Immutability**: `stock_movements` rows are append-only. Never update or delete.

---

## 4. API Structure

### 4.1 Complete Endpoint Map

```
Base URL: /api

AUTH ─────────────────────────────────────────────
POST   /auth/login              # Login, returns user + token
POST   /auth/logout             # Revoke current token
GET    /auth/me                 # Current authenticated user

CATEGORIES ───────────────────────────────────────
GET    /categories              # List all active categories
POST   /categories              # Create category (owner)
GET    /categories/{id}         # Show category
PUT    /categories/{id}         # Update category (owner)
DELETE /categories/{id}         # Delete category (owner, if no products)

PRODUCTS ────────────────────────────────────────
GET    /products                # List/search products
       ?search=                 # Text search (name, sku)
       ?category_id=            # Filter by category
       ?is_active=              # true/false
       ?low_stock=              # true filters stock ≤ min_stock
       ?page= &per_page=        # Pagination
POST   /products                # Create product + units (owner)
GET    /products/{id}           # Product detail with units
PUT    /products/{id}           # Update product (owner)
DELETE /products/{id}           # Soft delete (owner)
PATCH  /products/{id}/toggle    # Toggle is_active (owner)
GET    /products/low-stock      # Products with stock ≤ min_stock

PRODUCT UNITS ────────────────────────────────────
GET    /products/{id}/units     # List units for a product
POST   /products/{id}/units     # Add unit (owner)
PUT    /products/{id}/units/{unitId}  # Update unit (owner)
DELETE /products/{id}/units/{unitId}  # Delete unit (owner)

ORDERS ──────────────────────────────────────────
POST   /orders                  # Create draft or submitted order (staff)
GET    /orders                  # List orders
       ?status=                 # submitted, reviewing, approved, etc.
       ?date=                   # YYYY-MM-DD
       ?created_by=             # Filter by staff user
       ?cashier_id=             # Filter by cashier
GET    /orders/{id}             # Order detail with items
PATCH  /orders/{id}/review      # Set status → reviewing (kasir)
PATCH  /orders/{id}/items       # Edit items before paid (kasir)
PATCH  /orders/{id}/approve     # Set status → approved (kasir)
PATCH  /orders/{id}/cancel      # Set status → cancelled (staff/kasir, before paid)
PATCH  /orders/{id}/complete    # Set status → completed (kasir)

PAYMENTS ────────────────────────────────────────
POST   /orders/{id}/payments/cash     # Process cash payment
POST   /orders/{id}/payments/qris     # Generate QRIS payment
GET    /payments/{id}/status          # Check payment status (polling)
POST   /payments/webhook              # Midtrans webhook (public, signature-validated)
PATCH  /payments/{id}/manual-paid     # Manual mark as paid (owner/kasir fallback)

RECEIPT ─────────────────────────────────────────
GET    /orders/{id}/receipt      # Get receipt data for display/print
POST   /orders/{id}/print        # Mark order as printed

REPORTS ─────────────────────────────────────────
GET    /reports/daily            # Daily sales report
       ?date=                    # YYYY-MM-DD (default: today)
GET    /reports/products         # Product sales ranking
       ?start_date= &end_date=   # Date range
GET    /reports/stock            # Current stock levels
       ?low_stock=               # true filters stock ≤ min_stock
GET    /reports/payments         # Payment method breakdown
       ?start_date= &end_date=   # Date range

STOCK ───────────────────────────────────────────
GET    /stock/movements          # Stock movement history
       ?product_id=              # Filter by product
       ?type=                    # sale, stock_in, adjustment, return, void
       ?start_date= &end_date=   # Date range
POST   /stock/adjustment         # Manual stock adjustment (owner)

STORE SETTINGS ──────────────────────────────────
GET    /settings                 # Get store settings
PUT    /settings                 # Update store settings (owner)

USERS ───────────────────────────────────────────
GET    /users                    # List users (owner)
POST   /users                    # Create user (owner)
GET    /users/{id}               # User detail (owner)
PUT    /users/{id}               # Update user (owner)
DELETE /users/{id}               # Deactivate user (owner)
```

### 4.2 API Response Envelope

All responses follow a consistent envelope:

```json
// Success
{
  "success": true,
  "data": { ... },
  "message": "Order created successfully"
}

// Success (collection)
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 150,
    "last_page": 8
  }
}

// Error
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": ["Email sudah terdaftar"],
    "items": ["Minimal 1 item dalam pesanan"]
  }
}
```

### 4.3 Order Status State Machine

```
                    ┌──────────────────────────────┐
                    │          Any status           │
                    │      (before paid only)       │
                    └──────┬───────────────────────┘
                           │ cancel()
                           ▼
                    ┌──────────────┐
                    │  cancelled   │ (terminal)
                    └──────────────┘

  ┌──────────┐  submit()  ┌────────────┐  review()  ┌───────────┐
  │  draft   │ ─────────► │ submitted  │ ─────────► │ reviewing │
  └──────────┘            └────────────┘            └─────┬─────┘
                                                          │
                                              ┌───────────┘
                                              │ approve()
                                              ▼
                                        ┌──────────────┐
                                        │  approved    │
                                        └──────┬───────┘
                                               │ pay()
                                               ▼
                                        ┌────────────────┐
                                        │ waiting_payment│
                                        └──────┬─────────┘
                                               │ webhook/cash
                                               ▼
                                        ┌──────────────┐
                                        │    paid      │
                                        └──────┬───────┘
                                               │ print()
                                               ▼
                                        ┌──────────────┐
                                        │   printed    │
                                        └──────┬───────┘
                                               │ complete()
                                               ▼
                                        ┌──────────────┐
                                        │  completed   │ (terminal)
                                        └──────────────┘

  ┌──────────┐  void()   ┌──────────┐
  │   paid   │ ─────────►│  voided  │ (terminal, owner only)
  │completed │           └──────────┘
  └──────────┘
```

**Transition Matrix:**

| From | To | Allowed Roles | Conditions |
|------|----|---------------|------------|
| `draft` | `submitted` | staff | cart has items |
| `submitted` | `reviewing` | owner, kasir | — |
| `submitted` | `cancelled` | staff (own), owner, kasir | — |
| `reviewing` | `approved` | owner, kasir | items validated |
| `reviewing` | `cancelled` | owner, kasir | — |
| `approved` | `waiting_payment` | owner, kasir | payment initiated |
| `approved` | `cancelled` | owner, kasir | — |
| `waiting_payment` | `paid` | system (webhook) / owner, kasir (manual) | payment confirmed |
| `paid` | `printed` | owner, kasir | receipt printed |
| `printed` | `completed` | owner, kasir | — |
| `paid` | `voided` | owner only | refund processed |
| `completed` | `voided` | owner only | refund processed |
| Any (not paid/completed/voided) | `cancelled` | per above | — |

### 4.4 Middleware Pipeline

```
Request
  │
  ▼
┌──────────────────┐
│ CORS Middleware   │ → Allow frontend origin
└──────┬───────────┘
       ▼
┌──────────────────┐
│ Auth Middleware   │ → Validate Sanctum token
└──────┬───────────┘
       ▼
┌──────────────────┐
│ Role Middleware   │ → Check role permission for route
└──────┬───────────┘
       ▼
┌──────────────────┐
│ Validation        │ → FormRequest validation
└──────┬───────────┘
       ▼
┌──────────────────┐
│ Controller        │ → Delegate to Service
└──────┬───────────┘
       ▼
┌──────────────────┐
│ Service Layer     │ → Business logic, DB transactions
└──────┬───────────┘
       ▼
┌──────────────────┐
│ Response          │ → JSON envelope
└──────────────────┘
```

**Special: Webhook Middleware**

```
POST /payments/webhook
  │
  ▼
┌─────────────────────────┐
│ No auth (public route)   │
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│ Signature Validation     │ → Verify Midtrans signature hash
│ (X-Signature-Key header) │   using server key
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│ Idempotency Check        │ → If gateway_reference already processed → 200 OK (no-op)
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│ Amount Validation        │ → Webhook amount must match order grand_total
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│ Process Payment          │ → Update payment + order status, reduce stock
└─────────────────────────┘
```

---

## 5. Frontend Structure

### 5.1 Component Tree by Role

#### 5.1.1 Staff (Mobile — `/staff/order`)

```
StaffOrderPage (server component — metadata)
└── StaffOrderClient (client component — all interactivity)
    ├── ProductSearch
    │   ├── SearchInput (with debounce)
    │   └── BarcodeScanButton (v2)
    ├── CategoryChips
    │   └── Chip[] (horizontal scroll, "All" default selected)
    ├── ProductGrid
    │   └── ProductCard[] (name, price, stock indicator)
    │       └── QuantityControl (+ / qty / -)
    ├── CartDrawer / CartSheet (shadcn Sheet from bottom)
    │   ├── CartItem[] (product name, unit, qty, subtotal)
    │   ├── CustomerNameInput (optional)
    │   ├── NotesInput (optional)
    │   ├── CartTotal
    │   └── SubmitOrderButton
    └── OrderSuccessOverlay (shown after submit, redirect to success page)
```

#### 5.1.2 Cashier (Desktop — `/cashier`)

```
CashierPage
├── CashierHeader (store name, cashier name, current time, logout)
├── OrderQueue (left panel, ~40% width)
│   ├── QueueTabs (Menunggu | Diproses | Selesai)
│   └── OrderCard[] (order_number, customer_name, total, time ago)
│       └── StatusBadge
├── OrderDetailPanel (right panel, ~60% width)
│   ├── OrderHeader (order_number, status badge, customer, staff)
│   ├── OrderItemList
│   │   └── OrderItemRow[] (name, qty, unit, price, subtotal)
│   │       ├── EditQtyButton
│   │       └── RemoveItemButton
│   ├── OrderSummary (subtotal, discount, grand_total — large font)
│   └── ActionBar
│       ├── ReviewButton
│       ├── ApproveButton
│       ├── CancelButton
│       ├── CashPaymentButton
│       └── QRISPaymentButton
├── CashPaymentDialog (shadcn Dialog)
│   ├── TotalDisplay (large)
│   ├── CashReceivedInput (numeric, auto-focus)
│   ├── ChangeDisplay (calculated: received - total, red if negative)
│   └── ConfirmPaymentButton
├── QRISPaymentDialog (shadcn Dialog)
│   ├── TotalDisplay (large)
│   ├── QRCodeImage (large, centered)
│   ├── ExpiryCountdown
│   ├── StatusPollingIndicator ("Menunggu pembayaran...")
│   ├── CheckStatusButton
│   └── SwitchToCashButton
└── EmptyState (when no order selected)
```

#### 5.1.3 Owner Dashboard (`/dashboard`)

```
DashboardPage
├── SummaryCards
│   ├── TodaySalesCard (total, percentage vs yesterday)
│   ├── TransactionCountCard
│   ├── CashTotalCard
│   └── QRISTotalCard
├── QuickActions
│   ├── GoToCashierButton
│   ├── AddProductButton
│   └── ViewReportsButton
├── LowStockAlertSection
│   └── LowStockProductList
└── RecentTransactionsTable (last 10 orders)
```

#### 5.1.4 Customer Display (`/customer-display/[deviceId]`)

```
CustomerDisplayPage (fullscreen, no chrome)
├── IdleState ("Selamat Datang di Felix Snack Store")
├── OrderDisplayState
│   ├── StoreName
│   ├── OrderItemList (large font, scrollable)
│   ├── TotalDisplay (very large, bold)
│   └── StatusMessage
├── QRISDisplayState
│   ├── TotalDisplay
│   ├── QRCodeImage (very large, centered)
│   └── InstructionText ("Silakan scan QRIS untuk membayar")
└── SuccessState
    ├── CheckmarkAnimation (simple CSS, no heavy animation)
    ├── TotalDisplay
    └── ThankYouMessage
```

### 5.2 State Management Architecture

```
┌──────────────────────────────────────────────────┐
│                   ZUSTAND STORES                   │
│                                                    │
│  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │ authStore        │  │ orderCartStore           │ │
│  │ - user           │  │ - items[]                │ │
│  │ - token          │  │ - customerName           │ │
│  │ - isAuth         │  │ - notes                  │ │
│  │ - login()        │  │ - addItem()              │ │
│  │ - logout()       │  │ - removeItem()           │ │
│  │                  │  │ - updateQty()            │ │
│  │                  │  │ - clearCart()            │ │
│  │                  │  │ - getTotal()             │ │
│  │                  │  │ - submitOrder()          │ │
│  └─────────────────┘  └─────────────────────────┘ │
│                                                    │
│  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │ cashierStore     │  │ uiStore                  │ │
│  │ - activeOrderId  │  │ - sidebarOpen            │ │
│  │ - activeOrder    │  │ - paymentDialog          │ │
│  │ - queue[]        │  │ - toasts[]               │ │
│  │ - setActive()    │  │ - toggleSidebar()        │ │
│  │ - addToQueue()   │  │ - openDialog()           │ │
│  │ - updateOrder()  │  │ - addToast()             │ │
│  │ - removeOrder()  │  └─────────────────────────┘ │
│  └─────────────────┘                               │
│                                                    │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│              TANSTACK QUERY (Server State)         │
│                                                    │
│  useProducts(filters)     → GET /products          │
│  useProduct(id)           → GET /products/{id}     │
│  useCategories()          → GET /categories        │
│  useOrders(filters)       → GET /orders            │
│  useOrder(id)             → GET /orders/{id}       │
│  useDailyReport(date)     → GET /reports/daily     │
│  useStockMovements(f)     → GET /stock/movements   │
│                                                    │
│  useCreateProduct()       → POST /products         │
│  useUpdateProduct()       → PUT /products/{id}     │
│  useCreateOrder()         → POST /orders           │
│  useApproveOrder()        → PATCH /orders/{id}/approve │
│  useProcessCashPayment()  → POST /orders/{id}/payments/cash │
│  useGenerateQRIS()        → POST /orders/{id}/payments/qris  │
│  useCheckPaymentStatus()  → GET /payments/{id}/status         │
│                                                    │
└──────────────────────────────────────────────────┘
```

### 5.3 Route Group Layouts

```
app/
├── layout.tsx                          # Root layout (providers, fonts)
│
├── (auth)/
│   ├── layout.tsx                      # Centered card layout, no sidebar
│   └── login/
│       └── page.tsx                    # Login form
│
├── (dashboard)/
│   ├── layout.tsx                      # Sidebar + Header shell
│   ├── dashboard/
│   │   └── page.tsx                    # Owner dashboard
│   ├── cashier/
│   │   └── page.tsx                    # Cashier POS screen
│   ├── orders/
│   │   ├── page.tsx                    # Order history list
│   │   └── [id]/
│   │       └── page.tsx                # Order detail
│   ├── products/
│   │   └── page.tsx                    # Product management
│   ├── stock/
│   │   └── page.tsx                    # Stock management
│   ├── reports/
│   │   └── page.tsx                    # Reports dashboard
│   └── settings/
│       └── page.tsx                    # Store settings
│
├── staff/
│   ├── layout.tsx                      # Mobile shell (no sidebar, bottom nav)
│   ├── order/
│   │   └── page.tsx                    # Staff order input
│   └── order-success/
│       └── page.tsx                    # Order success confirmation
│
└── customer-display/
    └── [deviceId]/
        └── page.tsx                    # Fullscreen customer display
```

---

## 6. Authentication Strategy

### 6.1 Overview

**Method:** Token-based authentication using Laravel Sanctum (SPA mode with `createToken` API tokens).

**Why not Session/Cookie Auth:**
- Multiple device types (mobile browser, desktop, customer display)
- Customer display uses device tokens, not user credentials
- Simpler for API-first architecture
- Easier to extend for SaaS multi-tenant (v3)

### 6.2 Token Lifecycle

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│  LOGIN   │                    │  ACTIVE  │                    │  LOGOUT  │
│          │                    │  SESSION │                    │          │
│ POST     │ ──── success ────► │          │ ──── POST ───────► │ Token    │
│ /auth/   │     returns:       │ Token in │     /auth/logout   │ revoked  │
│ login    │     user + token   │ Header   │                    │          │
└──────────┘                    └──────────┘                    └──────────┘
                                     │
                                     │ (no refresh token — use long-lived token)
                                     │ Token stored in:
                                     │ - authStore (Zustand) in memory
                                     │ - localStorage for persistence across reloads
                                     ▼
                              ┌──────────────────┐
                              │  API REQUESTS     │
                              │  Authorization:   │
                              │  Bearer {token}   │
                              └──────────────────┘
```

### 6.3 Frontend Auth Flow

```typescript
// 1. Login
POST /api/auth/login { email, password }
→ Receive { user: { id, name, role }, token }
→ Store in authStore + localStorage
→ Redirect based on role:
   - owner → /dashboard
   - kasir → /cashier
   - staff → /staff/order

// 2. Page Load (rehydrate)
→ Check localStorage for token
→ Call GET /api/auth/me with stored token
→ If valid: restore session → redirect to role-default page
→ If invalid: clear storage → redirect to /login

// 3. API Client Interceptor
→ Attach Authorization: Bearer {token} to all requests
→ On 401 response: clear auth → redirect to /login

// 4. Logout
POST /api/auth/logout
→ Backend revokes token
→ Clear authStore + localStorage
→ Redirect to /login
```

### 6.4 Role-Based Access Control (Frontend)

```typescript
// Middleware (next.config or middleware.ts)
// Route protection by path prefix:

// /cashier, /dashboard, /orders, /products, /stock, /reports, /settings
// → Requires role: owner | kasir

// /staff/*
// → Requires role: owner | kasir | staff

// /customer-display/*
// → Public (device token validated, optional)

// /login
// → Public, redirect to role-default if already authenticated
```

### 6.5 Role-Based Access Control (Backend)

```php
// Laravel Gates defined in AuthServiceProvider:

Gate::define('manage-products', fn(User $user) => $user->role === 'owner');
Gate::define('manage-users', fn(User $user) => $user->role === 'owner');
Gate::define('view-reports', fn(User $user) => in_array($user->role, ['owner', 'kasir']));
Gate::define('process-payment', fn(User $user) => in_array($user->role, ['owner', 'kasir']));
Gate::define('create-order', fn(User $user) => in_array($user->role, ['owner', 'kasir', 'staff']));
Gate::define('void-transaction', fn(User $user) => $user->role === 'owner');

// Applied via middleware in routes/api.php:
Route::middleware(['auth:sanctum', 'can:manage-products'])->group(...)
```

### 6.6 Customer Display Auth

Customer display does NOT use user credentials. Instead:

```
1. Owner/Kasir opens /customer-display on the monitor.
2. The page generates or reads a deviceId from URL/query param.
3. Option 1: deviceId is a static UUID configured in store_settings.
4. Option 2: Owner generates a temporary display token from settings page.
5. The display subscribes to realtime channel using deviceId (not user token).
6. Backend broadcasts order/payment events to the device-specific channel.
```

The display page is effectively a "public view" scoped to a device. No sensitive data is exposed beyond what customers should see.

### 6.7 Security Rules

| Rule | Implementation |
|------|---------------|
| Password hashing | Laravel's bcrypt (default) |
| Token storage (frontend) | localStorage (acceptable for POS internal network) |
| Token lifetime | Long-lived (convenience for POS), revocable |
| CORS | Only allow `FRONTEND_URL` |
| Rate limiting | Apply to `/auth/login` (5 attempts/minute), `/payments/webhook` (no limit) |
| HTTPS | Required in production (Vercel + Nginx reverse proxy on VPS) |
| Sensitive data | Never return `password`, `cost_price` to staff role, `server_key` to frontend |

---

## 7. Realtime Strategy

### 7.1 Channel Architecture

```
┌──────────────────────────────────────────────────┐
│                  PUSHER / REVERB                    │
│                                                    │
│  CHANNELS:                                         │
│                                                    │
│  ┌────────────────────────────────────────────┐   │
│  │ private-cashier                             │   │
│  │   Events: order.submitted, order.updated,   │   │
│  │           payment.paid, stock.low           │   │
│  │   Subscribers: owner, kasir                 │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  ┌────────────────────────────────────────────┐   │
│  │ private-staff.{userId}                       │   │
│  │   Events: order.status_changed              │   │
│  │   Subscribers: specific staff user           │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  ┌────────────────────────────────────────────┐   │
│  │ presence-customer-display.{deviceId}         │   │
│  │   Events: display.order_update,             │   │
│  │           display.qris_show,                │   │
│  │           display.payment_success           │   │
│  │   Subscribers: customer display device       │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
└──────────────────────────────────────────────────┘
```

### 7.2 Event Catalog

| Event | Channel | Trigger | Payload | Frontend Handler |
|-------|---------|---------|---------|------------------|
| `order.submitted` | `private-cashier` | `POST /orders` (status=submitted) | `{ order_id, order_number, grand_total, customer_name, created_by_name }` | Add to order queue, toast notification, play sound |
| `order.reviewing` | `private-cashier` | `PATCH /orders/{id}/review` | `{ order_id, cashier_name }` | Update queue item status, remove from "waiting" tab |
| `order.approved` | `private-cashier` | `PATCH /orders/{id}/approve` | `{ order_id }` | Update queue item status |
| `order.cancelled` | `private-cashier` | `PATCH /orders/{id}/cancel` | `{ order_id }` | Remove from queue |
| `order.updated` | `private-cashier` | `PATCH /orders/{id}/items` | `{ order_id, items[], grand_total }` | Refresh order detail if active |
| `order.status_changed` | `private-staff.{userId}` | Any status change | `{ order_id, order_number, status }` | Update staff order status view |
| `payment.paid` | `private-cashier` | Webhook / manual paid | `{ order_id, payment_method, amount }` | Update queue, show success, trigger print |
| `payment.paid` | `presence-customer-display.{deviceId}` | Webhook / manual paid | `{ order_id, amount }` | Show success state |
| `display.order_update` | `presence-customer-display.{deviceId}` | Cashier opens order | `{ order_id, items[], grand_total, status }` | Update display with current order |
| `display.qris_show` | `presence-customer-display.{deviceId}` | QRIS generated | `{ order_id, qris_url, amount, expired_at }` | Show QRIS on display |
| `stock.low` | `private-cashier` | Stock drops below min_stock | `{ product_id, name, current_stock, min_stock }` | Toast warning on dashboard/cashier |

### 7.3 Frontend Realtime Hook

```typescript
// hooks/useRealtimeOrders.ts

interface UseRealtimeOrdersOptions {
  onNewOrder?: (order: OrderQueueItem) => void;
  onOrderUpdated?: (orderId: string, data: Partial<Order>) => void;
  onPaymentPaid?: (orderId: string, method: string) => void;
}

function useRealtimeOrders(options: UseRealtimeOrdersOptions) {
  // Subscribe to private-cashier channel
  // Bind to order.submitted → options.onNewOrder
  // Bind to order.updated → options.onOrderUpdated
  // Bind to payment.paid → options.onPaymentPaid
  // Auto-unsubscribe on unmount
}
```

### 7.4 Reconnection & Offline Handling

- Pusher automatically reconnects with exponential backoff.
- On reconnect, refetch active orders via `GET /orders?status=submitted,reviewing,approved,waiting_payment` to get current state.
- Staff side: order submission is an HTTP POST (not realtime-dependent). Realtime is only for status updates back to staff — if disconnected, staff can manually refresh their status page.
- Customer display: if disconnected, show "Reconnecting..." message.

### 7.5 MVP vs Production

| Aspect | MVP (Pusher) | Production (Laravel Reverb) |
|--------|-------------|----------------------------|
| Setup | Sign up, paste keys | Deploy Reverb on VPS |
| Cost | Free tier (200k msg/day, 100 connections) | Self-hosted, no per-message cost |
| Latency | ~100-200ms (Southeast Asia) | ~10-50ms (same VPS) |
| Migration | — | Swap env vars, no code changes (both use Pusher protocol) |

---

## 8. QRIS Integration Strategy

### 8.1 Provider: Midtrans

Midtrans is chosen because:
- Best Indonesian documentation and community support
- QIRIS is built-in as a payment channel (`gopay` → QRIS)
- Sandbox environment for development
- Webhook infrastructure is mature
- Supports both dynamic and static QRIS

### 8.2 Integration Flow (Detailed)

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Kasir   │    │ Frontend │    │ Backend  │    │ Midtrans │
│  Laptop  │    │ Next.js  │    │ Laravel  │    │   API    │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │
     │ 1. Click QRIS │               │               │
     │──────────────►│               │               │
     │               │               │               │
     │               │ 2. POST       │               │
     │               │ /orders/{id}/ │               │
     │               │ payments/qris │               │
     │               │──────────────►│               │
     │               │               │               │
     │               │               │ 3. POST       │
     │               │               │ /v2/charge    │
     │               │               │ (server key)  │
     │               │               │──────────────►│
     │               │               │               │
     │               │               │ 4. Response:  │
     │               │               │ {             │
     │               │               │   status_code │
     │               │               │   transaction_│
     │               │               │   id,         │
     │               │               │   actions[0]  │
     │               │               │   .url        │  ← QRIS URL
     │               │               │ }             │
     │               │               │◄──────────────│
     │               │               │               │
     │               │ 5. Return     │               │
     │               │ { qris_url,   │               │
     │               │   payment_id, │               │
     │               │   expired_at }│               │
     │               │◄──────────────│               │
     │               │               │               │
     │ 6. Show QRIS  │               │               │
     │◄──────────────│               │               │
     │               │               │               │
     │ 7. Emit display.qris_show     │               │
     │   → Customer Display          │               │
     │               │               │               │
     │               │               │               │
     │               │               │ 8. Midtrans   │
     │               │               │   Webhook     │
     │               │               │◄──────────────│
     │               │               │ (POST /api/   │
     │               │               │  payments/    │
     │               │               │  webhook)     │
     │               │               │               │
     │               │               │ 9. Validate   │
     │               │               │ signature,    │
     │               │               │ amount        │
     │               │               │               │
     │               │               │ 10. Update    │
     │               │               │ payment=paid, │
     │               │               │ order=paid,   │
     │               │               │ reduce stock  │
     │               │               │               │
     │               │ 11. Emit payment.paid         │
     │               │◄──────────────│               │
     │               │               │               │
     │ 12. Update UI│               │               │
     │ (paid, print)│               │               │
     │◄──────────────│               │               │
     │               │               │               │
```

### 8.3 Midtrans API Integration Points

| Operation | Midtrans API | Notes |
|-----------|-------------|-------|
| Create QRIS transaction | `POST https://api.midtrans.com/v2/charge` | `payment_type: "gopay"` for QRIS |
| Receive payment notification | `POST /api/payments/webhook` (our endpoint) | Called by Midtrans |
| Manual status check | `GET https://api.midtrans.com/v2/{order_id}/status` | For "Cek Status" button |
| Cancel transaction | `POST https://api.midtrans.com/v2/{order_id}/cancel` | When cashier switches to cash |

### 8.4 Webhook Security

```php
// In MidtransWebhook middleware or service:

function validateWebhook(Request $request): bool {
    // 1. Validate signature
    $signatureKey = hash('sha512',
        $request->order_id .
        $request->status_code .
        $request->gross_amount .
        config('midtrans.server_key')
    );
    
    if ($signatureKey !== $request->header('X-Signature-Key')) {
        Log::warning('Midtrans webhook: invalid signature', $request->all());
        return false; // 401
    }
    
    // 2. Validate amount matches order grand_total
    $payment = Payment::where('gateway_reference', $request->transaction_id)->first();
    if (!$payment || $payment->amount != $request->gross_amount) {
        Log::warning('Midtrans webhook: amount mismatch', [
            'expected' => $payment?->amount,
            'received' => $request->gross_amount,
        ]);
        return false; // 400 — don't process, investigate
    }
    
    // 3. Idempotency — if already paid, return 200 (no-op)
    if ($payment->status === 'paid') {
        return 'already_paid'; // Special flag
    }
    
    return true;
}
```

### 8.5 QRIS Fallback Strategy

```
QRIS Generation Fails?
├── Network error → Show "QRIS gagal dibuat. Coba lagi atau gunakan Cash."
│   └── Kasir clicks: Retry | Switch to Cash
│
├── Midtrans returns error → Same as above, log error detail
│
└── QRIS generated but webhook never arrives (customer paid but no callback)?
    ├── Kasir clicks "Cek Status" → GET /payments/{id}/status
    │   ├── Paid → Process normally
    │   ├── Pending → Continue waiting
    │   └── Expired → Offer retry or switch to Cash
    │
    └── Kasir clicks "Tandai Sudah Dibayar" (manual fallback)
        └── Only if: customer shows payment proof in their app
        └── Requires: owner/kasir role
        └── Logs: manual_paid event in payment_logs with user_id
```

### 8.6 Midtrans Environments

| Environment | Base URL | Notes |
|-------------|----------|-------|
| Sandbox | `https://api.sandbox.midtrans.com` | Development & testing |
| Production | `https://api.midtrans.com` | Live transactions |

Switching is controlled by `MIDTRANS_IS_PRODUCTION` env variable.

### 8.7 Testing QRIS Without Real Payments

During development, use Midtrans Sandbox:
1. Register at [midtrans.com](https://midtrans.com)
2. Get sandbox server key & client key
3. Use Midtrans simulator to trigger webhook callbacks
4. Test cards/GoPay simulation URLs provided by Midtrans

---

## 9. Development Phases

### Phase 0: Project Setup & Foundation (Days 1–2)

**Goal:** Two runnable projects with all tooling configured.

**Backend:**
- [ ] Create Laravel 11 project (`composer create-project laravel/laravel backend`)
- [ ] Configure PostgreSQL connection in `.env`
- [ ] Install Laravel Sanctum (`laravel/sanctum`)
- [ ] Install Pusher SDK (`pusher/pusher-php-server`)
- [ ] Configure CORS for frontend URL
- [ ] Create API route structure in `routes/api.php`
- [ ] Set up base `ApiController` with JSON response helpers
- [ ] Configure exception handler for consistent JSON errors
- [ ] Run initial migration (users table with role enum)

**Frontend:**
- [ ] Create Next.js 15 project (`npx create-next-app@latest frontend --typescript --tailwind --app`)
- [ ] Install & configure shadcn/ui (`npx shadcn@latest init`)
- [ ] Add required shadcn components: Button, Card, Dialog, Sheet, Badge, Input, Table, Tabs, Dropdown, Toast, AlertDialog, Separator, ScrollArea
- [ ] Install dependencies: zustand, @tanstack/react-query, react-hook-form, zod, @hookform/resolvers, lucide-react, pusher-js, axios
- [ ] Create folder structure: `src/{app,components,hooks,lib,store,types}`
- [ ] Create `formatCurrency.ts` and `formatDate.ts` utilities
- [ ] Create TypeScript types: `user.ts`, `product.ts`, `order.ts`, `payment.ts`, `report.ts`
- [ ] Create `api.ts` (Axios instance with interceptor)
- [ ] Create `constants.ts` (app name, status enums, payment methods)
- [ ] Define Tailwind theme colors (Emerald as primary)
- [ ] Create `.env.local` with API URL and Pusher key placeholders

**Deliverable:** Two projects that start and can communicate. Login page skeleton renders.

---

### Phase 1: Authentication & Authorization (Days 3–4)

**Backend:**
- [ ] Create `AuthController` with `login()`, `logout()`, `me()` methods
- [ ] Implement Sanctum token creation on login
- [ ] Create `RoleMiddleware` for route protection
- [ ] Define Gates: `manage-products`, `manage-users`, `view-reports`, `process-payment`, `create-order`, `void-transaction`
- [ ] Seed default users: owner, kasir, staff (x3)
- [ ] Password hashing on user creation

**Frontend:**
- [ ] Build `LoginPage` with React Hook Form + Zod validation
- [ ] Build `authStore` (Zustand) with login/logout/restore session
- [ ] Build `AuthProvider` wrapper for session hydration
- [ ] Build route middleware for role-based redirect
- [ ] Build `(auth)/layout.tsx` (centered card, logo, app name)
- [ ] Build `(dashboard)/layout.tsx` (sidebar shell, header with user info)
- [ ] Build `(staff)/layout.tsx` (mobile shell, bottom nav placeholder)
- [ ] Connect login → redirect: owner→/dashboard, kasir→/cashier, staff→/staff/order

**Deliverable:** Complete login/logout flow. Role-based routing works. Protected routes reject unauthorized access.

---

### Phase 2: Product & Category Management (Days 5–7)

**Backend:**
- [ ] Create `categories` migration
- [ ] Create `products` migration
- [ ] Create `product_units` migration
- [ ] Create `CategoryController` (CRUD)
- [ ] Create `ProductController` (CRUD + search + low-stock)
- [ ] Create `ProductUnitController` (CRUD sub-resource)
- [ ] Create `CategoryResource` and `ProductResource` (API transformers)
- [ ] Validation: unique sku, positive prices, conversion_to_base > 0
- [ ] Soft delete for products (is_active toggle)
- [ ] Seed categories and products (sample snack data: Chiki Balls, Yupi, Qtela, etc.)

**Frontend:**
- [ ] Build `ProductTable` with TanStack Table (sorting, search, pagination)
- [ ] Build `ProductForm` dialog (React Hook Form + Zod, create/edit mode)
- [ ] Build `UnitForm` sub-form within product form
- [ ] Build category filter chip bar
- [ ] Build low stock badge component
- [ ] Build active/inactive toggle
- [ ] Wire `useProducts` and `useCategories` TanStack Query hooks
- [ ] Wire `useCreateProduct`, `useUpdateProduct`, `useDeleteProduct` mutations
- [ ] Build empty state: "Belum ada produk. Tambah produk pertama."
- [ ] Build loading skeleton for table

**Deliverable:** Complete product CRUD with multi-unit support. Products searchable and filterable.

---

### Phase 3: Staff Order Input (Days 8–10)

**Backend:**
- [ ] Create `orders` migration
- [ ] Create `order_items` migration
- [ ] Create `order_logs` migration
- [ ] Create `OrderController` with `store()` method
- [ ] Implement `submitOrder()` service:
  - Validate all products exist and are active
  - Calculate `base_qty` from unit conversion
  - Verify sufficient stock (warning, not blocking at submit)
  - Snapshot `product_name`, `unit_name`, `price`, `cost_price`, `conversion_to_base`
  - Calculate `subtotal` per item and `grand_total` server-side
  - Generate `order_number` format: `ORD-YYYYMMDD-XXXX`
  - Set status to `submitted`
  - Log order creation in `order_logs`
  - Emit `order.submitted` realtime event
- [ ] Create `GET /orders` with filters for staff to see their own orders
- [ ] Create `GET /orders/{id}` for order detail

**Frontend:**
- [ ] Build `StaffOrderPage` (server component wrapper)
- [ ] Build `StaffOrderClient` (client component)
- [ ] Build `ProductSearch` with debounced input
- [ ] Build `CategoryChips` (horizontal scrollable, "Semua" default)
- [ ] Build `ProductGrid` with `ProductCard[]`:
  - Product name, price/unit badge
  - Stock indicator (green/yellow/red)
  - `QuantityControl` (+ / count / -)
  - Disabled state when out of stock
- [ ] Build `orderCartStore` (Zustand):
  - `items: CartItem[]`
  - `addItem(product, unit)`, `removeItem(productId)`, `updateQty(productId, qty)`
  - `clearCart()`, `getTotalItems()`, `getGrandTotal()`
  - Persist to localStorage for draft recovery
- [ ] Build `CartSheet` (shadcn Sheet from bottom):
  - Cart item list with swipe/button to remove
  - `CustomerNameInput` (optional)
  - `NotesInput` (optional)
  - Grand total display
  - `SubmitOrderButton` with loading state
- [ ] Build `OrderSuccessPage` showing order_number and "Pesanan dikirim ke kasir"
- [ ] Wire `useCreateOrder` mutation
- [ ] Handle loading, empty product grid, network error states

**Deliverable:** Staff can search products, build cart, submit order. Order appears in backend. Success confirmation shown.

---

### Phase 4: Cashier Order Queue (Days 11–14)

**Backend:**
- [ ] Create `PATCH /orders/{id}/review` endpoint
- [ ] Create `PATCH /orders/{id}/items` endpoint (edit items before paid)
- [ ] Create `PATCH /orders/{id}/approve` endpoint
- [ ] Create `PATCH /orders/{id}/cancel` endpoint
- [ ] Implement order status validation (state machine enforcement)
- [ ] Recalculate `grand_total` on item changes
- [ ] Log all status changes in `order_logs`
- [ ] Emit appropriate realtime events on each status change
- [ ] Create `GET /orders?status=submitted` for queue

**Frontend:**
- [ ] Build `CashierPage` layout (two-panel: left queue, right detail)
- [ ] Build `OrderQueue` component:
  - Vertical scrollable list of `OrderCard[]`
  - Each card: order_number, customer_name (or "-"), grand_total (large), time ago, status badge
  - Color-coded by status (green=approved, yellow=submitted/reviewing, blue=paid)
  - Click to select and view detail
- [ ] Build `OrderDetailPanel` component:
  - Order header with status badge and metadata
  - `OrderItemList` with editable rows
  - Edit qty inline (plus/minus or input)
  - Remove item button with confirmation
  - Grand total recalculated and displayed large
- [ ] Build action buttons:
  - Review → `PATCH /orders/{id}/review` (claim order for this cashier)
  - Approve → `PATCH /orders/{id}/approve` (after verification)
  - Cancel → `PATCH /orders/{id}/cancel` with confirmation dialog
- [ ] Build `useRealtimeOrders` hook:
  - Subscribe to `private-cashier` channel
  - On `order.submitted`: add to queue, play notification sound
  - On `order.updated`: refresh active order detail
  - On `payment.paid`: update status, show toast
- [ ] Build `EmptyState` when no order selected: "Pilih pesanan dari antrian"

**Deliverable:** Cashier can view incoming orders in realtime, review, edit items, approve, and cancel orders.

---

### Phase 5: Payment Processing (Days 15–18)

**Backend:**
- [ ] Create `payments` migration
- [ ] Create `payment_logs` migration
- [ ] Create `POST /orders/{id}/payments/cash`:
  - Validate `paid_amount >= grand_total`
  - Create payment record (method=cash, status=paid)
  - Calculate change_amount
  - Update order status → paid
  - Log payment
- [ ] Create `POST /orders/{id}/payments/qris`:
  - Create payment record (method=qris, status=pending)
  - Call Midtrans API `/v2/charge` with `payment_type: gopay`
  - Store `gateway_reference` (transaction_id) and `qris_url`
  - Set `expired_at` (15 minutes from now)
  - Update order status → waiting_payment
- [ ] Create `POST /payments/webhook`:
  - Validate Midtrans signature
  - Idempotency check
  - Amount validation
  - Update payment → paid, order → paid
  - Reduce stock, create stock_movements
  - Emit `payment.paid` event
- [ ] Create `GET /payments/{id}/status`:
  - Call Midtrans `/v2/{order_id}/status`
  - Return current status
- [ ] Create `PATCH /payments/{id}/manual-paid`:
  - Only owner/kasir
  - Log manual_paid event with user_id
  - Process same as webhook paid

**Frontend:**
- [ ] Build `CashPaymentDialog`:
  - Large total display
  - Numeric keypad-style input for cash received, OR simple text input
  - Auto-calculate change (green if positive, red if negative)
  - "Konfirmasi Pembayaran" button disabled if received < total
  - Loading state during API call
- [ ] Build `QRISPaymentDialog`:
  - Large total display
  - Large QR code image (from qris_url, render as PNG)
  - Expiry countdown timer (MM:SS)
  - Status: "Menunggu pembayaran..." with subtle pulse animation
  - "Cek Status" button (manual poll)
  - "Ganti ke Cash" button
  - Auto-redirect to success on payment.paid event
- [ ] Build `usePaymentStatus` hook:
  - Poll `GET /payments/{id}/status` every 5 seconds when QRIS pending
  - Listen for `payment.paid` realtime event
  - Stop polling on paid/expired/failed
- [ ] Build payment success toast and auto-trigger print flow
- [ ] Wire all payment mutations with TanStack Query

**Deliverable:** Complete payment flow — Cash (with change calculation) and QRIS (with realtime/webhook status updates).

---

### Phase 6: Receipt Printing (Days 19–20)

**Backend:**
- [ ] Create `GET /orders/{id}/receipt` endpoint returning structured receipt data
- [ ] Create `POST /orders/{id}/print` endpoint marking order as printed

**Frontend:**
- [ ] Build `ReceiptPreview` component:
  - Thermal 80mm layout (narrow, monospace style)
  - All receipt fields as per spec (store name, date, order number, items, totals, payment method, footer)
  - Responsive to actual paper width
- [ ] Build print stylesheet (`@media print`):
  - Hide everything except receipt
  - Set page width to 80mm
  - No margins, no headers/footers
  - Monospace or clean sans-serif font
- [ ] Build print trigger:
  - Auto-open print dialog after payment success (with small delay)
  - OR show "Cetak Struk" button that triggers `window.print()`
- [ ] Build reprint support:
  - "Cetak Ulang" button on completed orders
  - "REPRINT" watermark/label shown on reprinted receipts
- [ ] Handle print failure gracefully (show "Gagal mencetak. Coba lagi." toast)

**Deliverable:** Receipt prints via browser print dialog. Reprint works. Print status tracked.

---

### Phase 7: Stock Management (Days 21–23)

**Backend:**
- [ ] Create `stock_movements` migration
- [ ] Implement automatic stock deduction in payment service:
  - When payment.status → paid:
  - For each order_item: `product.stock -= order_item.base_qty`
  - Create `stock_movement` record (type=sale, qty=-base_qty, stock_before, stock_after)
  - If stock < min_stock: emit `stock.low` event
- [ ] Create `POST /stock/adjustment`:
  - Owner only
  - type: stock_in (positive) or adjustment (positive/negative)
  - Create stock_movement record
  - Update product.stock
- [ ] Create `GET /stock/movements` with filters
- [ ] Create `GET /products/low-stock`

**Frontend:**
- [ ] Build `StockPage`:
  - Product list with stock levels
  - Low stock highlight (red background if stock ≤ min_stock)
  - Stock adjustment button per product
- [ ] Build `StockAdjustmentDialog`:
  - Current stock display
  - Adjustment type (Stock In / Adjustment)
  - Quantity input
  - Notes input
  - Validation: stock cannot go below 0 (unless adjustment negative justified)
- [ ] Build `StockMovementTable`:
  - History of all movements
  - Filters by product, type, date range
- [ ] Build low stock notification (toast on cashier/dashboard when `stock.low` event fires)

**Deliverable:** Stock auto-decreases on payment. Manual adjustments work. Low stock alerts fire.

---

### Phase 8: Reports (Days 24–26)

**Backend:**
- [ ] Create `GET /reports/daily`:
  - Total sales (sum of grand_total for paid orders today)
  - Transaction count
  - Cash total, QRIS total
  - Gross profit: sum of (order_items.subtotal - order_items.cost_price * base_qty) for paid orders
  - Top 10 products by quantity sold
- [ ] Create `GET /reports/products`:
  - Product sales with date range filter
  - Quantity sold, revenue, profit per product
- [ ] Create `GET /reports/stock`:
  - Current stock levels with low stock filter
- [ ] Create `GET /reports/payments`:
  - Payment method breakdown with date range

**Frontend:**
- [ ] Build `ReportsPage`:
  - Date picker for daily report
  - `DailySalesCard` (large number, comparison indicator)
  - `TransactionCountCard`
  - `CashVsQRISPieChart` or simple breakdown bars
  - `TopProductsTable` (rank, product, qty sold, revenue)
  - `GrossProfitCard`
- [ ] Build simple bar/stat display (no heavy charting library — use CSS or lightweight SVG)
- [ ] Build product performance report with date range
- [ ] Build stock report view (essentially product list sorted by stock)

**Deliverable:** Daily sales report with key metrics. Product and payment reports with date filtering.

---

### Phase 9: Customer Display (Days 27–28)

**Backend:**
- [ ] Create `store_settings` migration
- [ ] Create `GET /settings` and `PUT /settings` endpoints
- [ ] Add `display_device_token` to store_settings
- [ ] Implement customer display realtime channels:
  - `presence-customer-display.{deviceToken}`
  - Broadcast events when cashier opens order for display

**Frontend:**
- [ ] Build `CustomerDisplayPage`:
  - Fullscreen layout (no sidebar, no header, no scrollbars visible)
  - CSS: `100vw × 100vh`, overflow hidden, dark text on light bg
  - Large fonts (total: 48px+, items: 20px+)
  - Auto-hide cursor after 3 seconds of inactivity
- [ ] Build display states:
  - **Idle:** Store name, tagline, "Selamat Datang"
  - **Order:** Item list + large total (updated via realtime)
  - **QRIS:** Large QR code + total + "Silakan scan untuk membayar"
  - **Success:** Checkmark + "Pembayaran Berhasil" + "Terima Kasih"
- [ ] Build `useCustomerDisplay` hook:
  - Subscribe to `presence-customer-display.{deviceToken}`
  - Listen for `display.order_update`, `display.qris_show`, `payment.paid`
  - Update display state accordingly
- [ ] Build `SettingsPage`:
  - Store name, address, phone
  - Receipt footer text
  - Logo upload (optional, v2)
  - Printer type selection (browser/escpos)
  - Display device token management

**Deliverable:** Customer display shows order details and QRIS in realtime. Settings page functional.

---

### Phase 10: Polish & Hardening (Days 29–31)

**Both:**
- [ ] Add loading skeletons to all pages
- [ ] Add empty states with illustrations/icons
- [ ] Add error boundaries and friendly error messages
- [ ] Add toast notifications for all mutations
- [ ] Test all screens on actual 1366×768 laptop
- [ ] Test staff pages on mobile (375px, 414px widths)
- [ ] Test customer display on 1920×1080 monitor (fullscreen)
- [ ] Add rate limiting to auth endpoints
- [ ] Add request logging
- [ ] Security audit:
  - [ ] Staff cannot call payment endpoints
  - [ ] Staff cannot see cost_price in API responses
  - [ ] QRIS never marks paid from frontend
  - [ ] Webhook signature validation tested
  - [ ] CORS restricted to frontend URL only
- [ ] Performance check:
  - [ ] Product list pagination works (no N+1 queries)
  - [ ] Order queue doesn't lag with 50+ orders
  - [ ] Real-time events don't cause unnecessary re-renders

**Deliverable:** Production-ready MVP. All core flows tested. Security and performance validated.

---

### Phase 11: V2 Features (Post-MVP)

| Feature | Effort | Priority |
|---------|--------|----------|
| Barcode scanner support | 2 days | Medium |
| Supplier management | 3 days | Low |
| Purchase/stock-in from supplier | 2 days | Medium |
| Customer debt/piutang tracking | 3 days | Low |
| Export reports (Excel/PDF) | 2 days | Medium |
| Multi-cashier session (concurrent) | 2 days | Medium |
| Void/refund workflow (with stock return) | 3 days | Medium |
| Discount system (per-item & per-order) | 2 days | Medium |
| ESC/POS direct thermal printing (QZ Tray) | 3 days | Medium |
| PWA / offline mode | 5 days | Low |

### Phase 12: V3 Features (SaaS)

| Feature | Effort | Priority |
|---------|--------|----------|
| Multi-outlet / tenant system | 10 days | Future |
| Subscription billing | 5 days | Future |
| Advanced analytics dashboard | 5 days | Future |
| API rate limiting per tenant | 2 days | Future |
| White-label storefront | 8 days | Future |

---

## 10. Risk Analysis & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Midtrans webhook latency/downtime | High — QRIS payments stuck pending | Low | Manual "Cek Status" button + "Tandai Sudah Dibayar" fallback with audit log |
| Pusher free tier limits exceeded | Medium — realtime stops | Low (MVP) | Monitor usage; migration path to Laravel Reverb documented |
| Thermal printer compatibility | Medium — can't print receipts | Medium | MVP uses browser print (works on all OS); ESC/POS is v2 |
| Staff cart lost on page refresh | Low — frustration | Medium | Persist cart to localStorage in Zustand store |
| Database performance with large order_items | Medium — slow reports | Low (MVP scale) | Add indexes on order_id, product_id, created_at; paginate all queries |
| Concurrent cashier access (two people open same order) | Medium — conflicting edits | Medium | Order "locking" via `reviewing` status + optimistic UI with conflict detection |
| Stock going negative during concurrent orders | High — overselling | Low | Wrap stock deduction in database transaction with row-level lock (`SELECT ... FOR UPDATE`) |
| QRIS amount mismatch (Midtrans vs order) | High — wrong payment | Low | Validate gross_amount == grand_total in webhook; if mismatch, log and do NOT auto-process |
| Network failure on VPS | High — entire system down | Low | Use reputable VPS provider; keep database backups; document recovery procedure |
| Staff device compatibility (old Android browser) | Medium — can't use app | Medium | Test on Chrome Android (most common in Indonesia); use polyfills sparingly; keep JS bundle small |

---

## Summary: Critical Path (MVP — 31 Days)

```
Phase 0: Setup ─────────────► Phase 1: Auth
  (Days 1-2)                    (Days 3-4)
                                     │
                                     ▼
                              Phase 2: Products
                                (Days 5-7)
                                     │
                    ┌────────────────┤
                    ▼                ▼
            Phase 3: Staff    Phase 4: Cashier
            Order Input       Order Queue
            (Days 8-10)       (Days 11-14)
                    │                │
                    └───────┬────────┘
                            ▼
                     Phase 5: Payment
                      (Days 15-18)
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
       Phase 6:      Phase 7:       Phase 8:
       Receipt       Stock          Reports
       (Days 19-20)  (Days 21-23)   (Days 24-26)
              │             │             │
              └─────────────┼─────────────┘
                            ▼
                     Phase 9: Customer
                     Display
                     (Days 27-28)
                            │
                            ▼
                     Phase 10: Polish
                      (Days 29-31)
                            │
                            ▼
                    🚀 MVP LAUNCH
```

**Parallel Work Possible:**
- Phase 3 (Staff) and Phase 4 (Cashier) can be built in parallel if two developers
- Phase 6 (Receipt), 7 (Stock), 8 (Reports) are independent and can be parallel
- Frontend and backend work within each phase can be parallelized

---

> **Approval Required:** Please review this implementation plan before any code is written. All architecture decisions, module boundaries, API endpoints, database schema, and development phases are detailed above. The plan will guide all subsequent development prompts.
