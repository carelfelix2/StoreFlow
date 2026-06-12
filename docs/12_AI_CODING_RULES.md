# AI Coding Rules for DeepSeek/Roo Code

## Project Context
You are building Felix Snack POS, a modern multi-device POS web app for a snack wholesale/retail store.

## Main Goal
Build a fast, clean, production-ready POS system using Full Next.js architecture (frontend + backend in one project).

## Architecture
- **Next.js 15** is the full-stack framework
- **Route Handlers** (`src/app/api/`) for REST API endpoints
- **Server Actions** for form mutations where appropriate
- **Prisma ORM** for database access
- **Auth.js v5** for authentication
- **Never create Laravel, PHP, or separate backend files.** Everything lives in the Next.js project.

## Coding Principles
- Keep code simple and maintainable.
- Do not over-engineer.
- Prioritize MVP features first.
- Mobile staff order page must be very fast.
- Cashier page must be optimized for laptop screen.
- Use TypeScript strictly.
- Avoid duplicate logic.
- Use reusable components.
- Use clear names.

## UI Rules
- Use Tailwind CSS.
- Use shadcn/ui components.
- Use Lucide icons.
- Use Emerald as primary color.
- Use light mode by default.
- Button must be large enough for touch use.
- Avoid complex animation for POS flow.
- Prioritize speed and clarity.

## Frontend Rules
- Use App Router.
- Use server components where suitable.
- Use client components only when interaction is needed.
- Use React Hook Form + Zod for forms.
- Use Zustand for cart/local UI state.
- Use TanStack Query for API data fetching.
- Use centralized API client.
- All currency must use `formatCurrency()`.
- All date display must use `formatDate()`.

## Backend Rules (Route Handlers + Server Actions)
- Use Prisma for all database queries.
- Validate all requests with Zod schemas.
- Enforce role permission via Auth.js session + helpers.
- Never trust frontend totals — recalculate on server.
- Verify stock availability before order submission.
- Stock only decreases after payment status `paid`.
- Payment webhook must validate Midtrans signature.
- Store all payment logs.
- Store all order status logs.

## Database Rules (Prisma)
- Use Prisma migrations (`npx prisma migrate dev`).
- Use `@relation` for foreign keys.
- Use enums for statuses via Prisma enum types.
- Use soft delete for products (`is_active = false`).
- Store price snapshots in `order_items`.
- Store product name snapshot in `order_items`.
- Use `stock_movements` for every stock change.

## File Organization

```
src/
  app/
    api/                          # Route Handlers (REST API)
      auth/                       # Auth.js configuration
      products/
        route.ts                  # GET (list), POST (create)
        [id]/
          route.ts                # GET, PUT, DELETE
          toggle/route.ts         # PATCH toggle active
      categories/
        route.ts
        [id]/route.ts
      orders/
        route.ts
        [id]/
          route.ts
          review/route.ts
          items/route.ts
          approve/route.ts
          cancel/route.ts
          complete/route.ts
          payments/
            cash/route.ts
            qris/route.ts
          receipt/route.ts
          print/route.ts
      payments/
        [id]/
          status/route.ts
          manual-paid/route.ts
        webhook/route.ts
      reports/
        daily/route.ts
        products/route.ts
        stock/route.ts
        payments/route.ts
      stock/
        movements/route.ts
        adjustment/route.ts
      settings/route.ts
      users/
        route.ts
        [id]/route.ts
  lib/
    prisma.ts                     # Prisma client singleton
    auth.ts                       # Auth.js configuration
    auth-helpers.ts               # getSession, requireRole, etc.
    pusher.ts                     # Pusher server SDK
    midtrans.ts                   # Midtrans API wrapper
    format-currency.ts
    format-date.ts
    constants.ts
    utils.ts
  types/
    user.ts
    product.ts
    order.ts
    payment.ts
    report.ts
```

## Do Not
- Do not create Laravel, PHP, or separate backend files.
- Do not build all features at once.
- Do not add dark mode first.
- Do not make dashboard too crowded.
- Do not use random UI libraries outside shadcn unless necessary.
- Do not hardcode data if API is already available.
- Do not allow staff to change prices.
- Do not reduce stock before payment.
- Do not mark QRIS as paid from frontend only.
- Do not expose technical errors to end users.

## Definition of Done
A feature is done when:
- UI works
- API connected
- Validation exists
- Loading state exists
- Empty state exists
- Error state exists
- Role permission works
- Tested on laptop and mobile screen
