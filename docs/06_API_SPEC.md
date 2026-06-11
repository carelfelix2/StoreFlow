# API Spec

Base URL:
`/api`

## Auth

### POST /auth/login
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
    "role": "owner"
  },
  "token": "jwt/session-token"
}
```

### POST /auth/logout

## Products

### GET /products
Query:
- search
- category_id
- is_active
- low_stock

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

### POST /products
Create product.

### PUT /products/{id}
Update product.

### DELETE /products/{id}
Soft delete / deactivate product.

## Categories

### GET /categories
### POST /categories
### PUT /categories/{id}
### DELETE /categories/{id}

## Orders

### POST /orders
Create draft/submitted order.

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

### GET /orders
Query:
- status
- date
- created_by
- cashier_id

### GET /orders/{id}
Detail order.

### PATCH /orders/{id}/review
Set status reviewing.

### PATCH /orders/{id}/items
Edit item sebelum paid.

### PATCH /orders/{id}/approve
Approve order.

### PATCH /orders/{id}/cancel
Cancel order sebelum paid.

### PATCH /orders/{id}/complete
Complete order setelah paid/printed.

## Payments

### POST /orders/{id}/payments/cash
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

### POST /orders/{id}/payments/qris
Generate QRIS.

Response:
```json
{
  "payment_id": "1",
  "status": "pending",
  "qris_url": "https://...",
  "expired_at": "2026-06-11T17:00:00+07:00"
}
```

### GET /payments/{id}/status
Check payment status.

### POST /payments/webhook
Payment gateway callback.

### PATCH /payments/{id}/manual-paid
Fallback manual mark as paid. Owner/kasir only.

## Receipt

### GET /orders/{id}/receipt
Return receipt data.

### POST /orders/{id}/print
Mark as printed.

## Reports

### GET /reports/daily
Query:
- date

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

### GET /reports/products
### GET /reports/stock
### GET /reports/payments

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
Triggered when QRIS/cash paid.

### stock.low
Triggered when stock below min_stock.
