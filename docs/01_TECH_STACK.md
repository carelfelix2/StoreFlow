# Tech Stack

## Full Stack (Next.js Monolith)

- **Next.js 15** — App Router for both frontend pages and backend API
- **TypeScript** — Strict mode throughout
- **Tailwind CSS** — Utility-first CSS with v4
- **shadcn/ui** — Headless UI primitives via `@base-ui/react`
- **Lucide React** — Icon library

## Backend (within Next.js)

- **Next.js Route Handlers** — REST API endpoints under `src/app/api/`
- **Server Actions** — For form mutations where appropriate (product create/edit, settings)
- **Prisma ORM** — Type-safe database access, migrations, and seeding
- **PostgreSQL** — Primary database
- **Auth.js / NextAuth v5** — Authentication with credentials provider + role support
- **Zod** — Request validation for both Route Handlers and Server Actions

## Frontend

- **React 19** — with Server Components by default
- **React Hook Form** — Form state management for client components
- **Zustand** — Local UI state (cart, sidebar, active order)
- **TanStack Query** — Server-state management, caching, mutations
- **TanStack Table** — Data tables with sorting and pagination

## Realtime

- **Pusher** — Managed WebSocket for MVP (zero-config)
- **Socket.io** — Alternative self-hosted option for production

## Payment Gateway

- **Midtrans** — QRIS and payment processing
  - Sandbox for development
  - Production for live

## Printer

- **Thermal printer 80mm**
- **ESC/POS** protocol
- **MVP:** Browser `window.print()` with thermal CSS
- **Production:** QZ Tray or local print service

## Deployment

- **Vercel** — Frontend + API Routes (serverless/edge)
- **PostgreSQL:** Supabase, Neon, or Railway
- **Pusher** — Managed realtime service

## Design System

- Primary color: Emerald/Green
- Background: White / Gray 50
- Text: Gray 900
- Success: Green
- Warning: Amber
- Danger: Red
- Info: Blue

## UI Direction

Not a heavy admin panel. UI should be like modern POS:
- Square POS
- Shopify POS
- Kasir Pintar (cleaner version)
- GoFood style for staff order input on mobile

## Why Full Next.js (No Separate Laravel Backend)?

| Factor | Decision |
|--------|----------|
| **Simplicity** | Single project, single deployment, single language (TypeScript) |
| **Type Safety** | End-to-end types from database (Prisma) to frontend (React) |
| **Deployment** | Vercel handles both frontend and API routes seamlessly |
| **Auth** | Auth.js v5 is Next.js-native, simpler than cross-domain Sanctum tokens |
| **Cost** | No separate VPS needed for API server during MVP |
| **Team** | Single TypeScript codebase — easier for one developer |
| **Realtime** | Pusher SDK works from both Route Handlers (server) and React (client) |
