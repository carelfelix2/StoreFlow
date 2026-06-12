# Environment Variables

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
