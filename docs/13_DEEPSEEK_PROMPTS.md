# DeepSeek Prompts

## Prompt 1 — Initial Project Setup

Use this prompt after creating a new Next.js project:

```text
Read all markdown files in this project first.

We are building Felix Snack POS, a modern multi-device POS system for a snack store.

Tech stack:
- Next.js 15 (full stack — frontend + API Route Handlers)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma ORM
- PostgreSQL
- Auth.js v5
- Zustand
- React Hook Form
- Zod
- TanStack Query
- Pusher for realtime
- Midtrans for QRIS

Your task:
Set up the frontend foundation:
1. App layout
2. Auth layout
3. Dashboard layout
4. Basic routing
5. shadcn/ui setup
6. formatCurrency helper
7. formatDate helper
8. Basic type files
9. API client placeholder
10. Prisma schema setup
11. Auth.js configuration

Follow 12_AI_CODING_RULES.md.
Do not build payment or order logic yet.
```

## Prompt 2 — Build Staff Order Page

```text
Read all markdown files first.

Build the mobile-first staff order input page at /staff/order.

Requirements:
- Product search bar
- Category chips
- Product cards
- Plus/minus quantity
- Zustand cart store
- Sticky cart summary
- Submit order button
- Loading, empty, and error states
- Use dummy API data only if backend is not ready
- UI must be fast and touch-friendly

Follow 07_UI_UX_GUIDE.md and 08_FRONTEND_STRUCTURE.md.
```

## Prompt 3 — Build Cashier Screen

```text
Read all markdown files first.

Build /cashier page.

Requirements:
- Left side order queue
- Right side selected order detail
- Realtime-ready architecture (Pusher)
- Buttons: Review, Approve, Cancel, Cash, QRIS
- Payment panel placeholder
- Clean POS layout for 1366x768 laptop
- Use shadcn/ui
- Use TypeScript types from /types

Follow 04_ORDER_WORKFLOW.md.
```

## Prompt 4 — Build Product Management

```text
Read all markdown files first.

Build product management page.

Requirements:
- Product table (TanStack Table)
- Search
- Category filter
- Create/edit product form
- Product units support
- Low stock badge
- Active/inactive status
- Use React Hook Form + Zod
- Use shadcn/ui dialog/sheet

Follow 05_DATABASE_SCHEMA.md.
```

## Prompt 5 — Build Payment UI

```text
Read all markdown files first.

Build payment UI components for cashier.

Requirements:
- Cash payment dialog
- QRIS payment dialog
- Total amount display
- Cash received input
- Change calculation
- QRIS large display placeholder
- Payment status waiting/success/failed
- Button to check status
- Button to change method
- Do not mark QRIS as paid without backend confirmation

Follow 09_PAYMENT_QRIS.md.
```

## Prompt 6 — Build Receipt Page

```text
Read all markdown files first.

Build printable receipt page.

Requirements:
- Thermal 80mm layout
- Receipt preview
- Print button
- Reprint label support
- CSS print media
- Data based on order receipt type

Follow 10_PRINTER_RECEIPT.md.
```

## Prompt 7 — Build API Route Handlers

```text
Read all markdown files first.

Build Next.js Route Handlers (REST API) for Felix Snack POS.

Requirements:
- Auth (via Auth.js — already configured)
- Role permissions (middleware helpers)
- Products (CRUD with multi-unit support)
- Categories (CRUD)
- Orders (submit, review, approve, cancel, complete)
- Order items (edit before paid)
- Payments (cash processing, QRIS generation, webhook handler)
- Stock movements (auto on payment, manual adjustment)
- Reports (daily sales, product ranking)
- Store settings

Tech:
- Route Handlers under src/app/api/
- Prisma for all database access
- Zod for request validation
- Pusher for realtime event emission
- Midtrans SDK for QRIS

Follow:
- 05_DATABASE_SCHEMA.md
- 06_API_SPEC.md
- 12_AI_CODING_RULES.md

Important:
- Backend MUST recalculate totals (never trust frontend).
- Stock only decreases after payment status = paid.
- Store price snapshots in order_items.
- Validate Midtrans webhook signature.
- Wrap payment processing in Prisma transactions.
```

## Prompt 8 — Continue Safely

```text
Before coding:
1. Read all markdown docs.
2. Inspect existing files.
3. Identify current progress.
4. Continue from the latest stable state.
5. Do not rewrite working code unless necessary.
6. Keep changes small and focused.
7. Explain what files were changed.
8. Never create Laravel, PHP, or separate backend files.
```
