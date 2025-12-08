# DFD - Toco Clone Professional

Dokumen ini menggambarkan Data Flow Diagram (DFD) untuk sistem marketplace Toco Clone Professional, termasuk modul admin (MVP) yang ditambahkan di atas schema dan API yang sudah ada.

---

## Level 0 - Context Diagram

**External entity utama**

- Pelanggan (Customer)
- Penjual (Seller)
- Admin
- Payment Gateway
- Layanan Pengiriman atau RajaOngkir

**Proses utama**

- 0 Sistem Toco Clone

**Data store global (implisit di level 0)**

- D1 Basis data aplikasi `toco_clone`

**Ringkasan aliran data level 0**

- Pelanggan → Sistem Toco Clone
  - Data registrasi dan login
  - Permintaan katalog produk dan detail produk
  - Data pengelolaan alamat
  - Data pengelolaan keranjang belanja
  - Permintaan checkout dan pembayaran
  - Permintaan riwayat dan detail pesanan
- Sistem Toco Clone → Pelanggan

  - Konfirmasi registrasi dan login
  - Daftar dan detail produk
  - Ringkasan keranjang dan estimasi ongkir
  - Ringkasan checkout, status pembayaran, status pesanan dan pengiriman

- Penjual → Sistem Toco Clone
  - Data registrasi seller dan pembuatan toko
  - Data pengaturan toko, profil, kurir, dan template balasan
  - Data produk dan variasi produk
  - Aksi pemrosesan pesanan (konfirmasi, pengiriman, dsb)
- Sistem Toco Clone → Penjual

  - Status verifikasi toko
  - Daftar pesanan toko dan detailnya
  - Notifikasi perubahan status pesanan

- Admin ↔ Sistem Toco Clone

  - Login admin dan otorisasi
  - Manajemen user dan seller
  - Manajemen kategori, produk, voucher global, dan konfigurasi sistem
  - Monitoring pesanan, pembayaran, dan performa
  - Akses ke audit log

- Sistem Toco Clone ↔ Payment Gateway

  - Request pembuatan transaksi pembayaran
  - Redirect atau token pembayaran
  - Notifikasi status pembayaran (callback atau webhook)

- Sistem Toco Clone ↔ Layanan Pengiriman
  - Permintaan tarif ongkir dan estimasi waktu pengiriman
  - Permintaan tracking resi
  - Response tarif, estimasi, dan status tracking

Representasi sederhana level 0:

- Pelanggan, Penjual, Admin, Payment Gateway, Layanan Pengiriman ↔ (0) Sistem Toco Clone ↔ D1 Basis data aplikasi

---

## Level 1 - Dekomposisi Proses 0 Sistem Toco Clone

Pada level ini, proses 0 dipecah menjadi beberapa proses utama:

**Proses level 1**

- 1.0 Manajemen User dan Auth
- 2.0 Manajemen Seller dan Toko
- 3.0 Manajemen Katalog Produk
- 4.0 Cart dan Checkout
- 5.0 Order dan Pengiriman
- 6.0 Pembayaran
- 7.0 Voucher dan Promosi
- 8.0 Admin dan Monitoring

**Data store utama (tabel atau grup tabel)**

- D1 Users
  - Tabel: `users`, `user_addresses`
- D2 Stores
  - Tabel: `stores`, `store_about_pages`, `reply_templates`, `store_courier_settings`
- D3 Produk
  - Tabel: `categories`, `products`, `product_images`, `product_variant_attributes`, `product_variant_attribute_options`, `product_skus`, `product_sku_options`, `product_promotions`
- D4 Cart
  - Tabel: `carts`, `cart_items`, `cart_shipping_selections`, `cart_vouchers`
- D5 Order dan Pengiriman
  - Tabel: `orders`, `order_items`, `order_shipments`, `order_status_logs`
- D6 Pembayaran
  - Tabel: `payments`, `payment_notifications`
    -- D7 Voucher
  - Tabel: `vouchers`, `voucher_products`, `voucher_usages`
- D8 Admin Audit
  - Tabel: `admin_audit_logs` (log aktivitas admin)

### 1.0 Manajemen User dan Auth

**Aktor**: Pelanggan, Seller, Admin

**Aliran data utama**

- Pelanggan atau seller → 1.0
  - Data registrasi, login, verifikasi email, pengelolaan profil, pengelolaan alamat
