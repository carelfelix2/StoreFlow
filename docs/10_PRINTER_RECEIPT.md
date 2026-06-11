# Printer and Receipt

## Goal
Setelah pembayaran sukses, sistem mencetak struk pembelian.

## MVP Printing
Gunakan browser print:
- Buat halaman receipt printable
- CSS ukuran thermal 80mm
- Kasir klik print atau auto open print dialog

## Advanced Printing
Gunakan:
- ESC/POS thermal printer
- QZ Tray
- Local print service
- node-thermal-printer

## Printer Recommendation
- Thermal printer 80mm
- USB untuk laptop kasir
- Optional LAN/WiFi printer

## Receipt Content
Struk harus menampilkan:
- Nama toko
- Alamat toko
- Nomor transaksi
- Tanggal dan jam
- Nama kasir
- Nama customer jika ada
- List item
- Qty
- Harga
- Subtotal
- Diskon jika ada
- Grand total
- Payment method
- Cash received
- Change amount
- Footer ucapan terima kasih

## Example Receipt

```text
================================
        FELIX SNACK STORE
   Agen Snack, Permen, Jajanan
================================
No: ORD-20260611-0001
Tanggal: 11/06/2026 16:35
Kasir: Mami

--------------------------------
Chiki Balls
10 pcs x 2.000          20.000

Yupi
20 pcs x 1.000          20.000
--------------------------------
TOTAL                   40.000
BAYAR QRIS              40.000
KEMBALI                      0
--------------------------------
Terima kasih
Barang yang sudah dibeli
tidak dapat dikembalikan
================================
```

## Print Rules
- Print hanya setelah payment paid.
- Jika print gagal, order tetap paid.
- Kasir bisa reprint.
- Reprint harus ada label "REPRINT".
- Simpan printed_at.
