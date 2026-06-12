# Development Roadmap

## Phase 0 — Setup Project
- Setup Next.js 15 with TypeScript
- Setup Tailwind CSS
- Setup shadcn/ui (Emerald primary)
- Setup Prisma with PostgreSQL
- Setup Auth.js v5
- Setup auth layout
- Setup dashboard layout
- Setup API client
- Setup environment variables
- Setup Git repository

## Phase 1 — Auth and Roles
- Login page (credentials provider via Auth.js)
- Logout
- Auth middleware (Next.js proxy.ts)
- Role redirect
- Owner/Kasir/Staff access
- Protected routes
- Session hydration via AuthProvider

## Phase 2 — Product and Category
- Category CRUD (Route Handlers + Prisma)
- Product CRUD (Route Handlers + Prisma)
- Product unit CRUD
- Search product
- Low stock indicator
- Product active/inactive

## Phase 3 — Staff Order Input
- Mobile-first order page
- Product search
- Category chips
- Product card
- Plus/minus qty
- Cart summary (Zustand)
- Submit order
- Success page

## Phase 4 — Cashier Order Queue
- Realtime order queue (Pusher)
- Order detail panel
- Review order
- Edit item qty
- Remove item
- Approve order
- Cancel order
- Server: order status state machine via Route Handlers

## Phase 5 — Payment
- Cash payment (Route Handler + Prisma transaction)
- QRIS payment (Route Handler + Midtrans API)
- Payment status polling
- Webhook handler (`POST /api/payments/webhook` with Midtrans signature validation)
- Manual payment fallback
- Payment logs

## Phase 6 — Receipt
- Receipt preview
- Browser print
- Print status
- Reprint
- Thermal CSS

## Phase 7 — Stock
- Stock movement tracking
- Auto reduce stock after paid (Prisma transaction)
- Stock adjustment
- Stock in
- Low stock alert

## Phase 8 — Reports
- Daily sales
- Cash vs QRIS
- Transaction count
- Top products
- Gross profit
- Stock report

## Phase 9 — Customer Display
- Fullscreen display
- Current order display (via Pusher)
- QRIS display
- Payment success display
- Device token

## Phase 10 — Polish
- Responsive refinement
- Loading states
- Empty states
- Error handling
- Toast notifications
- UX testing with actual toko workflow

## Build Priority
1. Product data
2. Staff input order
3. Cashier approval
4. Cash payment
5. Receipt
6. Stock deduction
7. QRIS
8. Report
9. Customer display
