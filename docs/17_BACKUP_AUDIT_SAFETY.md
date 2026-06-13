# Phase 11 — Backup, Audit & Data Safety

## Overview

Phase 11 adds data safety features to StoreFlow: **CSV export backups**, an **audit trail viewer**, **integrity health checks**, and **safety confirmation dialogs** for destructive actions. All features are **owner-only** and accessible from **Settings → Backup & Audit** tab.

---

## 1. Backup Export (CSV)

### Endpoints

Seven CSV export endpoints live under [`/api/admin/export/`](frontend/src/app/api/admin/export/). Each returns a file download with `Content-Disposition: attachment`:

| Endpoint | File | Description |
|----------|------|-------------|
| `GET /api/admin/export/products` | `products-{date}.csv` | All products (including inactive) with category, units, prices, stock |
| `GET /api/admin/export/categories` | `categories-{date}.csv` | All categories with slug, color, icon, active status |
| `GET /api/admin/export/users` | `users-{date}.csv` | All users (password excluded) with role, active status |
| `GET /api/admin/export/orders` | `orders-{date}.csv` | All orders with customer, status history timestamps, totals |
| `GET /api/admin/export/order-items` | `order-items-{date}.csv` | All order items with order number, product, qty, prices, unit |
| `GET /api/admin/export/payments` | `payments-{date}.csv` | All payments with method, gateway, amount, timestamps |
| `GET /api/admin/export/stock-movements` | `stock-movements-{date}.csv` | All stock movements with product, type, qty, unit conversions |

### How It Works

1. Owner clicks an "Export X" button in **Settings → Backup & Audit**
2. [`triggerExport()`](frontend/src/hooks/use-admin.ts:86) function sends a GET request via Axios with `responseType: "blob"`
3. Server validates role via [`requireRole(["owner"])`](frontend/src/lib/auth-helpers.ts:53), queries Prisma, builds CSV with proper escaping
4. Browser receives the blob and triggers a download via `URL.createObjectURL` + `<a>` click

### Implementation Files

- **Export routes**: [`frontend/src/app/api/admin/export/`](frontend/src/app/api/admin/export/) (7 route files)
- **Export hooks**: [`frontend/src/hooks/use-admin.ts`](frontend/src/hooks/use-admin.ts) (contains [`useAdminExport*`](frontend/src/hooks/use-admin.ts:121) hooks and [`triggerExport()`](frontend/src/hooks/use-admin.ts:86))
- **UI component**: [`frontend/src/components/settings/backup-audit-tab.tsx`](frontend/src/components/settings/backup-audit-tab.tsx) (contains [`BackupExportSection`](frontend/src/components/settings/backup-audit-tab.tsx:56))

### Usage

1. Log in as **owner**
2. Go to **Settings** (sidebar gear icon)
3. Click the **Backup & Audit** tab
4. Under **Backup Export**, click any entity button to download its CSV

---

## 2. Audit View

### Endpoint

**`GET /api/admin/audit?type={type}&limit={limit}`**

| Query Param | Values | Default |
|------------|--------|---------|
| `type` | `"order_logs"`, `"payment_logs"`, `"stock_movements"`, `"all"` | `"all"` |
| `limit` | Positive integer | `50` |

Returns structured audit data grouped by type:

- **Order Logs**: action, user name, order number, old/new values, timestamp
- **Payment Logs**: method, amount, gateway ref, user, timestamp
- **Stock Movements**: product name, type (in/out/adjustment), qty, unit, user, timestamp

### UI

The audit viewer ([`AuditViewSection`](frontend/src/components/settings/backup-audit-tab.tsx:300)) provides:

1. **Type tabs**: Order Logs | Payment Logs | Stock Movements
2. **Scrollable tables** with hover-able rows
3. **Error/empty states** with descriptive messages

### Implementation Files

- **Audit route**: [`frontend/src/app/api/admin/audit/route.ts`](frontend/src/app/api/admin/audit/)
- **Audit hook**: [`useAudit()`](frontend/src/hooks/use-admin.ts:217) in `use-admin.ts`
- **UI component**: [`AuditViewSection`](frontend/src/components/settings/backup-audit-tab.tsx:300), [`AuditOrderLogsTable`](frontend/src/components/settings/backup-audit-tab.tsx:386), [`AuditPaymentLogsTable`](frontend/src/components/settings/backup-audit-tab.tsx:423), [`AuditStockMovementsTable`](frontend/src/components/settings/backup-audit-tab.tsx:463)

