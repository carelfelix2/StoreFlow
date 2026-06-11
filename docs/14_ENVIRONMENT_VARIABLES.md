# Environment Variables

## Frontend .env.local

```env
NEXT_PUBLIC_APP_NAME="Felix Snack POS"
NEXT_PUBLIC_API_URL="http://localhost:8000/api"
NEXT_PUBLIC_PUSHER_APP_KEY=""
NEXT_PUBLIC_PUSHER_CLUSTER="ap1"
```

## Backend .env

```env
APP_NAME="Felix Snack POS"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=felix_snack_pos
DB_USERNAME=postgres
DB_PASSWORD=

FRONTEND_URL=http://localhost:3000

MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_IS_SANITIZED=true
MIDTRANS_IS_3DS=true

PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
PUSHER_APP_CLUSTER=ap1
```

## Notes
- Never commit real payment keys.
- Never expose server key to frontend.
- Use sandbox payment gateway first.