- 1.0 → D1 Users
  - Simpan dan baca data user dan alamat
- 1.0 → Pelanggan atau seller
  - Konfirmasi registrasi, token auth, profil dan daftar alamat

### 2.0 Manajemen Seller dan Toko

**Aktor**: Seller

**Aliran data utama**

- Seller → 2.0
  - Permintaan registrasi seller dan pembuatan toko
  - Permintaan update profil toko, halaman about, pengaturan kurir dan template
- 2.0 → D2 Stores dan D1 Users
  - Simpan relasi user ke store, profil toko, about, template, pengaturan kurir
- 2.0 → Seller
  - Status pendaftaran dan verifikasi toko, detail toko dan pengaturannya

### 3.0 Manajemen Katalog Produk

**Aktor**: Seller, Pelanggan

**Aliran data utama**

- Seller → 3.0
  - Data pembuatan dan update kategori, produk, variasi, SKU, promosi
- Pelanggan → 3.0
  - Permintaan pencarian dan filter produk
- 3.0 → D3 Produk dan D2 Stores
  - Simpan dan baca data kategori, produk, gambar, variasi, SKU, promosi
- 3.0 → Pelanggan dan Seller
  - Daftar produk, detail produk, status produk

### 4.0 Cart dan Checkout

**Aktor**: Pelanggan

**Aliran data utama**

- Pelanggan → 4.0
  - Tambah dan ubah item cart
  - Pilih alamat pengiriman
  - Pilih layanan pengiriman
  - Terapkan voucher
  - Request ringkasan checkout
- 4.0 → D4 Cart, D3 Produk, D7 Voucher, D1 Users
  - Simpan dan baca isi cart, validasi stok dan harga, validasi voucher, data alamat
- 4.0 → Layanan Pengiriman
  - Permintaan kalkulasi ongkir
- 4.0 → Pelanggan
  - Ringkasan cart, ongkir, diskon voucher, dan total yang akan dibayar

### 5.0 Order dan Pengiriman

**Aktor**: Pelanggan, Seller, Admin

**Aliran data utama**

- 4.0 Cart dan Checkout → 5.0
  - Permintaan pembuatan order per toko dari cart
- 5.0 → D5 Order dan Pengiriman, D3 Produk, D1 Users
  - Pembuatan header dan item order, update stok, catat alamat pengiriman, log status
- Seller → 5.0
  - Aksi update status pesanan dan update nomor resi
- 5.0 → Pelanggan dan Seller
  - Informasi detail order, status order, nomor resi dan tracking singkat

### 6.0 Pembayaran

**Aktor**: Pelanggan, Payment Gateway

**Aliran data utama**

- Pelanggan → 6.0
  - Permintaan inisiasi pembayaran untuk order tertentu
- 6.0 → Payment Gateway
  - Data order dan total pembayaran untuk dibuatkan transaksi
- Payment Gateway → 6.0
  - Token, redirect, dan notifikasi status pembayaran
- 6.0 → D6 Pembayaran dan D5 Order dan Pengiriman
  - Simpan detail transaksi pembayaran dan update status pembayaran pada order
- 6.0 → Pelanggan
  - Informasi status pembayaran dan instruksi lanjutan bila ada

### 7.0 Voucher dan Promosi

**Aktor**: Seller, Pelanggan, Admin

**Aliran data utama**

- Seller atau admin → 7.0
  - Data pembuatan dan pengelolaan voucher dan promosi produk
- Pelanggan → 7.0
  - Permintaan validasi dan aplikasi voucher
- 7.0 → D7 Voucher dan D3 Produk
  - Simpan data master voucher, produk yang terikat, dan log pemakaian
- 7.0 → 4.0 Cart dan Checkout
  - Nilai diskon yang valid dan informasi voucher yang dapat diterapkan

### 8.0 Admin dan Monitoring

**Aktor**: Admin

**Aliran data utama**

- Admin → 8.0
  - Login admin dan otorisasi (berdasarkan `users.role = 'admin'`)
  - Manajemen user, seller, toko, dan konten penting melalui endpoint yang sama dengan user/seller, tetapi dengan hak akses admin
  - Monitoring order, pembayaran, dan voucher
  - Aksi operasional lain yang berdampak pada data (misalnya suspend toko, nonaktifkan produk)
