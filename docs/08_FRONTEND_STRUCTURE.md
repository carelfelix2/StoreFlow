# Frontend Structure

Framework:
- Next.js 15
- App Router
- TypeScript
- Tailwind CSS
- shadcn/ui

## Folder Structure

```text
src/
  app/
    (auth)/
      login/
        page.tsx

    (dashboard)/
      dashboard/
        page.tsx

      cashier/
        page.tsx

      orders/
        page.tsx
        [id]/
          page.tsx

      products/
        page.tsx

      stock/
        page.tsx

      reports/
        page.tsx

      settings/
        page.tsx

    staff/
      order/
        page.tsx
      order-success/
        page.tsx

    customer-display/
      [deviceId]/
        page.tsx

  components/
    ui/
    layout/
      app-sidebar.tsx
      app-header.tsx
      mobile-bottom-nav.tsx

    cashier/
      order-queue.tsx
      order-detail.tsx
      payment-panel.tsx
      cash-payment-dialog.tsx
      qris-payment-dialog.tsx

    staff-order/
      product-search.tsx
      category-chips.tsx
      product-card.tsx
      cart-summary.tsx

    customer-display/
      display-order.tsx
      qris-display.tsx

    products/
      product-form.tsx
      product-table.tsx
      unit-form.tsx

    reports/
      daily-sales-card.tsx
      top-products-table.tsx

  lib/
    api.ts
    auth.ts
    format-currency.ts
    format-date.ts
    constants.ts

  hooks/
    use-orders.ts
    use-products.ts
    use-realtime-orders.ts
    use-payment-status.ts

  store/
    order-cart-store.ts
    cashier-store.ts
    auth-store.ts

  types/
    user.ts
    product.ts
    order.ts
    payment.ts
    report.ts
```

## Routes

### Public
- `/login`

### Owner/Kasir
- `/dashboard`
- `/cashier`
- `/orders`
- `/orders/[id]`
- `/products`
- `/stock`
- `/reports`
- `/settings`

### Staff
- `/staff/order`
- `/staff/order-success`

### Customer Display
- `/customer-display/[deviceId]`

## State Management

### Zustand
Use for:
- Staff cart
- Active cashier order
- Customer display current order
- UI state

### TanStack Query/SWR
Use for:
- Fetch products
- Fetch orders
- Fetch reports
- Mutations create/update/delete

## Naming Rules
- Components use PascalCase
- Hooks start with use
- Types use PascalCase
- API functions use camelCase

## Frontend Rules
- All API response types must be defined in `src/types`.
- All currency display must use `formatCurrency`.
- Do not hardcode Indonesian Rupiah manually.
- Avoid duplicate UI components.
- Use shadcn/ui components where possible.
- Mobile staff page must be optimized first.
- Cashier page must work on 1366x768 laptop screen.
- Customer display must support fullscreen monitor.
