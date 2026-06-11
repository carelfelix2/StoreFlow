# Order Workflow

## Normal Flow

1. Customer datang ke toko.
2. Karyawan mengambil pesanan menggunakan HP.
3. Karyawan membuka halaman Order.
4. Karyawan mencari produk.
5. Karyawan menambahkan item ke cart.
6. Karyawan submit order.
7. Order masuk realtime ke laptop kasir.
8. Kasir/bokap/mami mengecek order.
9. Jika ada salah, kasir edit qty/item.
10. Jika sudah benar, kasir approve order.
11. Kasir memilih metode pembayaran:
    - Cash
    - QRIS
12. Jika Cash:
    - Kasir input uang diterima
    - Sistem menghitung kembalian
    - Transaksi menjadi paid
13. Jika QRIS:
    - Sistem generate QRIS
    - QRIS tampil di kasir dan customer display
    - Customer scan dan bayar
    - Sistem menerima callback/webhook
    - Transaksi menjadi paid
14. Sistem mencetak struk.
15. Stok produk berkurang otomatis.
16. Order selesai.

## Order Status

### draft
Order masih di cart karyawan, belum dikirim.

### submitted
Order sudah dikirim ke kasir, menunggu verifikasi.

### reviewing
Kasir sedang membuka/mengecek order.

### approved
Order sudah disetujui, siap dibayar.

### waiting_payment
Order menunggu pembayaran.

### paid
Pembayaran berhasil.

### printed
Struk sudah dicetak.

### completed
Order selesai.

### cancelled
Order dibatalkan sebelum pembayaran.

### voided
Transaksi dibatalkan setelah paid, hanya owner yang boleh.

## Status Flow

draft -> submitted -> reviewing -> approved -> waiting_payment -> paid -> printed -> completed

Cancel:
draft/submitted/reviewing/approved -> cancelled

Void:
paid/completed -> voided

## Important Rules
- Stok hanya berkurang setelah order status paid.
- Order submitted tidak boleh diedit oleh karyawan, hanya kasir.
- Order paid tidak boleh diedit, kecuali void/refund.
- Setiap perubahan status harus dicatat di order_logs.
