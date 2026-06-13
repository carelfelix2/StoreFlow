# Responsive UI — QA Checklist

## Pages Tested

| Page | Route | Status |
|------|-------|--------|
| Login | `/login` | ✅ Pass |
| Dashboard | `/dashboard` | ✅ Pass |
| Products | `/products` | ✅ Pass |
| Stock | `/stock` | ✅ Pass |
| Reports | `/reports` | ✅ Pass |
| Settings | `/settings` | ✅ Pass |
| Cashier | `/cashier` | ✅ Pass |
| Staff Order | `/staff/order` | ✅ Pass |
| Staff Order Success | `/staff/order-success` | ✅ Pass |
| Customer Display | `/customer-display/[deviceId]` | ✅ Pass |

## Breakpoints Tested

| Breakpoint | Device Target | Status |
|------------|--------------|--------|
| 360px | Small phone (iPhone SE) | ✅ Pass |
| 390px | Phone (iPhone 14/15) | ✅ Pass |
| 430px | Large phone (iPhone Pro Max) | ✅ Pass |
| 768px | Tablet portrait (iPad) | ✅ Pass |
| 1024px | Tablet landscape / small laptop | ✅ Pass |
| 1366px | Laptop (common resolution) | ✅ Pass |
| 1920px | Desktop | ✅ Pass |

## How to Test in Chrome DevTools

1. Open the page in Chrome.
2. Press `F12` to open DevTools.
3. Click the **Toggle Device Toolbar** icon (📱) or press `Ctrl+Shift+M`.
4. At the top of the viewport, select a device preset or enter a custom width/height.
5. Use the **Responsive** mode and drag the handles to test all breakpoints above.
6. Check for:
   - Horizontal scrollbars on the page (there should be none).
   - Content overlapping or clipping.
   - Buttons that are too small to tap comfortably.
   - Text that overflows its container.
   - Tables that are unreadable or force page-level overflow.
   - Dialogs/sheets that are too wide for the viewport.

## Known Limitations

1. **Cashier page** at 1366×768 — The order list area is intentionally scrollable. With many order status tabs active, the header takes more vertical space, but all critical actions remain reachable via scroll. The order detail sheet uses `sm:max-w-lg` which fits within 768px height.

2. **Products table** — At 360-430px widths, the table scrolls horizontally (expected behavior). The `Table` component wraps in `overflow-x-auto` so page-level overflow is prevented. Column count (11 cols) makes horizontal scroll unavoidable on phones — this is acceptable since products management is primarily a desktop task.

3. **Stock table** — Same as Products. Horizontal scroll on mobile, no page-level overflow.

4. **Reports tabs** — At very narrow widths (360px), the 5 report tabs may require horizontal scrolling within the tab bar. The tabs component is wrapped with `overflow-x-auto` to handle this.

5. **Staff order page** — The bottom cart bar at `bottom-14` sits above the mobile bottom nav. At 360px, product cards in the 2-column grid are compact but usable. The cart sheet uses `w-full sm:max-w-md` so it fills the full screen width on small phones.

6. **Customer display** — This page is designed for a second monitor (typically 1024×768 or larger). It is not optimized for phone-sized screens since it's meant for customer-facing displays. It will still render correctly but elements will be scaled proportionally.

## Responsive Patterns Used

- `min-w-0` — Prevents flex children from overflowing, allows truncation to work.
- `max-w-full` — Prevents elements from exceeding their container.
- `overflow-x-auto` — Enables horizontal scroll for tables and tab bars without page-level overflow.
- `flex-wrap` — Allows filter bars and button groups to wrap on narrow screens.
- `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` — Responsive grid columns for KPI cards and product grids.
- `hidden md:block` / `md:hidden` — Show/hide elements at breakpoints for mobile alternatives.
- `text-xs sm:text-sm md:text-base` — Responsive text sizing.
- `p-3 sm:p-4 md:p-6` — Responsive padding.
- `w-full sm:max-w-md` — Full-width sheets on mobile, constrained on desktop.
- `sticky top-0 z-10` — Sticky search bars with proper z-index stacking.

## Checklist for Each Page

### Login
- [x] Card centered and fits within viewport width
- [x] No horizontal overflow
- [x] Form inputs full width
- [x] Button fully visible and tappable

### Dashboard
- [x] KPI cards stack gracefully (1 col mobile, 2 col tablet, 6 col on large desktop for Ringkasan tab)
- [x] Chart widgets don't overflow
- [x] Widgets stack vertically on mobile
- [x] Text doesn't get cut off

### Products
- [x] Table scrolls horizontally, no page-level overflow
- [x] Filter bar wraps on mobile
- [x] Action dropdowns remain accessible (don't go off-screen)
- [x] Dialog content fits viewport

### Stock
- [x] Table scrolls horizontally, no page-level overflow
- [x] Alert banner wraps text
- [x] Search bar constrained to max width
- [x] Pagination controls visible

### Reports
- [x] Tab bar scrolls horizontally on mobile
- [x] KPI cards grid responsive (1→2→3→6 columns)
- [x] Tables scroll horizontally within tab content
- [x] Export buttons don't break layout
- [x] Date filter bar wraps cleanly

### Settings
- [x] Tab bar scrolls horizontally on mobile
- [x] Forms single-column on mobile
- [x] User table scrolls horizontally
- [x] Backup/export buttons wrap

### Cashier
- [x] Optimized for 1366×768 laptop
- [x] Order cards do not overflow
- [x] Status tabs scroll horizontally
- [x] Search bar full width on mobile
- [x] Detail sheet fits mobile/desktop
- [x] Payment dialogs fit viewport
- [x] Customer display controls wrap on small screens

### Staff Order
- [x] Product grid fits 360px (2 columns)
- [x] Sticky search/header does not overlap content
- [x] Cart bottom bar does not overlap mobile nav
- [x] Touch buttons minimum comfortable size (≥ 32px)
- [x] Cart sheet fits mobile height
- [x] Category chips scroll horizontally

### Staff Order Success
- [x] Content fits within viewport
- [x] No horizontal overflow
- [x] Action buttons clearly visible

### Customer Display
- [x] Fullscreen scaling works
- [x] Text sizes are readable on large displays
- [x] No layout breakage at different window sizes
