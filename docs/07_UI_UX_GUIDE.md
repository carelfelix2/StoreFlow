# UI UX Guide

## Design Goal
UI harus modern, clean, cepat, dan mudah dipakai oleh orang tua serta karyawan toko. Jangan terlalu banyak animasi. Fokus utama adalah kecepatan transaksi.

## Visual Direction
- Clean POS modern
- Terang/light mode
- Tombol besar
- Font jelas
- Card-based layout
- Sedikit warna
- Tidak terlalu banyak sidebar
- Tidak banyak modal berlapis

## Color Palette
Primary:
- Emerald / Green

Neutral:
- White
- Gray 50
- Gray 100
- Gray 200
- Gray 900

Status:
- Success: Green
- Warning: Amber
- Danger: Red
- Info: Blue

## Typography
- Gunakan font sans-serif modern
- Rekomendasi: Inter
- Angka total harus besar dan tebal
- Ukuran font untuk kasir minimal 14px
- Ukuran total pembayaran minimal 32px

## Layouts

### 1. Laptop Kasir
Tujuan:
- Cepat melihat order masuk
- Cepat verifikasi
- Cepat pembayaran

Layout:
- Kiri: list order menunggu
- Tengah/kanan: detail order aktif
- Bawah/kanan: tombol payment

Contoh:
```text
+------------------------------------------------+
| Felix Snack POS                 Kasir: Mami    |
+----------------------+-------------------------+
| Order Menunggu       | Detail Order #1045      |
| #1045 Rp250.000      | Chitato x10             |
| #1046 Rp125.000      | Yupi x20                |
| #1047 Rp87.000       | Qtela x5                |
|                      |                         |
|                      | Total: Rp250.000        |
|                      | [Cash] [QRIS]           |
+----------------------+-------------------------+
```

### 2. HP Karyawan
Tujuan:
- Input order secepat mungkin
- Mirip aplikasi food delivery

Layout:
- Search bar di atas
- Category chips horizontal
- Product list card
- Plus/minus qty
- Sticky cart summary di bawah

Contoh:
```text
Cari produk...

[Snack] [Permen] [Wafer] [Minuman]

Chiki Balls
Rp2.000 / pcs
[-] 3 [+]

Yupi
Rp1.000 / pcs
[-] 10 [+]

Total item: 13
[Kirim Pesanan]
```

### 3. Customer Display
Tujuan:
- Customer lihat pesanan dan total
- QRIS tampil besar

Layout:
- Fullscreen
- Tidak ada sidebar
- Tidak ada menu
- Font besar

Contoh:
```text
Felix Snack Store

Chiki Balls    10 x 2.000    20.000
Yupi           20 x 1.000    20.000

TOTAL
Rp40.000

Silakan lakukan pembayaran
```

### 4. QRIS Display
```text
TOTAL PEMBAYARAN
Rp40.000

[QRIS BESAR]

Scan untuk membayar
Menunggu pembayaran...
```

## Components
Gunakan shadcn/ui:
- Button
- Card
- Dialog
- Sheet
- Badge
- Input
- Table
- Tabs
- Dropdown
- Toast
- Alert Dialog

## UX Rules
- Jangan pakai dropdown jika pilihan sedikit. Gunakan button/chips.
- Tombol payment harus besar.
- Tombol batal harus warna danger tapi tidak terlalu dominan.
- Setelah payment sukses, tampilkan toast dan auto print.
- Loading state wajib ada.
- Empty state wajib jelas.
- Error message pakai bahasa manusia.
- Jangan tampilkan technical error ke user toko.

## Important Screens
1. Login
2. Owner Dashboard
3. Cashier Screen
4. Staff Order Screen
5. Product Management
6. Stock Management
7. Reports
8. Customer Display
9. QRIS Payment Screen
10. Receipt Preview
