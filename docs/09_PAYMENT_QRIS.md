# Payment QRIS & Gateway Architecture

## Payment Provider Architecture

StoreFlow uses a **gateway-agnostic payment provider layer** that abstracts all payment gateway integrations behind a single [`PaymentProvider`](frontend/src/server/payments/payment-provider.ts) interface.

### Supported Providers

| Provider | Status | Env Key | Required Variables |
|----------|--------|---------|-------------------|
| **mock** | ✅ Working | `mock` | None (development/testing) |
| **duitku** | 🔧 Placeholder | `duitku` | `DUITKU_MERCHANT_CODE`, `DUITKU_API_KEY` |
| **midtrans** | 🔧 Placeholder | `midtrans` | `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY` |
| **xendit** | 🔧 Placeholder (optional) | `xendit` | `XENDIT_SECRET_KEY` |

### Provider Selection

Provider selection is **explicit** — set `PAYMENT_PROVIDER` in `.env.local`:

```env
# Use mock provider for development
PAYMENT_PROVIDER=mock

# Switch to Duitku later:
# PAYMENT_PROVIDER=duitku
# DUITKU_MERCHANT_CODE=xxx
# DUITKU_API_KEY=xxx

# Switch to Midtrans later:
# PAYMENT_PROVIDER=midtrans
# MIDTRANS_SERVER_KEY=SB-Mid-server-xxx
# MIDTRANS_CLIENT_KEY=SB-Mid-client-xxx

# Switch to Xendit later (optional):
# PAYMENT_PROVIDER=xendit
# XENDIT_SECRET_KEY=xnd_development_xxx
```

**No auto-selection.** The system never auto-selects a provider based on partial env keys.
If `PAYMENT_PROVIDER` is missing, the app returns:
> "PAYMENT_PROVIDER is not set. Please add PAYMENT_PROVIDER=mock (or duitku, midtrans, xendit) to your .env.local file."

If the selected provider requires keys that are not configured, the app returns:
> "Payment provider is not configured."

### PaymentProvider Interface

Every provider implements these methods (see [`payment-provider.ts`](frontend/src/server/payments/payment-provider.ts)):

| Method | Purpose |
|--------|---------|
| `createQrisPayment()` | Create a QRIS payment for an order |
| `checkPaymentStatus()` | Check payment status by gateway reference |
| `verifyCallback()` | Verify webhook signature and extract status |
| `parseCallbackPayload()` | Parse raw callback payload without signature verification |

### How to Switch to a Real Gateway Later

1. **Choose your provider** (e.g., Duitku or Midtrans).
2. **Sign up** for a merchant account on their website.
3. **Get API keys** from their dashboard (sandbox keys first).
4. **Set env variables** in `.env.local` (see table above).
5. **Change `PAYMENT_PROVIDER`** to the provider name.
6. **Implement** the provider's methods in `frontend/src/server/payments/[provider]-provider.ts`.
7. **Test** with sandbox environment first.

### How Mock QRIS Works

The mock provider is a fully working in-memory provider for development:

- Creates mock QRIS payload strings (format: `MOCKQRIS|order_id|order_number|amount|reference|expired_at`)
- Tracks payment status in memory
- Supports `POST /api/payments/[id]/mock-paid` to simulate successful payment
- No external API keys required

---

# Payment QRIS (Original Content)

## Goal
Sistem bisa menerima pembayaran QRIS menggunakan payment gateway Indonesia.

## Recommended Provider
- Midtrans untuk MVP
- Xendit sebagai alternatif

## Payment Flow

1. Kasir approve order.
2. Kasir pilih QRIS.
3. Route Handler `POST /api/orders/[id]/payments/qris` creates payment record (status pending).
4. Server calls Midtrans API to generate QRIS.
5. Midtrans returns QRIS URL / QR string.
6. Frontend menampilkan QRIS (kasir screen + customer display via Pusher).
7. Customer scan QRIS.
8. Midtrans sends webhook to `POST /api/payments/webhook`.
9. Webhook handler validates Midtrans signature.
10. Server updates payment status → paid.
11. Server updates order status → paid.
12. Server mengurangi stok via Prisma (wrapped in transaction).
13. Server emits `payment.paid` via Pusher.
14. Frontend kasir dan customer display berubah otomatis.
15. Printer mencetak struk.

## Payment Status
- pending
- paid
- failed
- expired
- cancelled
- refunded

## Fallback
Jika webhook terlambat, kasir bisa klik:
- Cek Status → calls `GET /api/payments/[id]/status` (polls Midtrans)
- Tandai Sudah Dibayar → `PATCH /api/payments/[id]/manual-paid`

Manual paid hanya boleh dilakukan oleh Owner/Kasir.

## QRIS Expiry
Rekomendasi:
- QRIS expired dalam 10-15 menit

## Security Rules
- Jangan percaya status dari frontend.
- Status paid hanya dari webhook valid atau manual owner/kasir.
- Simpan raw payload webhook di `payment_logs`.
- Validasi amount harus sama dengan `grand_total`.
- Jika amount tidak sama, jangan auto-paid.
- Webhook endpoint (`/api/payments/webhook`) is public — no auth required, but Midtrans signature must be validated.

## UI QRIS
Tampilkan:
- Total pembayaran besar
- QR code besar
- Countdown expired
- Status: Menunggu pembayaran
- Button: Cek Status
- Button: Ganti Metode Pembayaran

## Error Handling
Jika QRIS gagal dibuat:
- Tampilkan pesan jelas
- Kasir bisa pilih Cash
- Jangan hilangkan order

Contoh pesan:
"QRIS gagal dibuat. Coba lagi atau gunakan pembayaran Cash."

## Midtrans Integration (Server-Side)

```typescript
// lib/midtrans.ts

export async function createQRISPayment(params: {
  orderId: string;
  amount: number;
  items: { name: string; price: number; quantity: number }[];
}) {
  const response = await fetch(
    `${MIDTRANS_BASE_URL}/v2/charge`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(serverKey + ":").toString("base64"),
      },
      body: JSON.stringify({
        payment_type: "gopay",
        transaction_details: {
          order_id: params.orderId,
          gross_amount: params.amount,
        },
        item_details: params.items,
        gopay: {
          enable_callback: true,
        },
      }),
    }
  );
  return response.json();
}

export function validateWebhookSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean {
  const expected = crypto
    .createHash("sha512")
    .update(orderId + statusCode + grossAmount + serverKey)
    .digest("hex");
  return expected === signatureKey;
}
```

## Midtrans Environments

| Environment | Base URL |
|-------------|----------|
| Sandbox | `https://api.sandbox.midtrans.com` |
| Production | `https://api.midtrans.com` |

Controlled by `MIDTRANS_IS_PRODUCTION` env variable.
