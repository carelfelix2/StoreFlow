# Roles and Permissions

## Roles

### Owner
Akses penuh:
- Dashboard
- Produk
- Stok
- Order
- Payment
- Laporan
- User management
- Setting toko
- Riwayat transaksi
- Void/refund transaksi
- Export laporan

### Kasir
Akses:
- Dashboard kasir
- Menerima order
- Verifikasi order
- Edit order sebelum pembayaran
- Proses pembayaran Cash/QRIS
- Cetak struk
- Lihat transaksi hari ini

Tidak boleh:
- Menghapus produk
- Mengubah harga modal
- Mengubah role user
- Menghapus transaksi permanen

### Karyawan
Akses:
- Input order dari HP
- Cari produk
- Tambah qty produk
- Submit order
- Lihat status order sendiri

Tidak boleh:
- Mengubah harga
- Mengubah stok
- Memproses pembayaran
- Melihat laporan penjualan
- Menghapus transaksi

### Customer Display
Akses khusus fullscreen:
- Melihat item belanja
- Melihat total
- Melihat QRIS
- Melihat status pembayaran

Tidak ada login manual. Diakses dari URL khusus atau token device.

## Permission Matrix

| Fitur | Owner | Kasir | Karyawan | Customer Display |
|---|---|---|---|---|
| Dashboard | Yes | Limited | No | No |
| Input Order | Yes | Yes | Yes | No |
| Verifikasi Order | Yes | Yes | No | No |
| Payment | Yes | Yes | No | View Only |
| Produk | Yes | View Only | View Only | No |
| Stok | Yes | View Only | No | No |
| Laporan | Yes | Limited | No | No |
| User Management | Yes | No | No | No |
| Cetak Struk | Yes | Yes | No | No |
| Customer Display | Yes | Yes | No | Yes |
