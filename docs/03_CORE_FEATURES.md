# Core Features

## MVP V1

### 1. Authentication
- Login
- Logout
- Role-based access
- Session management
- Redirect berdasarkan role

### 2. Product Management
- Tambah produk
- Edit produk
- Hapus/nonaktifkan produk
- Kategori produk
- Harga jual
- Harga modal
- Stok
- Satuan
- Foto produk opsional
- SKU/barcode opsional

### 3. Multi Unit Product
Toko snack sering menjual barang dalam banyak satuan:
- Pcs
- Renteng
- Pack
- Dus
- Karton

Contoh:
Produk: Chiki Balls
- 1 dus = 40 pcs
- Harga pcs = Rp2.000
- Harga dus = Rp70.000

Sistem harus bisa menyimpan konversi satuan.

### 4. Order Input via HP
Dipakai karyawan:
- Cari produk
- Filter kategori
- Tambah qty dengan tombol plus/minus
- Lihat cart
- Input nama buyer opsional
- Submit order ke kasir

### 5. Cashier Approval
Dipakai laptop:
- List order masuk realtime
- Detail order
- Edit qty jika salah
- Hapus item jika salah
- Approve order
- Lanjut ke pembayaran

### 6. Payment
Metode:
- Cash
- QRIS

Cash:
- Input uang diterima
- Hitung kembalian
- Tandai paid

QRIS:
- Generate QRIS dari payment gateway
- Tampilkan QR di layar kasir/customer display
- Cek status payment otomatis
- Tombol manual mark as paid untuk fallback

### 7. Receipt Printing
- Cetak struk setelah pembayaran sukses
- Format thermal 80mm
- Tampilkan:
  - Nama toko
  - Tanggal
  - Nomor transaksi
  - Item
  - Qty
  - Harga
  - Total
  - Metode pembayaran
  - Kasir
  - Ucapan terima kasih

### 8. Stock Movement
Stok otomatis berkurang saat transaksi paid.
Setiap perubahan stok harus masuk ke stock_movements.

Tipe movement:
- Sale
- Stock In
- Adjustment
- Return
- Void

### 9. Daily Report
- Total sales hari ini
- Jumlah transaksi
- Total Cash
- Total QRIS
- Produk terlaris
- Stok menipis
- Laba kotor

## V2
- Customer display fullscreen
- Barcode scanner
- Supplier
- Pembelian stok
- Hutang pelanggan
- Export Excel/PDF
- Multi cashier session
- Void/refund
- Discount

## V3
- Multi outlet
- SaaS tenant system
- Subscription billing
- Offline mode/PWA
- Advanced analytics
