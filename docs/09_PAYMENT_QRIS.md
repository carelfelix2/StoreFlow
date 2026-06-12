# Payment QRIS

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