---

## 3. Health Check API

### Endpoint

**`GET /api/admin/health-check`**

Returns a JSON response with 5 integrity checks and any detected issues.

### Checks Performed

| # | Check | Description | Query |
|---|-------|-------------|-------|
| 1 | **Negative Stock** | Products whose `stock` is below 0 | `WHERE stock < 0` |
| 2 | **Paid Without Payment** | Orders with status `paid` but no payment record | `LEFT JOIN payments WHERE payment.id IS NULL` |
| 3 | **Payment Without Paid At** | Payments with status `completed` but `paid_at` is null | `WHERE status = 'completed' AND paid_at IS NULL` |
| 4 | **Orphan Stock Movements** | Stock movements referencing a deleted product | `LEFT JOIN products WHERE product.id IS NULL` |
| 5 | **Grand Total Mismatch** | Orders whose `grand_total` doesn't match `SUM(items.subtotal)` within 0.01 tolerance | Raw SQL with `CAST` and `HAVING ABS(...) > 0.01` |

### Response Shape

```typescript
interface HealthCheckResult {
  status: "healthy" | "warning" | "issues_found";
  timestamp: string;
  checks: Array<{
    name: string;
    status: "passed" | "warning" | "failed";
    count: number;
  }>;
  issues: Array<{
    check: string;
    type: "warning" | "error";
    message: string;
    data: Record<string, unknown>;
  }>;
}
```

### UI

The health check card ([`HealthCheckSection`](frontend/src/components/settings/backup-audit-tab.tsx:120)) shows:

1. **Status banner**: green (healthy), yellow (warnings), red (issues found)
2. **Per-check results**: each check with passed/warning/failed badge and count
3. **Issues list**: scrollable list of specific items with details
4. **Refresh button** to re-run checks

### Implementation Files

- **Health check route**: [`frontend/src/app/api/admin/health-check/route.ts`](frontend/src/app/api/admin/health-check/)
- **Health check hook**: [`useHealthCheck()`](frontend/src/hooks/use-admin.ts:191)
- **UI component**: [`HealthCheckSection`](frontend/src/components/settings/backup-audit-tab.tsx:120)

---

## 4. Safety Confirmation Dialogs

### Product Deactivation

File: [`frontend/src/app/(dashboard)/products/page.tsx`](frontend/src/app/(dashboard)/products/page.tsx)

When an owner clicks "Nonaktifkan" on a product, a confirmation dialog appears:

- Title: "Nonaktifkan Produk"
- Warning: "Produk yang dinonaktifkan tidak akan muncul di daftar produk kasir dan staf"
- Button: Red "Nonaktifkan" (destructive variant)
- Cancel button available

Uses [`handleToggleClick`](frontend/src/app/(dashboard)/products/page.tsx:219) to open dialog, [`handleToggleConfirm`](frontend/src/app/(dashboard)/products/page.tsx:224) to execute.

### User Deactivation

File: [`frontend/src/components/users/user-management-table.tsx`](frontend/src/components/users/user-management-table.tsx)

When an owner clicks "Nonaktifkan" on a user:

- Title: "Nonaktifkan Pengguna"
- Warning: "Pengguna yang dinonaktifkan tidak akan bisa login"
- Button: Red "Nonaktifkan"

Uses [`handleToggleClick`](frontend/src/components/users/user-management-table.tsx:168) and [`handleToggleConfirm`](frontend/src/components/users/user-management-table.tsx:173).

### Cancel Order

File: [`frontend/src/app/(dashboard)/cashier/page.tsx`](frontend/src/app/(dashboard)/cashier/page.tsx)

When cancel is clicked on an order, a confirmation dialog appears:

- Title: "Batalkan Pesanan"
- Warning: "Pesanan yang dibatalkan tidak dapat diproses lebih lanjut"
- Button: Red "Ya, Batalkan"

Uses [`cancelDialogOpen`](frontend/src/app/(dashboard)/cashier/page.tsx) state and [`handleCancelConfirm`](frontend/src/app/(dashboard)/cashier/page.tsx:329).

### Void Order

File: [`frontend/src/app/(dashboard)/cashier/page.tsx`](frontend/src/app/(dashboard)/cashier/page.tsx)

