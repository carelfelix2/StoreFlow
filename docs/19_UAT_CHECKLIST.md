# Phase 13 — UAT Checklist & Bug Bash

> **Goal:** Test StoreFlow like it will be used in the real snack store.
> Fix critical UX/flow bugs that disrupt the primary ordering-to-receipt pipeline.
> **Do NOT add new features, change architecture, or modify schema.**

---

## Test Scenarios

### Flow 1: Owner Creates Product / Category / User

- [ ] **1.1** Owner can create a new **category** (name, slug, active)
- [ ] **1.2** Owner can create a new **product** with:
  - Name, SKU, base unit, category
  - At least one unit (default) with conversion and selling price
  - Initial stock & minimum stock
  - Image URL (optional)
- [ ] **1.3** Owner can create a **new user** (staff or cashier role)
- [ ] **1.4** Owner can **toggle product active/inactive**
- [ ] **1.5** Owner can **toggle user active/inactive**
- [ ] **1.6** Created products appear in staff order page
- [ ] **1.7** Created users can log in with their credentials
- [ ] **1.8** Validation errors shown for duplicate SKU/empty fields
- [ ] **1.9** Form resets properly after successful creation

### Flow 2: Staff Creates Order (Mobile)

- [ ] **2.1** Staff can log in on mobile-sized viewport (360–430px)
- [ ] **2.2** Product list loads and is scrollable
- [ ] **2.3** Category filter works (switches between categories)
- [ ] **2.4** Search bar filters products in real-time
- [ ] **2.5** Unit selector shows available units for a product
- [ ] **2.6** "Add to cart" increments cart badge in bottom bar
- [ ] **2.7** Cart sheet opens with correct items, quantities, prices
- [ ] **2.8** Quantity can be increased/decreased in cart
- [ ] **2.9** Items can be removed from cart
- [ ] **2.10** Customer name (optional) and notes can be entered
- [ ] **2.11** "Kirim Pesanan" button shows loading state during submission
- [ ] **2.12** After submission, cart is cleared and redirected to success page
- [ ] **2.13** Success page shows order number, items, status = "Menunggu Konfirmasi"
- [ ] **2.14** Error state shown if API fails (toast with error message)
- [ ] **2.15** Empty cart state shows appropriate message
- [ ] **2.16** **BUG CHECK:** Double-submit prevention — button disabled while `isPending`

### Flow 3: Cashier Reviews Order

- [ ] **3.1** Cashier can log in and see cashier page
- [ ] **3.2** Submitted orders appear in "Active" tab with "Menunggu Review" badge
- [ ] **3.3** Clicking order opens detail drawer with items, totals, logs
- [ ] **3.4** "Review" button is visible for submitted orders
- [ ] **3.5** Clicking "Review" changes status to "reviewing" and shows toast
- [ ] **3.6** Order moves from "Active" to "Reviewing" tab after review
- [ ] **3.7** **BUG CHECK:** Stale data — after review, the order detail drawer should reflect updated status
- [ ] **3.8** Error state if API fails during review

### Flow 4: Cashier Approves Order

- [ ] **4.1** Reviewing orders appear in "Reviewing" tab
- [ ] **4.2** "Approve" button is visible for reviewing orders
- [ ] **4.3** Clicking "Approve" changes status to "approved" and shows toast
- [ ] **4.4** Order moves from "Reviewing" to "Approved" tab
- [ ] **4.5** **BUG CHECK:** Stale data — after approval, the drawer should reflect updated status
- [ ] **4.6** Cancel button visible for submitted/reviewing orders (cancels order)

### Flow 5: Cashier Pays Cash

- [ ] **5.1** Approved orders appear in "Approved" tab
- [ ] **5.2** "Bayar Tunai" button opens cash payment dialog
- [ ] **5.3** Dialog shows order total (grand_total)
- [ ] **5.4** Cashier enters paid_amount >= grand_total
- [ ] **5.5** Change amount calculated correctly (paid_amount - grand_total)
- [ ] **5.6** Submitting payment shows loading state
- [ ] **5.7** **BUG CHECK:** After payment, order detail drawer closes or shows updated "paid" status
- [ ] **5.8** Order moves from "Approved" to "Paid" tab
- [ ] **5.9** Error if paid_amount < grand_total (insufficient payment)
- [ ] **5.10** Error if order not in "approved" status
- [ ] **5.11** **BUG CHECK:** No duplicate payment allowed

### Flow 6: Stock Decreases After Payment

- [ ] **6.1** Before payment, note current stock of product in order
- [ ] **6.2** Process cash payment for the order
- [ ] **6.3** Stock page shows decreased stock for the product
- [ ] **6.4** Stock movement recorded with type "sale" and negative qty
- [ ] **6.5** Stock movement shows correct stock_before and stock_after
- [ ] **6.6** **EDGE CASE:** Insufficient stock at payment time throws error (if stock was consumed by another order between creation and payment)

