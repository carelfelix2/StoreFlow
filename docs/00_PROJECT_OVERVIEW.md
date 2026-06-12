# Felix Snack POS — Project Overview

## Nama Project
Felix Snack POS

## Tujuan
Membangun aplikasi POS modern untuk toko agen snack milik keluarga. Aplikasi ini digunakan untuk mencatat pesanan, memverifikasi order, menerima pembayaran Cash/QRIS, mencetak struk, mengelola stok barang, dan melihat laporan penjualan.

## Architecture
Full Next.js 15 application:
- **Frontend:** React 19 + App Router + shadcn/ui
- **Backend:** Next.js Route Handlers (`src/app/api/`) + Server Actions
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** Auth.js v5 with credentials provider
- **Realtime:** Pusher
- **Payment:** Midtrans (QRIS)

Single project, single deployment (Vercel), single language (TypeScript) — end-to-end type safety.

## Masalah Saat Ini
Toko masih menggunakan aplikasi kasir pihak ketiga yang tampilannya kurang bagus, kurang fleksibel, dan tidak sesuai dengan workflow toko. Proses order masih kurang rapi karena karyawan mencatat pesanan, lalu kasir harus mengecek manual.

## Solusi
Membangun web app POS multi-device:
- Laptop kasir digunakan oleh owner/kasir untuk verifikasi order, pembayaran, cetak struk, dan laporan.
- 3 HP karyawan digunakan untuk input pesanan buyer.
- 1 monitor customer display untuk menampilkan total belanja dan QRIS.
- Thermal printer untuk mencetak struk.

## Target Pengguna
1. Owner
   - Melihat laporan
   - Mengelola produk dan stok
   - Mengelola user
   - Mengecek transaksi

2. Kasir
   - Menerima order dari karyawan
   - Memverifikasi pesanan
   - Memproses pembayaran
   - Mencetak struk

3. Karyawan
   - Menginput pesanan buyer lewat HP
   - Mengirim order ke kasir
   - Melihat status order

4. Customer
   - Melihat detail belanja di customer display
   - Membayar menggunakan Cash atau QRIS

## Device
- 1 Laptop kasir
- 3 HP karyawan
- 1 Monitor customer display
- 1 Thermal printer 80mm
- Opsional barcode scanner

## Prinsip Utama
- Cepat digunakan saat toko ramai
- UI simple dan modern
- Tombol besar
- Tidak terlalu banyak halaman
- Realtime antar-device
- Bisa digunakan dari browser
- Bisa dikembangkan menjadi SaaS POS
