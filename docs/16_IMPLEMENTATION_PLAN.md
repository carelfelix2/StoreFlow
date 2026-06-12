# Felix Snack POS — Comprehensive Implementation Plan

> **Generated:** 2026-06-11
> **Updated:** 2026-06-11 (Migrated to Full Next.js Architecture)
> **Status:** In Progress (Phase 0-1 Complete)
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

### 1.1 Backend Modules (Next.js Route Handlers)

| Module | Responsibility | Priority |
|--------|---------------|----------|
| **Auth Module** | Login, logout, session management, role-based access (Auth.js v5) | P0 — Phase 1 |
| **User Management** | CRUD users, role assignment, activate/deactivate | P1 — Phase 1 |
| **Category Module** | CRUD product categories with slug, color, icon | P0 — Phase 2 |
| **Product Module** | CRUD products, multi-unit support, SKU/barcode, stock, pricing | P0 — Phase 2 |
| **Product Unit Module** | Multi-satuan conversion (pcs, renteng, dus, karton) | P0 — Phase 2 |
| **Order Module** | Create/submit/review/approve/cancel/complete orders, status workflow engine | P0 — Phase 3/4 |
| **Cart Module** | Draft order management (staff-side cart persistence) | P0 — Phase 3 |
| **Payment Module** | Cash payment, QRIS generation (Midtrans), webhook handler, manual paid fallback | P0 — Phase 5 |
| **Receipt Module** | Receipt data generation, print status tracking, reprint support | P1 — Phase 6 |
| **Stock Module** | Stock deduction on payment, stock movements (sale, stock_in, adjustment, return, void), low-stock alerts | P0 — Phase 7 |
| **Report Module** | Daily sales, cash vs QRIS, top products, gross profit, stock report | P1 — Phase 8 |
| **Customer Display Module** | Device token management, display session, current order broadcast | P2 — Phase 9 |
| **Store Settings Module** | Store name, address, phone, receipt footer, logo, printer config | P1 — Phase 10 |
| **Audit Log Module** | Order logs, payment logs — immutable audit trail | P0 — baked into Phase 3/5 |

### 1.2 Frontend Modules (Next.js Pages & Components)