- 8.0 → D1 Users, D2 Stores, D3 Produk, D5 Order dan Pengiriman, D6 Pembayaran, D7 Voucher, D8 Admin Audit
  - Baca dan update data operasional untuk keperluan admin
  - Simpan catatan aktivitas admin ke `admin_audit_logs`
- 8.0 → Admin
  - Laporan, dashboard, dan riwayat audit aktivitas admin

---

## Level 2 - Contoh Dekomposisi Detail

Level 2 difokuskan pada dua proses kunci: 4.0 Cart dan Checkout dan 8.0 Admin dan Monitoring.

### Level 2 untuk 4.0 Cart dan Checkout

**Sub proses**

- 4.1 Kelola isi cart
- 4.2 Hitung ongkir dan diskon voucher
- 4.3 Konfirmasi checkout dan buat order

**4.1 Kelola isi cart**

- Pelanggan → 4.1
  - Tambah produk ke cart, ubah jumlah, hapus item, pilih atau batal pilih item
- 4.1 → D4 Cart dan D3 Produk
  - Validasi produk dan stok, simpan item cart
- 4.1 → Pelanggan
  - Ringkasan isi cart terbaru

**4.2 Hitung ongkir dan diskon voucher**

- Pelanggan → 4.2
  - Pilihan alamat pengiriman dan jasa pengiriman
  - Kode voucher yang ingin digunakan
- 4.2 → Layanan Pengiriman
  - Permintaan tarif berdasarkan asal, tujuan, dan berat
- 4.2 → D4 Cart, D7 Voucher, D3 Produk
  - Baca berat total, nilai produk, dan definisi voucher untuk validasi
- 4.2 → Pelanggan
  - Nilai ongkir, diskon valid, dan estimasi total pembayaran

**4.3 Konfirmasi checkout dan buat order**

- Pelanggan → 4.3
  - Konfirmasi checkout untuk item yang dipilih
- 4.3 → D4 Cart, D5 Order dan Pengiriman, D3 Produk
  - Generate order header dan item per toko
  - Catat alamat pengiriman dan biaya ongkir
  - Update stok produk dan atau SKU
- 4.3 → 6.0 Pembayaran
  - Kirim informasi order dan nominal untuk diinisiasi pembayaran
- 4.3 → Pelanggan
  - Informasi nomor order dan ringkasan checkout

### Level 2 untuk 8.0 Admin dan Monitoring

**Sub proses**

- 8.1 Manajemen user dan seller oleh admin
- 8.2 Monitoring order, pembayaran, dan voucher oleh admin
- 8.3 Pencatatan dan penelusuran audit log admin

**8.1 Manajemen user dan seller oleh admin**

- Admin → 8.1
  - Pencarian dan filter user dan seller
  - Aksi aktivasi atau suspend user dan atau toko
- 8.1 → D1 Users, D2 Stores
  - Baca atau update status user dan toko
- 8.1 → D8 Admin Audit
  - Simpan catatan aksi admin yang berdampak pada user atau seller
- 8.1 → Admin
  - Hasil aksi admin dan status terkini user dan seller

**8.2 Monitoring order, pembayaran, dan voucher oleh admin**

- Admin → 8.2
  - Permintaan laporan dan daftar order berdasarkan filter
  - Permintaan melihat detail pembayaran dan penggunaan voucher
- 8.2 → D5 Order dan Pengiriman, D6 Pembayaran, D7 Voucher
  - Baca data header order, item, shipment, log status, pembayaran, dan voucher
- 8.2 → D8 Admin Audit
  - Simpan catatan ketika admin melakukan aksi korektif (misalnya intervensi status order)
- 8.2 → Admin
  - Laporan dan detail order, pembayaran, dan voucher untuk kebutuhan operasional dan audit

**8.3 Pencatatan dan penelusuran audit log admin**

- Proses 8.1, 8.2, dan modul lain → 8.3
  - Mengirim event aktivitas admin yang penting untuk dicatat
- 8.3 → D8 Admin Audit
  - Menyimpan catatan aksi admin (siapa, apa, kapan, terhadap entitas apa)
- Admin → 8.3
  - Permintaan melihat riwayat audit untuk investigasi atau review
- 8.3 → Admin
  - Data audit log yang sudah difilter sesuai kebutuhan

Dengan tiga level DFD ini, alur utama sistem marketplace dan peran modul admin dalam mengelola serta mengawasi sistem telah terpetakan secara jelas.
