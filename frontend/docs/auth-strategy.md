# Auth.js v5 — Authentication Strategy

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Browser / Client                       │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Login    │  │ AuthProvider  │  │ AppHeader/        │  │
│  │ Page     │  │ (Session-    │  │ Sidebar           │  │
│  │          │  │  Provider)   │  │ (signOut)         │  │
│  └────┬─────┘  └──────┬───────┘  └───────────────────┘  │
│       │               │                                   │
│  ┌────▼───────────────▼───────────────────────────────┐  │
│  │          next-auth/react (client-side)              │  │
│  │  useSession() │ signIn() │ signOut()               │  │
│  └──────────────────────┬──────────────────────────────┘  │
└─────────────────────────┼──────────────────────────────────┘
                          │ HTTP (cookies)
┌─────────────────────────▼──────────────────────────────────┐
│                    Next.js Server                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Middleware (Edge Runtime)                           │  │
│  │  • Verifies JWT cookie                               │  │
│  │  • Role-based route protection                       │  │
│  │  • Redirects unauthenticated → /login                │  │
│  │  • No Prisma dependency (lazy import only)           │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                   │
│  ┌──────────────────────▼───────────────────────────────┐  │
│  │  auth.ts (Auth.js v5 Config)                        │  │
│  │  • Credentials provider (email + password)           │  │
│  │  • JWT session strategy (30 day expiry)              │  │
│  │  • Custom callbacks: jwt → session (role, id)        │  │
│  │  • Prisma lazy-imported in authorize() only          │  │
│  └──────┬───────────────────────────────────────────────┘  │
│         │                                                   │
│  ┌──────▼───────────────────────────────────────────────┐  │
│  │  API Routes (Node.js Runtime)                       │  │
│  │  • /api/auth/[...nextauth] — Auth.js handler         │  │
│  │  • /api/categories/* — Protected via auth-helpers    │  │
│  │  • auth-helpers.ts uses auth() from @/auth           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## How Login Works

1. **User submits credentials** on `/login` page
2. **`signIn("credentials", { email, password, redirect: false })`** sends POST to `/api/auth/callback/credentials`
3. **Auth.js Credentials provider** calls `authorize(credentials)`:
   - Lazy-imports Prisma client
   - Looks up user by email
   - Checks `is_active` flag (throws error if inactive)
   - Verifies password with bcrypt
   - Returns user object with `id`, `name`, `email`, `role`, `is_active`
4. **Auth.js JWT callback** runs — adds `id`, `role`, `is_active` to the JWT token
5. **Auth.js session callback** runs — maps JWT fields to `session.user`
6. **Response** returns with `set-cookie` header containing the session token (JWT)
7. **Client-side**: `signIn()` resolves, page redirects to role-based default route
8. **AuthProvider** (SessionProvider) detects the session cookie, calls `useSession()`
9. **AuthSync** component syncs session data to Zustand store for UI state

## How Session Verification Works

### Middleware (Edge Runtime)
- `middleware.ts` imports `auth` from `@/auth` and wraps the middleware callback
- The `auth()` function reads the JWT from the `next-auth.session-token` cookie
- It verifies the JWT signature using `AUTH_SECRET`
- It decodes the token and attaches `request.auth` with the session data
- **No database query** — JWT verification is purely cryptographic
- Prisma is NOT loaded in Edge Runtime (lazy import in `authorize()` only)

### API Routes (Node.js Runtime)
- `auth-helpers.ts` calls `auth()` from `@/auth` to get the current session
- `requireAuth()` throws if no session
- `requireRole(roles)` checks `session.user.role` against allowed roles
- These run in Node.js runtime, so Prisma is available if needed

## Role-Based Route Protection

| Route Pattern | Allowed Roles | Unauthenticated |
|---|---|---|
| `/login` | Public | ✅ |
| `/customer-display/*` | Public | ✅ |
| `/api/auth/*` | Public (Auth.js handles) | ✅ |
| `/dashboard` | owner | → /login |
| `/products` | owner, cashier | → /login |
| `/stock` | owner | → /login |
| `/reports` | owner, cashier | → /login |
| `/settings` | owner | → /login |
| `/cashier` | owner, cashier | → /login |
| `/staff/order` | owner, cashier, staff | → /login |
| `/staff/order-success` | owner, cashier, staff | → /login |

## Files Changed/Created

### New Files
| File | Purpose |
|---|---|
| `src/auth.ts` | Auth.js v5 configuration (Credentials provider, JWT, callbacks) |
| `src/middleware.ts` | Edge middleware for route protection |
| `src/types/next-auth.d.ts` | Type augmentation for Auth.js (role, id, is_active) |
| `src/app/api/auth/[...nextauth]/route.ts` | Auth.js catch-all API route handler |

### Modified Files
| File | Changes |
|---|---|
| `prisma/schema.prisma` | Added Account, Session, VerificationToken models; emailVerified on User |
| `src/types/user.ts` | Changed `kasir` → `cashier` to match Prisma enum |
| `src/lib/auth-helpers.ts` | Rewritten to use `auth()` from `@/auth` instead of Bearer token |
| `src/lib/auth.ts` | Wraps `signIn()`/`signOut()` from Auth.js |
| `src/lib/api.ts` | Removed Bearer token interceptor |
| `src/lib/constants.ts` | Changed `kasir` → `cashier` |
| `src/store/auth-store.ts` | Simplified — no token/persist, derives from Auth.js session |
| `src/components/auth/auth-provider.tsx` | Uses SessionProvider, syncs session to Zustand |
| `src/components/layout/app-header.tsx` | Uses `signOut()` from Auth.js |
| `src/components/layout/app-sidebar.tsx` | Changed `kasir` → `cashier` |
| `src/hooks/use-auth.ts` | Uses `useSession()` from Auth.js |
| `src/app/(auth)/login/page.tsx` | Uses `signIn()` from Auth.js |
| `src/app/api/categories/route.ts` | Updated `requireRole()` calls (no request param) |
| `src/app/api/categories/[id]/route.ts` | Updated `requireRole()` calls (no request param) |
| `prisma/seed.ts` | Added `emailVerified: null` to all users |
| `.env.local` | Added `AUTH_SECRET` |

### Deprecated/Removed Files
| File | Status | Replacement |
|---|---|---|
| `src/lib/auth-token.ts` | Deprecated | Auth.js JWT handles token creation/verification |
| `src/app/api/auth/login/route.ts` | Removed | Auth.js `/api/auth/callback/credentials` |
| `src/app/api/auth/me/route.ts` | Removed | Auth.js `/api/auth/session` |
| `src/app/api/auth/logout/route.ts` | Removed | Auth.js sign-out cookie clearing |
| `src/proxy.ts` | Removed | Conflicted with middleware.ts in Next.js 16 |

## Password Reset Strategy (Future Implementation)

### Database Schema
The `VerificationToken` model already exists in the Prisma schema:
```prisma
model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@id([identifier, token])
}
```

### Implementation Plan
1. **Create `/api/auth/forgot-password` route**:
   - Accept email in request body
   - Look up user by email
   - Generate cryptographically secure token (use `crypto.randomUUID()`)
   - Store token in `VerificationToken` with 1-hour expiry
   - Send email with reset link (e.g., `/reset-password?token=xxx`)

2. **Create `/api/auth/reset-password` route**:
   - Accept token + new password
   - Verify token exists in `VerificationToken` and hasn't expired
   - Hash new password with bcrypt
   - Update user's password
   - Delete the used token
   - Return success

3. **Create `/reset-password` page**:
   - Form with new password + confirm password
   - Submit to `/api/auth/reset-password`
   - Show success/error messages

### Security Considerations
- Rate-limit forgot-password requests (e.g., 1 per 60 seconds per email)
- Tokens should be single-use and expire after 1 hour
- Don't reveal whether an email exists in the system (return generic "if account exists, email sent" message)
- Use HTTPS in production

## Email Verification Strategy (Future Implementation)

### Database Schema
The `VerificationToken` model is also used for email verification.

### Implementation Plan
1. **Add `emailVerified` field** — already exists on User model
2. **Create `/api/auth/verify-email` route**:
   - Accept token
   - Verify token in `VerificationToken`
   - Set `user.emailVerified = new Date()`
   - Delete the used token

3. **Send verification email on registration**:
   - When admin creates a user, generate verification token
   - Send email with verification link
   - User must verify before first login (optional, configurable)

4. **UI for unverified users**:
   - Show banner: "Please verify your email"
   - Button to resend verification email

### Security Considerations
- Tokens expire after 24 hours
- Single-use tokens
- Rate-limit resend requests

## Next Recommended Phase

**Phase 2.8: Implement Product CRUD API**
- Build full REST API for products (GET, POST, PUT, DELETE)
- Integrate with Auth.js session for authorization
- Add image upload support
- Add pagination, filtering, search
