# Payment QRIS

## Goal
Sistem bisa menerima pembayaran QRIS menggunakan payment gateway Indonesia.

## Recommended Provider
- Midtrans untuk MVP
- Xendit sebagai alternatif

## Payment Flow

1. Kasir approve order.
2. Kasir pilih QRIS.
3. Backend membuat payment record status pending.
4. Backend request QRIS ke payment gateway.
5. Gateway mengembalikan QRIS URL / QR string.
6. Frontend menampilkan QRIS.
7. Customer scan QRIS.
8. Gateway mengirim webhook ke backend.
9. Backend validasi signature.
10. Backend update payment status paid.
11. Backend update order status paid.
12. Backend mengurangi stok.
13. Backend emit realtime event payment.paid.
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
- Cek Status
- Tandai Sudah Dibayar

Manual paid hanya boleh dilakukan oleh Owner/Kasir.

## QRIS Expiry
Rekomendasi:
- QRIS expired dalam 10-15 menit

## Security Rules
- Jangan percaya status dari frontend.
- Status paid hanya dari webhook valid atau manual owner/kasir.
- Simpan raw payload webhook di payment_logs.
- Validasi amount harus sama dengan grand_total.
- Jika amount tidak sama, jangan auto-paid.

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