### Flow 7: Receipt Prints

- [ ] **7.1** Paid orders appear in "Paid" tab
- [ ] **7.2** "Cetak Struk" button visible for paid orders
- [ ] **7.3** Clicking opens receipt preview dialog with:
  - Store name, address, phone from settings
  - Order number, date, cashier name
  - Items with qty, price, subtotal
  - Total, payment method, paid amount, change
  - Footer message
- [ ] **7.4** Receipt preview triggers browser print dialog
- [ ] **7.5** After print, order status changes to "printed"
- [ ] **7.6** Order moves from "Paid" to "Printed" tab
- [ ] **7.7** Receipt data matches actual order data (items, prices, totals)
- [ ] **7.8** **REPRINT:** Already printed orders can reprint (idempotent)
- [ ] **7.9** Reprint shows "=== REPRINT ===" label on receipt
- [ ] **7.10** **BUG CHECK:** After printing, drawer shows updated "printed" status

### Flow 8: Customer Display Updates

- [ ] **8.1** Cashier can open customer display via "Open Customer Display" button
- [ ] **8.2** New browser window opens with customer display page
- [ ] **8.3** Initial state shows "idle" screen
- [ ] **8.4** Cashier selects an order and clicks "Send to Display"
- [ ] **8.5** Customer display shows order items, totals, and status
- [ ] **8.6** After payment, sending order to display again shows "paid" state with paid/change amounts
- [ ] **8.7** After printing, sending order to display again shows "printed" state
- [ ] **8.8** "Clear Display" button resets to idle
- [ ] **8.9** **BUG CHECK:** Closing display clears localStorage device ID properly
- [ ] **8.10** **BUG CHECK:** Saved device ID persists across page refreshes (localStorage)

### Flow 9: Reports Show Transaction

- [ ] **9.1** Reports page loads with summary tab by default (today's data)
- [ ] **9.2** KPI cards show correct: total sales, transaction count, cash total, QRIS total, gross profit, avg transaction value
- [ ] **9.3** "Penjualan" tab lists paid orders with order details
- [ ] **9.4** "Produk" tab shows top-selling products with qty and sales
- [ ] **9.5** "Stok" tab shows current stock levels with low-stock indicators
- [ ] **9.6** "Pembayaran" tab splits by payment method (cash/QRIS)
- [ ] **9.7** Date filters work (presets + custom range)
- [ ] **9.8** CSV export produces downloadable file with correct data
- [ ] **9.9** Pagination works for large datasets
- [ ] **9.10** Empty state shown when no transactions in date range

### Flow 10: Backup Export Works

- [ ] **10.1** Settings → "Backup & Audit" tab loads
- [ ] **10.2** Export buttons for: categories, users, stock, products, orders, payments
- [ ] **10.3** Each export produces a JSON file with download
- [ ] **10.4** Health check returns "healthy" with no errors
- [ ] **10.5** Audit logs show order history and payment logs
- [ ] **10.6** Stock movements shown with correct details
- [ ] **10.7** **BUG CHECK:** Export works even with large datasets (pagination)

---

## Responsive / Mobile Checks

- [ ] **R1** Login page fits 360–430px viewports (no horizontal scroll)
- [ ] **R2** Cashier page order cards stack properly on mobile
- [ ] **R3** Staff order page product grid is touch-friendly (min 44px tap targets)
- [ ] **R4** Bottom navigation bar visible and functional on mobile
- [ ] **R5** Sidebar works as overlay on mobile with backdrop
- [ ] **R6** All dialogs/sheets are responsive (no overflow off-screen)
- [ ] **R7** Tables horizontally scroll without breaking layout

---

## Role Access Checks

- [ ] **A1** Staff can ONLY see their own orders in order list
- [ ] **A2** Staff CANNOT access cashier page
- [ ] **A3** Staff CANNOT access settings page
- [ ] **A4** Cashier CAN see all orders
- [ ] **A5** Cashier CAN review, approve, process payment, print
- [ ] **A6** Cashier CANNOT void orders (owner only)
- [ ] **A7** Cashier CANNOT create users (owner only)
- [ ] **A8** Owner can access everything

---

## Error & Edge Cases

- [ ] **E1** Network error shows toast with retry option
- [ ] **E2** 401 redirects to login page
- [ ] **E3** 403 shows forbidden message
- [ ] **E4** Empty states for all list views
- [ ] **E5** Loading skeletons for all data-fetching views
- [ ] **E6** Product out of stock at payment time shows clear error
- [ ] **E7** Cancelled orders cannot be reviewed/approved/paid
- [ ] **E8** Voided orders cannot be reviewed/approved/paid
- [ ] **E9** Receipt not available for unpaid orders
- [ ] **E10** Duplicate payment prevented
