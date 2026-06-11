# Database Schema

## users
| Column | Type | Notes |
|---|---|---|
| id | uuid/bigint | primary key |
| name | string | user name |
| email | string | unique |
| password | string | hashed |
| role | enum | owner, cashier, staff |
| is_active | boolean | default true |
| created_at | timestamp | |
| updated_at | timestamp | |

## categories
| Column | Type | Notes |
|---|---|---|
| id | uuid/bigint | primary |
| name | string | |
| slug | string | unique |
| color | string | optional |
| icon | string | optional |
| is_active | boolean | |
| created_at | timestamp | |
| updated_at | timestamp | |

## products
| Column | Type | Notes |
|---|---|---|
| id | uuid/bigint | primary |
| category_id | foreign key | categories |
| name | string | |
| sku | string | nullable unique |
| barcode | string | nullable |
| image | string | nullable |
| base_unit | string | pcs |
| cost_price | decimal | harga modal |
| selling_price | decimal | harga jual default |
| stock | integer/decimal | stok dalam base unit |
| min_stock | integer/decimal | alert stok |
| is_active | boolean | |
| created_at | timestamp | |
| updated_at | timestamp | |

## product_units
Untuk multi-satuan.

| Column | Type | Notes |
|---|---|---|
| id | uuid/bigint | primary |
| product_id | foreign key | products |
| unit_name | string | pcs, renteng, dus |
| conversion_to_base | decimal | contoh 1 dus = 40 pcs |
| selling_price | decimal | harga per satuan |
| is_default | boolean | |
| created_at | timestamp | |
| updated_at | timestamp | |

## customers
Opsional untuk buyer tetap/grosir.

| Column | Type | Notes |
|---|---|---|
| id | uuid/bigint | primary |
| name | string | |
| phone | string | nullable |
| address | text | nullable |
| type | enum | regular, reseller, grosir |
| created_at | timestamp | |
| updated_at | timestamp | |

## orders
| Column | Type | Notes |
|---|---|---|
| id | uuid/bigint | primary |
| order_number | string | unique |
| customer_id | foreign key | nullable |
| customer_name | string | nullable |
| created_by | foreign key | staff user |
| cashier_id | foreign key | nullable |
| status | enum | draft, submitted, reviewing, approved, waiting_payment, paid, printed, completed, cancelled, voided |
| subtotal | decimal | |
| discount_total | decimal | default 0 |
| tax_total | decimal | default 0 |
| grand_total | decimal | |
| notes | text | nullable |
| submitted_at | timestamp | nullable |
| approved_at | timestamp | nullable |
| paid_at | timestamp | nullable |
| completed_at | timestamp | nullable |
| cancelled_at | timestamp | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

## order_items
| Column | Type | Notes |
|---|---|---|
| id | uuid/bigint | primary |
| order_id | foreign key | orders |
| product_id | foreign key | products |
| product_name | string | snapshot |
| unit_name | string | pcs/dus/etc |
| qty | decimal | |
| conversion_to_base | decimal | |
| base_qty | decimal | qty * conversion |
| price | decimal | selling price snapshot |
| cost_price | decimal | cost snapshot |
| subtotal | decimal | qty * price |
| created_at | timestamp | |
| updated_at | timestamp | |

## payments
| Column | Type | Notes |
|---|---|---|
| id | uuid/bigint | primary |
| order_id | foreign key | orders |
| method | enum | cash, qris |
| status | enum | pending, paid, failed, expired, cancelled, refunded |
| amount | decimal | |
| paid_amount | decimal | cash received |
| change_amount | decimal | cash change |
| gateway | string | midtrans/xendit nullable |
| gateway_reference | string | nullable |
| qris_url | text | nullable |
| expired_at | timestamp | nullable |
| paid_at | timestamp | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

## payment_logs
| Column | Type | Notes |
|---|---|---|
| id | uuid/bigint | primary |
| payment_id | foreign key | payments |
| event | string | webhook_received, status_checked, manual_paid |
| payload | json | nullable |
| created_at | timestamp | |

## stock_movements
| Column | Type | Notes |
|---|---|---|
| id | uuid/bigint | primary |
| product_id | foreign key | products |
| order_id | foreign key | nullable |
| type | enum | sale, stock_in, adjustment, return, void |
| qty | decimal | positive/negative |
| stock_before | decimal | |
| stock_after | decimal | |
| notes | text | nullable |
| created_by | foreign key | users |
| created_at | timestamp | |

## order_logs
| Column | Type | Notes |
|---|---|---|
| id | uuid/bigint | primary |
| order_id | foreign key | orders |
| user_id | foreign key | nullable |
| action | string | status_changed, item_updated, payment_started |
| old_value | json | nullable |
| new_value | json | nullable |
| created_at | timestamp | |

## store_settings
| Column | Type | Notes |
|---|---|---|
| id | uuid/bigint | primary |
| store_name | string | |
| address | text | |
| phone | string | |
| receipt_footer | text | |
| logo | string | nullable |
| qris_provider | string | |
| printer_type | string | browser, escpos |
| created_at | timestamp | |
| updated_at | timestamp | |
