# DeepSeek Prompts

## Prompt 1 — Initial Project Setup

Use this prompt after creating a new Next.js project:

```text
Read all markdown files in this project first.

We are building Felix Snack POS, a modern multi-device POS system for a snack store.

Tech stack:
- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand
- React Hook Form
- Zod
- TanStack Query/SWR
- Backend will be Laravel API

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
- Realtime-ready architecture
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
- Product table
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

## Prompt 7 — Backend Laravel API

```text
Read all markdown files first.

Build Laravel API backend for Felix Snack POS.

Requirements:
- Auth
- Role permissions
- Products
- Categories
- Product units
- Orders
- Order items
- Payments
- Stock movements
- Reports
- Payment logs
- Order logs

Follow:
- 05_DATABASE_SCHEMA.md
- 06_API_SPEC.md
- 12_AI_CODING_RULES.md

Important:
- Backend must recalculate totals.
- Stock only decreases after payment paid.
- Store price snapshots in order_items.
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
```
