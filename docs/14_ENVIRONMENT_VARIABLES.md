# Environment Variables

## Quick Reference

```env
# === Payment Gateway ===
# REQUIRED — explicitly choose provider
PAYMENT_PROVIDER=mock

# Mock provider (PAYMENT_PROVIDER=mock)
# No external keys needed.

# Duitku provider (PAYMENT_PROVIDER=duitku)
# DUITKU_MERCHANT_CODE=
# DUITKU_API_KEY=

# Midtrans provider (PAYMENT_PROVIDER=midtrans)
# MIDTRANS_SERVER_KEY=SB-Mid-server-xxx
# MIDTRANS_CLIENT_KEY=SB-Mid-client-xxx

# Xendit provider (PAYMENT_PROVIDER=xendit) — optional
# XENDIT_SECRET_KEY=xnd_development_xxx
```

## Payment Provider Configuration

### PAYMENT_PROVIDER (Required)

Explicitly selects the payment gateway. Must be one of: `mock`, `duitku`, `midtrans`, `xendit`.

```env
PAYMENT_PROVIDER=mock
```

If not set, the app will fail with a clear error message:

> `PAYMENT_PROVIDER is not set. Please add PAYMENT_PROVIDER=mock (or duitku, midtrans, xendit) to your .env.local file.`

### Per-Provider Required Variables

| Provider | Variable | Required? | Description |
|----------|----------|-----------|-------------|
| **mock** | *(none)* | — | No external keys required |
| **duitku** | `DUITKU_MERCHANT_CODE` | ✅ | Duitku merchant code from dashboard |
| | `DUITKU_API_KEY` | ✅ | Duitku API key from dashboard |
| **midtrans** | `MIDTRANS_SERVER_KEY` | ✅ | Midtrans server key (starts with `SB-Mid-server-` for sandbox) |
| | `MIDTRANS_CLIENT_KEY` | ✅ | Midtrans client key (starts with `SB-Mid-client-` for sandbox) |
| **xendit** | `XENDIT_SECRET_KEY` | ✅ | Xendit secret key (starts with `xnd_development_` for sandbox) |

If required variables are missing, the app returns:
> `Payment provider "xxx" requires the following environment variables: ... Please set them in .env.local or switch to a different provider via PAYMENT_PROVIDER.`

---

# Original Content

## Frontend .env.local

```env
# App
NEXT_PUBLIC_APP_NAME="Felix Snack POS"

# Database (Prisma)
DATABASE_URL="postgresql://postgres:password@localhost:5432/felix_snack_pos"

# Auth.js v5
AUTH_SECRET="generate-with-npx-auth-secret"
AUTH_URL="http://localhost:3000"

# Midtrans (Payment Gateway)
MIDTRANS_SERVER_KEY="SB-Mid-server-xxx"
MIDTRANS_CLIENT_KEY="SB-Mid-client-xxx"
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="SB-Mid-client-xxx"
MIDTRANS_IS_PRODUCTION=false

# Pusher (Realtime)
PUSHER_APP_ID=""
PUSHER_APP_KEY=""
PUSHER_APP_SECRET=""
PUSHER_HOST=""
PUSHER_PORT=443
PUSHER_SCHEME=https
PUSHER_APP_CLUSTER="ap1"
NEXT_PUBLIC_PUSHER_APP_KEY=""
NEXT_PUBLIC_PUSHER_CLUSTER="ap1"

# Printer
PRINTER_TYPE="browser"
```

## Notes
- Never commit real payment keys.
- Never expose `MIDTRANS_SERVER_KEY`, `AUTH_SECRET`, or `PUSHER_APP_SECRET` to the client.
- Prefix public env vars with `NEXT_PUBLIC_` so they are available in the browser.
- Use `npx auth secret` to generate `AUTH_SECRET`.
- Use Midtrans sandbox keys during development.
- `DATABASE_URL` format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`
