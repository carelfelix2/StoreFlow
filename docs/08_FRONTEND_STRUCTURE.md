# Frontend Structure

## Framework
- Next.js 15 (Full Stack — frontend + API Route Handlers)
- App Router
- TypeScript
- Tailwind CSS
- shadcn/ui

## Monorepo Structure

```
Z:/StoreFlow/
├── frontend/                        # Next.js 15 Full Stack App
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/                 # Route Handlers (REST API)
│   │   │   │   ├── auth/            # Auth.js route handlers
│   │   │   │   ├── products/
│   │   │   │   │   ├── route.ts     # GET (list), POST (create)
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── route.ts # GET, PUT, DELETE
│   │   │   │   │       └── toggle/route.ts
│   │   │   │   ├── categories/
│   │   │   │   ├── orders/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── route.ts
│   │   │   │   │       ├── review/route.ts
│   │   │   │   │       ├── items/route.ts
│   │   │   │   │       ├── approve/route.ts
│   │   │   │   │       ├── cancel/route.ts
│   │   │   │   │       ├── complete/route.ts
│   │   │   │   │       └── payments/
│   │   │   │   │           ├── cash/route.ts
│   │   │   │   │           └── qris/route.ts
│   │   │   │   ├── payments/
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   ├── status/route.ts
│   │   │   │   │   │   └── manual-paid/route.ts
│   │   │   │   │   └── webhook/route.ts
│   │   │   │   ├── reports/
│   │   │   │   ├── stock/
│   │   │   │   ├── settings/
│   │   │   │   └── users/
│   │   │   │
│   │   │   ├── (auth)/
│   │   │   │   ├── layout.tsx
│   │   │   │   └── login/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   ├── cashier/
│   │   │   │   ├── orders/
│   │   │   │   ├── products/
│   │   │   │   ├── stock/
│   │   │   │   ├── reports/
│   │   │   │   └── settings/
│   │   │   │
│   │   │   ├── staff/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── order/
│   │   │   │   └── order-success/
│   │   │   │
│   │   │   └── customer-display/
│   │   │       └── [deviceId]/
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn/ui components
│   │   │   ├── layout/
│   │   │   │   ├── app-sidebar.tsx
│   │   │   │   ├── app-header.tsx
│   │   │   │   └── mobile-bottom-nav.tsx
│   │   │   ├── auth/
│   │   │   │   └── auth-provider.tsx
│   │   │   ├── cashier/
│   │   │   ├── staff-order/
│   │   │   ├── customer-display/
│   │   │   ├── products/
│   │   │   └── reports/
│   │   │
│   │   ├── hooks/
│   │   │   ├── use-auth.ts
│   │   │   ├── use-orders.ts
│   │   │   ├── use-products.ts
│   │   │   ├── use-realtime-orders.ts
│   │   │   └── use-payment-status.ts
│   │   │
│   │   ├── lib/
│   │   │   ├── prisma.ts            # Prisma client singleton
│   │   │   ├── auth.ts              # Auth.js config
│   │   │   ├── auth-helpers.ts      # getSession, requireRole
│   │   │   ├── api.ts               # Axios client
│   │   │   ├── pusher.ts            # Pusher server SDK
│   │   │   ├── midtrans.ts          # Midtrans API wrapper
│   │   │   ├── format-currency.ts
│   │   │   ├── format-date.ts
│   │   │   ├── constants.ts
│   │   │   └── utils.ts
│   │   │
│   │   ├── store/
│   │   │   ├── auth-store.ts
│   │   │   ├── order-cart-store.ts
│   │   │   ├── cashier-store.ts
│   │   │   └── ui-store.ts
│   │   │
│   │   └── types/
│   │       ├── user.ts
│   │       ├── product.ts
│   │       ├── order.ts
│   │       ├── payment.ts
│   │       └── report.ts
│   │
│   ├── prisma/
│   │   └── schema.prisma            # Database schema (Prisma)
│   │
│   ├── auth.ts                      # Auth.js root config (Next.js v5 convention)
│   ├── proxy.ts                     # Edge proxy for route protection
│   ├── middleware.ts                # (Deprecated — migrated to proxy.ts)
│   ├── next.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.local
│
└── docs/                            # All markdown documentation
```

## Routes

### Public
- `/login`
- `/customer-display/[deviceId]`

### Owner/Kasir
- `/dashboard`
- `/cashier`
- `/products`
- `/stock`
- `/reports`
- `/settings`

### Staff
- `/staff/order`
- `/staff/order-success`

## State Management

### Zustand
Use for:
- Staff cart (order-cart-store)
- Active cashier order (cashier-store)
- Auth state (auth-store)
- UI state (ui-store: sidebar, dialogs)

### TanStack Query
Use for:
- Fetch products, categories
- Fetch orders, order detail
- Fetch reports
- Mutations: create/update/delete
- Payment status polling

## Naming Rules
- Components use PascalCase
- Hooks start with `use`
- Types use PascalCase
- API Route Handlers export named functions: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
- Server Actions use camelCase with `"use server"` directive

## Frontend Rules
- All API response types must be defined in `src/types`.
- All currency display must use `formatCurrency()`.
- Do not hardcode Indonesian Rupiah manually.
- Avoid duplicate UI components.
- Use shadcn/ui components where possible.
- Mobile staff page must be optimized first.
- Cashier page must work on 1366x768 laptop screen.
- Customer display must support fullscreen monitor.
- Never access Prisma directly from client components — always go through Route Handlers or Server Actions.