| Module | Responsibility | Priority |
|--------|---------------|----------|
| **Auth UI** | Login page, role-based redirect, protected route proxy | P0 — Phase 1 |
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
| **Prisma Schema** | Database models, migrations, seeders | P0 — Phase 0 |
| **API Route Handlers** | REST endpoints under `src/app/api/` | P0 — Phase 0+ |
| **Server Actions** | Form mutations with direct Prisma access | P0 — Phase 2+ |
| **Auth.js Config** | Credentials provider, session callbacks, role in JWT | P0 — Phase 1 |
| **API Client** | Centralized Axios/fetch wrapper with session token injection, error handling | P0 — Phase 0 |
| **Type Definitions** | TypeScript types (User, Product, Order, Payment, Report) | P0 — Phase 0 |
| **Format Utilities** | `formatCurrency()`, `formatDate()` | P0 — Phase 0 |
| **State Stores (Zustand)** | Cart store, cashier active order store, auth store, UI state | P0 — Phase 0/3 |
| **Validation Schemas (Zod)** | Login, product, order, payment, settings validation | P0 — Phase 0/1 |
| **Realtime Client** | Pusher client with typed event handlers | P0 — Phase 4 |

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
│              NEXT.JS 15 FULL STACK (Vercel)                   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  App Router (Pages)                                    │   │
│  │  ├── (auth)/login          → Login Page              │   │
│  │  ├── (dashboard)/dashboard → Owner Dashboard         │   │
│  │  ├── (dashboard)/cashier   → Cashier POS Screen      │   │
│  │  ├── (dashboard)/products → Product Management       │   │
│  │  ├── (dashboard)/stock     → Stock Management        │   │
│  │  ├── (dashboard)/reports   → Reports                 │   │
│  │  ├── (dashboard)/settings  → Store Settings          │   │
│  │  ├── staff/order           → Staff Order Input (HP)  │   │
│  │  ├── staff/order-success   → Success Confirmation    │   │
│  │  └── customer-display/[id] → Customer Display        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Route Handlers (src/app/api/)                    │   │
│  │  ├── /api/auth/*          → Auth.js                   │   │
│  │  ├── /api/products/*      → Product CRUD             │   │
│  │  ├── /api/categories/*    → Category CRUD            │   │
│  │  ├── /api/orders/*        → Order workflow           │   │
│  │  ├── /api/payments/*      → Cash + QRIS + Webhook    │   │
│  │  ├── /api/reports/*       → Sales reports            │   │
│  │  ├── /api/stock/*         → Stock movements          │   │
│  │  ├── /api/settings/*      → Store settings           │   │
│  │  └── /api/users/*         → User management          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  State: Zustand (cart, UI) + TanStack Query (data)   │   │
│  │  Forms: React Hook Form + Zod                        │   │
│  │  UI:   shadcn/ui + Tailwind CSS + Lucide Icons       │   │
│  │  Types: /src/types/*.ts                              │   │
│  │  ORM:  Prisma Client                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────┬────────────────────────────────────────────────┘
             │
    ┌────────┼────────┬──────────────┐
    ▼        ▼        ▼              ▼
┌────────┐ ┌──────┐ ┌────────┐ ┌──────────┐
│PostgreSQL│ │Pusher│ │Midtrans│ │Printer   │
│Database │ │      │ │Gateway │ │(Browser  │
│         │ │      │ │(QRIS)  │ │ Print)   │
└────────┘ └──────┘ └────────┘ └──────────┘
```

### 2.2 Project Structure

```
Z:/StoreFlow/
├── frontend/                    # Next.js 15 Full Stack App
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/             # Route Handlers (REST API)
│   │   │   ├── (auth)/          # Login layout + page
│   │   │   ├── (dashboard)/     # Owner/Kasir pages
│   │   │   ├── staff/           # Staff mobile pages
│   │   │   └── customer-display/
│   │   ├── components/          # React components (organized by domain)
│   │   ├── hooks/               # Custom hooks
│   │   ├── lib/                 # Prisma, Auth.js, API client, formatters
│   │   ├── store/               # Zustand stores
│   │   └── types/               # TypeScript type definitions
│   ├── prisma/
│   │   └── schema.prisma        # Database schema
│   ├── auth.ts                  # Auth.js root config
│   ├── proxy.ts                 # Edge proxy for route protection
│   ├── next.config.ts
│   ├── package.json
│   └── .env.local
│
├── docs/                        # All markdown documentation
│   ├── 00_PROJECT_OVERVIEW.md
│   └── ...
│
└── README.md
```

### 2.3 Data Flow

```
Staff HP                    Next.js API                    Cashier Laptop
────────                    ───────────                    ──────────────
                                                              
1. Search Products ──────► GET /api/products ──► Return list     
                                                              
2. Build Cart (local        (Zustand store,                
   state only)              no API call yet)               
                                                              
3. Submit Order ──────────► POST /api/orders                  
                            ├── Validate stock (Prisma)      
                            ├── Create order (submitted)    
                            ├── Emit order.submitted ──────► 4. Receive realtime
                            └── Return order_number            notification
                                                              
                                                          5. Click order ────────► PATCH /api/orders/{id}/review
                                                                                     (status → reviewing)
                                                              
                                                          6. Edit items ──────────► PATCH /api/orders/{id}/items
                                                              
                                                          7. Approve ─────────────► PATCH /api/orders/{id}/approve
                                                                                     (status → approved)
                                                              
                                                          8. Cash Payment ────────► POST /api/orders/{id}/payments/cash
                                                                                     ├── Validate amount
                                                                                     ├── Create payment (paid) [Prisma transaction]
                                                                                     ├── Reduce stock
                                                                                     ├── Create stock_movement
                                                                                     ├── Emit payment.paid ───► Customer Display
                                                                                     └── Return receipt data
                                                              
                                                          9. Print Receipt ───────► POST /api/orders/{id}/print
                                                                                     (status → printed)
```

### 2.4 Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Full Stack** | Next.js 15 (pages + API + Prisma) | Single project, single language, end-to-end type safety |
| **API Style** | Route Handlers (REST) + Server Actions + Pusher (realtime) | Route Handlers for TanStack Query consumption; Server Actions for form mutations; Pusher for realtime |
| **State Management** | Zustand (local UI/cart) + TanStack Query (server data) | Zustand is minimal for POS cart; TanStack Query handles caching/revalidation/mutations |
| **Database** | PostgreSQL via Prisma ORM | Type-safe queries, auto-generated types, migrations, seeders |
| **Auth** | Auth.js v5 (credentials provider) | Next.js-native auth with JWT sessions; role stored in token; simple setup |
| **Payment Gateway** | Midtrans (sandbox → production) | Best Indonesian docs; QRIS support built-in; webhook infrastructure |
| **Realtime** | Pusher (MVP) → Socket.io (self-host option) | Pusher is zero-config for MVP |
| **Printing** | Browser `window.print()` with thermal CSS (MVP) → QZ Tray/ESC/POS (v2) | Browser print works immediately with zero setup |
| **Deployment** | Vercel (full app) + PostgreSQL host (Supabase/Neon/Railway) | Single deployment; serverless + edge functions |

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
| `products` | `order_items` | 1:N | RESTRICT | Cannot delete sold products (soft delete) |
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
4. **Order Status State Machine**: Status transitions enforced in Route Handlers (see Section 4.3).
5. **Webhook Idempotency**: `gateway_reference` on payments is unique. Re-processed webhooks must be ignored if payment already `paid`.
6. **Soft Delete for Products**: Products with existing `order_items` cannot be hard-deleted. Use `is_active = false`.
7. **Stock Movement Immutability**: `stock_movements` rows are append-only. Never update or delete.
8. **Prisma Transactions**: Payment processing (cash + stock deduction) MUST use `prisma.$transaction()` for atomicity.

---

## 4. API Structure

### 4.1 Complete Endpoint Map

```
Base URL: /api (Route Handlers under src/app/api/)

AUTH (via Auth.js) ─────────────────────────────
POST   /api/auth/login              # Credentials provider
GET    /api/auth/session            # Current session
POST   /api/auth/logout             # Clear session

CATEGORIES ───────────────────────────────────────
GET    /api/categories              # List all active categories
POST   /api/categories              # Create category (owner)
GET    /api/categories/[id]         # Show category
PUT    /api/categories/[id]         # Update category (owner)
DELETE /api/categories/[id]         # Delete category (owner, if no products)

PRODUCTS ────────────────────────────────────────
GET    /api/products                # List/search products
       ?search=                     # Text search (name, sku)
       ?category_id=                # Filter by category
       ?is_active=                  # true/false
       ?low_stock=                  # true filters stock ≤ min_stock
       ?page= &per_page=            # Pagination
POST   /api/products                # Create product + units (owner)
GET    /api/products/[id]           # Product detail with units
PUT    /api/products/[id]           # Update product (owner)
DELETE /api/products/[id]           # Soft delete (owner)
PATCH  /api/products/[id]/toggle    # Toggle is_active (owner)
GET    /api/products/low-stock      # Products with stock ≤ min_stock

PRODUCT UNITS ────────────────────────────────────
GET    /api/products/[id]/units     # List units for a product
POST   /api/products/[id]/units     # Add unit (owner)
PUT    /api/products/[id]/units/[unitId]  # Update unit (owner)
DELETE /api/products/[id]/units/[unitId]  # Delete unit (owner)

ORDERS ──────────────────────────────────────────
POST   /api/orders                  # Create draft or submitted order (staff)
GET    /api/orders                  # List orders
       ?status=                     # submitted, reviewing, approved, etc.
       ?date=                       # YYYY-MM-DD
       ?created_by=                 # Filter by staff user
       ?cashier_id=                 # Filter by cashier
GET    /api/orders/[id]             # Order detail with items
PATCH  /api/orders/[id]/review      # Set status → reviewing (kasir)
PATCH  /api/orders/[id]/items       # Edit items before paid (kasir)
PATCH  /api/orders/[id]/approve     # Set status → approved (kasir)
PATCH  /api/orders/[id]/cancel      # Set status → cancelled
PATCH  /api/orders/[id]/complete    # Set status → completed (kasir)

PAYMENTS ────────────────────────────────────────
POST   /api/orders/[id]/payments/cash     # Process cash payment
POST   /api/orders/[id]/payments/qris     # Generate QRIS via Midtrans
GET    /api/payments/[id]/status          # Check payment status (poll Midtrans)
POST   /api/payments/webhook              # Midtrans webhook (public, signature-validated)
PATCH  /api/payments/[id]/manual-paid     # Manual mark as paid (owner/kasir fallback)

RECEIPT ─────────────────────────────────────────
GET    /api/orders/[id]/receipt      # Get receipt data for display/print
POST   /api/orders/[id]/print        # Mark order as printed

REPORTS ─────────────────────────────────────────
GET    /api/reports/daily            # Daily sales report
       ?date=                        # YYYY-MM-DD (default: today)
GET    /api/reports/products         # Product sales ranking
       ?start_date= &end_date=       # Date range
GET    /api/reports/stock            # Current stock levels
GET    /api/reports/payments         # Payment method breakdown

STOCK ───────────────────────────────────────────
GET    /api/stock/movements          # Stock movement history
       ?product_id= &type= &start_date= &end_date=
POST   /api/stock/adjustment         # Manual stock adjustment (owner)

STORE SETTINGS ──────────────────────────────────
GET    /api/settings                 # Get store settings
PUT    /api/settings                 # Update store settings (owner)

USERS ───────────────────────────────────────────
GET    /api/users                    # List users (owner)
POST   /api/users                    # Create user (owner)
GET    /api/users/[id]               # User detail (owner)
PUT    /api/users/[id]               # Update user (owner)
DELETE /api/users/[id]               # Deactivate user (owner)
```

### 4.2 API Response Envelope

All responses follow a consistent envelope:

```json
// Success
{ "success": true, "data": { ... }, "message": "..." }

// Collection
{ "success": true, "data": [ ... ], "meta": { "current_page": 1, "per_page": 20, "total": 150, "last_page": 8 } }

// Error
{ "success": false, "message": "Validation failed", "errors": { "email": ["Email sudah terdaftar"] } }
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

### 4.4 Request Pipeline (Route Handlers)

```
Request
  │
  ▼
┌──────────────────┐
│ CORS Headers      │ → Allow frontend origin
└──────┬───────────┘
       ▼
┌──────────────────┐
│ Auth.js Session   │ → Validate JWT session token
└──────┬───────────┘
       ▼
┌──────────────────┐
│ Role Check        │ → requireRole("owner" | "kasir" | "staff")
└──────┬───────────┘
       ▼
┌──────────────────┐
│ Zod Validation    │ → Validate request body/params
└──────┬───────────┘
       ▼
┌──────────────────┐
│ Route Handler     │ → Prisma queries, business logic
└──────┬───────────┘
       ▼
┌──────────────────┐
│ JSON Response     │ → Envelope format
└──────────────────┘
```

**Special: Webhook Pipeline**

```
POST /api/payments/webhook
  │
  ▼
┌─────────────────────────┐
│ No auth (public route)   │
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│ Signature Validation     │ → SHA-512 hash with server_key
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│ Idempotency Check        │ → gateway_reference already processed? → 200 (no-op)
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│ Amount Validation        │ → gross_amount === payment.amount
└──────┬──────────────────┘
       ▼
┌─────────────────────────┐
│ Prisma Transaction       │ → Update payment + order, reduce stock, create movement
└─────────────────────────┘
```

### 4.5 Route Handler vs Server Action

| Pattern | File Location | Use For |
|---------|-------------|---------|
| **Route Handler** | `src/app/api/**/route.ts` | CRUD APIs called from TanStack Query, webhooks |
| **Server Action** | `src/lib/actions/*.ts` or inline `"use server"` | Form mutations with direct Prisma access (product create/edit, settings save) |

---

## 5. Frontend Structure

### 5.1 Component Tree by Role

#### 5.1.1 Staff (Mobile — `/staff/order`)

```
StaffOrderPage (server component — metadata)
└── StaffOrderClient (client component — all interactivity)
    ├── ProductSearch
    │   └── SearchInput (with debounce)
    ├── CategoryChips
    │   └── Chip[] (horizontal scroll, "Semua" default selected)
    ├── ProductGrid
    │   └── ProductCard[] (name, price, stock indicator)
    │       └── QuantityControl (+ / qty / -)
    ├── CartSheet (shadcn Sheet from bottom)
    │   ├── CartItem[] (product name, unit, qty, subtotal)
    │   ├── CustomerNameInput (optional)
    │   ├── NotesInput (optional)
    │   ├── CartTotal
    │   └── SubmitOrderButton
    └── OrderSuccessOverlay
```

#### 5.1.2 Cashier (Desktop — `/cashier`)

```
CashierPage
├── OrderQueue (left panel, ~40% width)
│   ├── QueueTabs (Menunggu | Diproses | Selesai)
│   └── OrderCard[]
├── OrderDetailPanel (right panel, ~60% width)
│   ├── OrderHeader
│   ├── OrderItemList
│   ├── OrderSummary
│   └── ActionBar (Review, Approve, Cancel, Cash, QRIS)
├── CashPaymentDialog
├── QRISPaymentDialog
└── EmptyState
```

#### 5.1.3 Owner Dashboard (`/dashboard`)

```
DashboardPage
├── SummaryCards (TodaySales, TransactionCount, CashTotal, QRISTotal)
├── QuickActions
├── LowStockAlertSection
└── RecentTransactionsTable
```

#### 5.1.4 Customer Display (`/customer-display/[deviceId]`)

```
CustomerDisplayPage (fullscreen, no chrome)
├── IdleState
├── OrderDisplayState
├── QRISDisplayState
└── SuccessState
```

### 5.2 State Management Architecture

```
┌──────────────────────────────────────────────────┐
│                   ZUSTAND STORES                   │
│  authStore     │ orderCartStore  │ cashierStore   │
│  - user        │ - items[]       │ - activeOrderId│
│  - token       │ - customerName  │ - queue[]      │
│  - isAuth      │ - addItem()     │ - setActive()  │
│  - login()     │ - removeItem()  │ - addToQueue() │
│  - logout()    │ - updateQty()   │ - updateOrder()│
│                │ - submitOrder() │                │
│  uiStore: sidebarOpen, dialogs, toasts           │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│              TANSTACK QUERY (Server State)         │
│  useProducts()   useProduct()   useCategories()   │
│  useOrders()     useOrder()     useDailyReport()  │
│  useCreateProduct()  useUpdateProduct()            │
│  useCreateOrder()    useApproveOrder()             │
│  useProcessCashPayment()  useGenerateQRIS()        │
│  useCheckPaymentStatus()                           │
└──────────────────────────────────────────────────┘
```

---

## 6. Authentication Strategy

### 6.1 Overview

**Method:** Auth.js v5 (NextAuth) with credentials provider + JWT session strategy.

**Why Auth.js v5:**
- Next.js-native — no cross-domain token management
- JWT sessions stored in HTTP-only cookies (secure)
- Role stored in JWT callback — accessible in both middleware and Route Handlers
- Server Components can call `auth()` directly
- Route Handlers use `auth()` wrapper for session validation

### 6.2 Auth Flow

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│  LOGIN   │                    │  ACTIVE  │                    │  LOGOUT  │
│          │                    │  SESSION │                    │          │
│ POST     │ ──── success ────► │          │ ──── POST ───────► │ Session  │
│ /api/    │     returns:       │ JWT in   │     /api/auth/     │ cleared  │
│ auth/    │     user + session │ cookie   │     logout         │          │
│ login    │                    │          │                    │          │
└──────────┘                    └──────────┘                    └──────────┘
```

### 6.3 Auth.js Configuration

```typescript
// auth.ts (root)
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user || !user.isActive) return null;
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!valid) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
```

### 6.4 Role-Based Access Control

```typescript
// lib/auth-helpers.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function requireRole(
  request: Request,
  ...roles: string[]
): Promise<{ session: Session } | { error: Response }> {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 }) };
  }
  if (roles.length > 0 && !roles.includes(session.user.role)) {
    return { error: NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}
```

### 6.5 Edge Proxy (`proxy.ts`)

Already implemented. Protects routes based on `auth_role` cookie before page loads — see [`src/proxy.ts`](frontend/src/proxy.ts:47).

---

## 7. Realtime Strategy

### 7.1 Channel Architecture

```
┌──────────────────────────────────────────────────┐
│                    PUSHER                          │
│                                                    │
│  CHANNELS:                                         │
│  private-cashier → order.submitted, order.updated, │
│                     payment.paid, stock.low        │
│  private-staff.{userId} → order.status_changed     │
│  presence-customer-display.{deviceId} →            │
│                     display.order_update,          │
│                     display.qris_show,             │
│                     display.payment_success        │
└──────────────────────────────────────────────────┘
```

### 7.2 Event Catalog

| Event | Channel | Trigger | Payload | Handler |
|-------|---------|---------|---------|---------|
| `order.submitted` | `private-cashier` | POST /api/orders | `{ order_id, order_number, grand_total, customer_name, created_by_name }` | Add to queue, toast, sound |
| `order.reviewing` | `private-cashier` | PATCH .../review | `{ order_id, cashier_name }` | Update queue status |
| `order.approved` | `private-cashier` | PATCH .../approve | `{ order_id }` | Update queue status |
| `order.cancelled` | `private-cashier` | PATCH .../cancel | `{ order_id }` | Remove from queue |
| `order.updated` | `private-cashier` | PATCH .../items | `{ order_id, items[], grand_total }` | Refresh detail |
| `payment.paid` | `private-cashier` | Webhook / manual paid | `{ order_id, method, amount }` | Show success, trigger print |
| `stock.low` | `private-cashier` | Stock below min_stock | `{ product_id, name, current_stock, min_stock }` | Toast warning |

### 7.3 Pusher Server-Side

```typescript
// lib/pusher.ts
import Pusher from "pusher";

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_APP_KEY!,
  secret: process.env.PUSHER_APP_SECRET!,
  cluster: process.env.PUSHER_APP_CLUSTER!,
  useTLS: true,
});

// Emit event from Route Handler:
await pusher.trigger("private-cashier", "order.submitted", {
  order_id: order.id,
  order_number: order.orderNumber,
  grand_total: order.grandTotal,
  customer_name: order.customerName,
  created_by_name: user.name,
});
```

---

## 8. QRIS Integration Strategy

### 8.1 Provider: Midtrans

Midtrans is chosen for:
- Best Indonesian documentation
- QRIS built-in as payment channel (`gopay` → QRIS)
- Sandbox for development
- Mature webhook infrastructure

### 8.2 Integration Flow

```
Kasir → Frontend → Route Handler → Midtrans API
                       │
                       ├── Create QRIS: POST /api/orders/{id}/payments/qris
                       │   └── calls Midtrans /v2/charge (payment_type: gopay)
                       │
                       ├── Webhook: POST /api/payments/webhook
                       │   └── Validate signature → Update DB → Emit Pusher event
                       │
                       └── Check Status: GET /api/payments/{id}/status
                           └── calls Midtrans /v2/{order_id}/status
```

### 8.3 Midtrans Integration (Server-Side)

```typescript
// lib/midtrans.ts

const MIDTRANS_BASE_URL = process.env.MIDTRANS_IS_PRODUCTION === "true"
  ? "https://api.midtrans.com"
  : "https://api.sandbox.midtrans.com";

const serverKey = process.env.MIDTRANS_SERVER_KEY!;

export async function createQRISPayment(params: {
  orderId: string;
  amount: number;
  items: { name: string; price: number; quantity: number }[];
}) {
  const auth = Buffer.from(serverKey + ":").toString("base64");
  const response = await fetch(`${MIDTRANS_BASE_URL}/v2/charge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      payment_type: "gopay",
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.amount,
      },
      item_details: params.items,
    }),
  });
  return response.json();
}
```

### 8.4 Webhook Security

- Validate signature using SHA-512: `order_id + status_code + gross_amount + server_key`
- Idempotency: skip if payment already `paid`
- Amount validation: `gross_amount` must match order `grand_total`
- If mismatch: log, do NOT auto-process

### 8.5 QRIS Fallback

```
QRIS Generated but webhook never arrives?
├── Kasir clicks "Cek Status" → GET /api/payments/{id}/status
│   ├── Paid → Process normally
│   ├── Pending → Continue waiting
│   └── Expired → Offer retry or switch to Cash
│
└── Kasir clicks "Tandai Sudah Dibayar" (manual fallback)
    └── Only if customer shows payment proof
    └── Owner/kasir only, logged in payment_logs
```

---

## 9. Development Phases

### Phase 0: Project Setup & Foundation (Days 1–2) ✅ COMPLETE

**Goal:** Runnable Next.js project with all tooling configured.

- [x] Create Next.js 15 project
- [x] Install & configure shadcn/ui (Emerald primary)
- [x] Add 20+ shadcn components
- [x] Create folder structure
- [x] Create TypeScript types (User, Product, Order, Payment)
- [x] Create format utilities (formatCurrency, formatDate)
- [x] Create API client (Axios with interceptors)
- [x] Create constants
- [x] Create Zustand stores (auth, UI)
- [x] Create layout components (sidebar, header, mobile bottom nav)
- [x] Create all route placeholders (13 routes)
- [x] Configure .env.local
- [x] Build passes with 0 errors

### Phase 1: Authentication & Authorization (Days 3–4) ✅ COMPLETE

**Goal:** Full auth flow with role-based routing.

**Backend (to be implemented with Prisma + Auth.js):**
- [ ] Set up Prisma schema with User model
- [ ] Configure Auth.js v5 with credentials provider
- [ ] Create POST /api/auth/login Route Handler
- [ ] Add role to JWT session callback
- [ ] Create seed script for owner, kasir, staff users

**Frontend (completed):**
- [x] Build LoginPage with React Hook Form + Zod
- [x] Build authStore (Zustand) with login/logout/hydrate
- [x] Build AuthProvider with skeleton loading state
- [x] Build proxy.ts for role-based route protection at edge
- [x] Build role-filtered sidebar navigation
- [x] Build production logout flow with toast
- [x] Create useAuth, useCurrentUser, useHasRole hooks
- [x] Create auth service layer (lib/auth.ts)

---

### Phase 2: Product & Category Management (Days 5–7)

**Backend (Route Handlers + Prisma):**
- [ ] Create Prisma models: Category, Product, ProductUnit
- [ ] Run migrations
- [ ] Create GET/POST /api/categories Route Handlers
- [ ] Create GET/POST /api/products Route Handlers
- [ ] Create GET/PUT/DELETE /api/products/[id] Route Handlers
- [ ] Zod validation schemas for product/category
- [ ] Role check: owner only for mutations
- [ ] Seed categories and sample snack products

**Frontend:**
- [ ] Build ProductTable with TanStack Table (sorting, search, pagination)
- [ ] Build ProductForm dialog (React Hook Form + Zod)
- [ ] Build UnitForm within product form
- [ ] Build category filter chips
- [ ] Build low stock badge
- [ ] Build active/inactive toggle
- [ ] Wire TanStack Query hooks (useProducts, useCategories)
- [ ] Wire mutations (useCreateProduct, useUpdateProduct, useDeleteProduct)

---

### Phase 3: Staff Order Input (Days 8–10)

**Backend:**
- [ ] Create Prisma models: Order, OrderItem, OrderLog
- [ ] Create POST /api/orders Route Handler
- [ ] Implement submitOrder logic: validate products, snapshot prices, calculate totals
- [ ] Generate order_number format: ORD-YYYYMMDD-XXXX
- [ ] Emit order.submitted via Pusher
- [ ] Create GET /api/orders with filters

**Frontend:**
- [ ] Build StaffOrderPage + StaffOrderClient
- [ ] Build ProductSearch with debounce
- [ ] Build CategoryChips (horizontal scroll)
- [ ] Build ProductGrid with ProductCard + QuantityControl
- [ ] Build orderCartStore (Zustand, persist to localStorage)
- [ ] Build CartSheet (slide from bottom)
- [ ] Build OrderSuccessPage

---

### Phase 4: Cashier Order Queue (Days 11–14)

**Backend:**
- [ ] Create PATCH /api/orders/[id]/review
- [ ] Create PATCH /api/orders/[id]/items
- [ ] Create PATCH /api/orders/[id]/approve
- [ ] Create PATCH /api/orders/[id]/cancel
- [ ] Implement status state machine validation
- [ ] Recalculate grand_total on item changes
- [ ] Log all changes in order_logs
- [ ] Emit Pusher events on each status change

**Frontend:**
- [ ] Build CashierPage (two-panel layout)
- [ ] Build OrderQueue with OrderCard[]
- [ ] Build OrderDetailPanel with editable items
- [ ] Build action buttons (Review, Approve, Cancel)
- [ ] Build useRealtimeOrders hook (Pusher subscription)

---

### Phase 5: Payment Processing (Days 15–18)

**Backend:**
- [ ] Create Prisma models: Payment, PaymentLog
- [ ] Create POST /api/orders/[id]/payments/cash (Prisma transaction)
- [ ] Create POST /api/orders/[id]/payments/qris (Midtrans API)
- [ ] Create POST /api/payments/webhook (signature validation)
- [ ] Create GET /api/payments/[id]/status (poll Midtrans)
- [ ] Create PATCH /api/payments/[id]/manual-paid

**Frontend:**
- [ ] Build CashPaymentDialog (cash received, change calculation)
- [ ] Build QRISPaymentDialog (QR code, countdown, status polling)
- [ ] Build usePaymentStatus hook

---

### Phase 6: Receipt Printing (Days 19–20)

- [ ] Build ReceiptPreview with thermal 80mm CSS
- [ ] Build print stylesheet (@media print)
- [ ] Build print trigger (auto after payment, manual reprint)
- [ ] Create GET /api/orders/[id]/receipt
- [ ] Create POST /api/orders/[id]/print

---

### Phase 7: Stock Management (Days 21–23)

- [ ] Create Prisma model: StockMovement
- [ ] Implement auto stock deduction in payment Prisma transaction
- [ ] Create POST /api/stock/adjustment
- [ ] Create GET /api/stock/movements
- [ ] Build StockPage, StockAdjustmentDialog, StockMovementTable
- [ ] Build low stock notification (Pusher stock.low event)

---

### Phase 8: Reports (Days 24–26)

- [ ] Create GET /api/reports/daily
- [ ] Create GET /api/reports/products, /stock, /payments
- [ ] Build ReportsPage with DailySalesCard, TopProductsTable, CashVsQRIS

---

### Phase 9: Customer Display (Days 27–28)

- [ ] Create Prisma model: StoreSettings
- [ ] Create GET/PUT /api/settings
- [ ] Build fullscreen CustomerDisplayPage
- [ ] Build display states: Idle, Order, QRIS, Success
- [ ] Build useCustomerDisplay hook (Pusher)
- [ ] Build SettingsPage

---

### Phase 10: Polish & Hardening (Days 29–31)

- [ ] Loading skeletons on all pages
- [ ] Empty states with illustrations
- [ ] Error boundaries
- [ ] Toast notifications for all mutations
- [ ] Test on 1366×768 laptop, mobile (375px, 414px)
- [ ] Test customer display fullscreen 1920×1080
- [ ] Security audit: role enforcement, price/cost visibility
- [ ] Performance: pagination, no N+1 queries, Pusher re-renders

---

## 10. Risk Analysis & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Midtrans webhook latency | High | Manual "Cek Status" + "Tandai Dibayar" fallback |
| Pusher free tier limit | Medium | Monitor; Socket.io migration path available |
| Thermal printer compatibility | Medium | MVP uses browser print (zero setup) |
| Staff cart lost on refresh | Low | Zustand persist to localStorage |
| Concurrent cashier access | Medium | "reviewing" status locks order; optimistic UI |
| Stock going negative | High | Prisma transaction with row-level lock |
| QRIS amount mismatch | High | Validate in webhook; log, don't auto-process |
| Vercel cold starts | Low | Not critical for POS internal use |

---

## Summary: Critical Path (MVP — 31 Days)

```
Phase 0: Setup ✅
  │
  ▼
Phase 1: Auth ✅
  │
  ▼
Phase 2: Products ──► Phase 3: Staff Order ──► Phase 4: Cashier
  │                                                  │
  └──────────────────────────────────────────────────┘
                                                     ▼
                                              Phase 5: Payment
                                                     │
                                        ┌────────────┼────────────┐
                                        ▼            ▼            ▼
                                 Phase 6:     Phase 7:      Phase 8:
                                 Receipt      Stock         Reports
                                        │            │            │
                                        └────────────┼────────────┘
                                                     ▼
                                              Phase 9: Display
                                                     │
                                                     ▼
                                              Phase 10: Polish
                                                     │
                                                     ▼
                                              🚀 MVP LAUNCH
```

---

> **Note:** This plan has been updated to reflect Full Next.js architecture. Laravel has been removed as a backend dependency. All API logic lives in Next.js Route Handlers with Prisma ORM.
