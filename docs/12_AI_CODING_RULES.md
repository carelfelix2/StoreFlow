# AI Coding Rules for DeepSeek/Roo Code

## Project Context
You are building Felix Snack POS, a modern multi-device POS web app for a snack wholesale/retail store.

## Main Goal
Build a fast, clean, production-ready POS system using Next.js frontend and Laravel API/backend.

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
- Use TanStack Query/SWR for API data fetching.
- Use centralized API client.
- All currency must use formatCurrency().
- All date display must use formatDate().

## Backend Rules
- Use REST API.
- Validate all requests.
- Enforce role permission.
- Never trust frontend totals.
- Backend must recalculate order totals.
- Backend must verify stock availability.
- Stock only decreases after payment paid.
- Payment webhook must be validated.
- Store all payment logs.
- Store all order status logs.

## Database Rules
- Use migrations.
- Use foreign keys.
- Use enum-like statuses carefully.
- Use soft delete for products.
- Store price snapshots in order_items.
- Store product_name snapshot in order_items.
- Use stock_movements for every stock change.

## Do Not
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
