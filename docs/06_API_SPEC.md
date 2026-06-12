# API Spec

Base URL: `/api` (Next.js Route Handlers under `src/app/api/`)

All endpoints are implemented as Next.js Route Handlers. Auth-protected routes use Auth.js session validation.

## Auth (via Auth.js)

### POST /api/auth/login
NextAuth credentials provider endpoint.

Request:
```json
{
  "email": "owner@example.com",
  "password": "password"
}
```

Response:
```json
{
  "user": {
    "id": "1",
    "name": "Owner",
    "email": "owner@example.com",
    "role": "owner"
  },
  "token": "jwt-session-token"
}
```

### GET /api/auth/session
Get current session.

### POST /api/auth/logout
Clear session.

## Products

### GET /api/products
Query:
- search
- category_id
- is_active
- low_stock
- page, per_page

Response:
```json
{
  "data": [
    {
      "id": "1",
      "name": "Chiki Balls",
      "category": "Snack",
      "stock": 120,
      "base_unit": "pcs",
      "selling_price": 2000,
      "units": [
        {
          "unit_name": "pcs",
          "conversion_to_base": 1,
          "selling_price": 2000
        },
        {
          "unit_name": "dus",
          "conversion_to_base": 40,
          "selling_price": 70000
        }
      ]
    }
  ]
}
```

### POST /api/products
Create product (owner only).

### GET /api/products/[id]
Product detail with units.

### PUT /api/products/[id]
Update product (owner).

### DELETE /api/products/[id]
Soft delete / deactivate product (owner).

### PATCH /api/products/[id]/toggle
Toggle is_active (owner).

## Categories

### GET /api/categories
### POST /api/categories
### GET /api/categories/[id]
### PUT /api/categories/[id]
### DELETE /api/categories/[id]

## Orders

### POST /api/orders
Create draft or submitted order.

Request:
```json
{
  "customer_name": "Andi",
  "items": [
    {
      "product_id": "1",
      "unit_name": "pcs",
      "qty": 10
    }
  ],
  "notes": "Pesanan dari toko sebelah"
}
```

Response:
```json
{
  "id": "100",
  "order_number": "ORD-20260611-0001",
  "status": "submitted",
  "grand_total": 20000
}
```

### GET /api/orders
Query: status, date, created_by, cashier_id

### GET /api/orders/[id]
Detail order with items.

### PATCH /api/orders/[id]/review
Set status reviewing (owner/kasir).

### PATCH /api/orders/[id]/items
Edit items before paid (owner/kasir).

### PATCH /api/orders/[id]/approve
Approve order (owner/kasir).

### PATCH /api/orders/[id]/cancel
Cancel order before paid (staff/kasir/owner).

### PATCH /api/orders/[id]/complete
Complete order after paid/printed (kasir).

## Payments

### POST /api/orders/[id]/payments/cash
Process cash payment.

Request:
```json
{
  "paid_amount": 50000
}
```

Response:
```json
{
  "status": "paid",
  "amount": 35000,
  "paid_amount": 50000,
  "change_amount": 15000
}
```

### POST /api/orders/[id]/payments/qris
Generate QRIS via Midtrans.

Response:
```json
{
  "payment_id": "1",
  "status": "pending",
  "qris_url": "https://...",
  "expired_at": "2026-06-11T17:00:00+07:00"
}
```

### GET /api/payments/[id]/status
Check payment status (poll Midtrans).

### POST /api/payments/webhook
Midtrans callback (public endpoint, signature-validated).

### PATCH /api/payments/[id]/manual-paid
Manual mark as paid fallback (owner/kasir only).

## Receipt

### GET /api/orders/[id]/receipt
Return receipt data for display/print.

### POST /api/orders/[id]/print
Mark order as printed.

## Reports

### GET /api/reports/daily
Query: date

Response:
```json
{
  "date": "2026-06-11",
  "total_sales": 8500000,
  "transactions": 128,
  "cash_total": 3500000,
  "qris_total": 5000000,
  "gross_profit": 1200000,
  "top_products": []
}
```

### GET /api/reports/products
### GET /api/reports/stock
### GET /api/reports/payments

## Stock

### GET /api/stock/movements
Query: product_id, type, start_date, end_date

### POST /api/stock/adjustment
Manual stock adjustment (owner only).

## Store Settings

### GET /api/settings
### PUT /api/settings
Update store settings (owner).

## Users

### GET /api/users
List users (owner).

### POST /api/users
Create user (owner).

### GET /api/users/[id]
User detail (owner).

### PUT /api/users/[id]
Update user (owner).

### DELETE /api/users/[id]
Deactivate user (owner).

## Realtime Events

### order.submitted
Triggered when staff submits order.

Payload:
```json
{
  "order_id": "100",
  "order_number": "ORD-20260611-0001",
  "grand_total": 20000,
  "created_by": "Staff 1"
}
```

### order.updated
Triggered when order item/status changes.

### payment.paid
Triggered when QRIS/cash payment confirmed.

### stock.low
Triggered when stock drops below min_stock.

## API Response Envelope

All responses follow a consistent format:

```json
// Success
{ "success": true, "data": { ... }, "message": "..." }

// Collection
{ "success": true, "data": [ ... ], "meta": { "current_page": 1, "per_page": 20, "total": 150, "last_page": 8 } }

// Error
{ "success": false, "message": "Validation failed", "errors": { "email": ["Email sudah terdaftar"] } }
```

## Rate Limiting

- Auth routes: 5 requests per minute
- General API: 60 requests per minute per user
- Webhook: unlimited (Midtrans may send bursts)

## Implementation: Route Handlers vs Server Actions

| Pattern | Use For |
|---------|---------|
| **Route Handlers** (`route.ts`) | Standard CRUD APIs, webhooks, endpoints called from client-side TanStack Query |
| **Server Actions** (`"use server"`) | Form submissions that need direct DB access (product create/edit, settings save) |