When void is clicked on a paid/printed/completed order, a confirmation dialog appears:

- Title: "Void Pesanan"
- Warning: "Pesanan yang sudah dibayar akan ditandai sebagai void. Tindakan ini tidak dapat dibatalkan."
- **Special warning**: "Void pesanan tidak membatalkan pembayaran atau mengembalikan stok secara otomatis. Lakukan rekonsiliasi manual jika diperlukan."
- Button: Red "Ya, Void"

Uses [`voidDialogOpen`](frontend/src/app/(dashboard)/cashier/page.tsx) state and [`handleVoidConfirm`](frontend/src/app/(dashboard)/cashier/page.tsx:341).

---

## 5. Void Order — Technical Details

### Backend

| Layer | File | Function |
|-------|------|----------|
| API Route | [`frontend/src/app/api/orders/[id]/void/route.ts`](frontend/src/app/api/orders/[id]/void/) | `PATCH /api/orders/[id]/void` |
| Service | [`frontend/src/server/db/services/order-service.ts`](frontend/src/server/db/services/order-service.ts:348) | [`voidOrder()`](frontend/src/server/db/services/order-service.ts:348) |
| Repository | [`frontend/src/server/db/repositories/order-repository.ts`](frontend/src/server/db/repositories/order-repository.ts:283) | [`updateStatus("voided")`](frontend/src/server/db/repositories/order-repository.ts:283) |

### Constraints

- **Owner-only**: Requires [`requireRole(["owner"])`](frontend/src/lib/auth-helpers.ts:53)
- **Voidable statuses**: `paid`, `printed`, `completed` only
- **Non-voidable**: `draft`, `review`, `cancelled`, `voided` — will throw [`AuthError`](frontend/src/lib/auth-helpers.ts:67)
- **No automatic reversals**: Void does NOT reverse payments or restore stock (design decision: manual reconciliation required)

### What Happens

1. Sets `order.status = "voided"` and `order.cancelled_at = new Date()`
2. Creates an `ORDER_VOIDED` log entry with old/new status values
3. Returns the updated order

### Frontend

- **API client**: [`voidOrder()`](frontend/src/lib/api/orders.ts:171) in `lib/api/orders.ts`
- **Hook**: [`useVoidOrder()`](frontend/src/hooks/use-orders.ts:110) — invalidates all order queries on success
- **UI**: Void button appears on order detail drawer for orders with status `paid`, `printed`, or `completed`

---

## 6. Settings Tab

File: [`frontend/src/app/(dashboard)/settings/page.tsx`](frontend/src/app/(dashboard)/settings/page.tsx)

A **Backup & Audit** tab is conditionally rendered for owner role only:

```tsx
{isOwner && (
  <TabsTrigger value="backup-audit">Backup & Audit</TabsTrigger>
)}
{isOwner && (
  <TabsContent value="backup-audit">
    <BackupAuditTab />
  </TabsContent>
)}
```

Uses [`BackupAuditTab`](frontend/src/components/settings/backup-audit-tab.tsx:521) component which organizes the three sections (Backup Export, Health Check, Audit View) as a unified tab.

---

## 7. Owner Usage Instructions

### Accessing Backup & Audit

1. Log in with an **owner** account
2. Click **Settings** (⚙️ icon) in the sidebar
3. Select the **Backup & Audit** tab

### Performing a Backup

1. In the **Backup Export** section, click the entity you want to export
2. Wait for the CSV to download automatically
3. The file is named `{entity}-{YYYY-MM-DD}.csv`

### Running a Health Check

1. In the **Health Check** section, click **"Jalankan Pengecekan"** (Run Checks)
2. Review the results:
   - ✅ **Green banner**: All checks passed
   - ⚠️ **Yellow**: Warnings (no critical issues)
   - ❌ **Red**: Issues found that need attention
3. Click the **refresh button** (🔄) to re-run

### Viewing Audit Logs

1. In the **Audit Trail** section, select a log type:
   - **Order Logs**: Status changes, cancellations, voids
   - **Payment Logs**: Payment attempts, completions, failures
   - **Stock Movements**: Stock in, out, and adjustments
2. Scroll through the table to review activity

### Security Notes

- All backup/audit/health-check endpoints require **owner role**
- Non-owner users will receive a `403 Forbidden` response
- CSV exports include **all data** (not filtered by date or status)
- Audit logs are limited to the most recent 50 entries by default
