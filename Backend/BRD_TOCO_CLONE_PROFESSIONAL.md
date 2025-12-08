# Business Requirements Document (BRD) - Toco Clone Professional

Dokumen ini merangkum kebutuhan bisnis untuk sistem marketplace **Toco Clone Professional**, berdasarkan:

- Schema database `toco_clone_professional.sql`
- Modul admin (MVP) di `ADMIN_DB_SCHEMA.sql`
- Alur data pada `DFD_TOCO_CLONE_PROFESSIONAL.md`

---

## 1. Latar Belakang

Toco Clone Professional adalah platform marketplace multi-seller yang meniru pola kerja dasar Blibli, tetapi dengan lingkup yang lebih sempit agar lebih mudah dipahami dan dikembangkan. Fokusnya adalah alur belanja yang realistis: pengguna daftar, melihat katalog, memasukkan produk ke keranjang, melakukan pembayaran, hingga pesanan diproses oleh seller.

Di sisi backend, sistem didesain supaya struktur datanya rapi dan konsisten. Tabel-tabel yang sudah ada mendukung:

- Multi user (customer, seller, admin)
- Multi toko (stores)
- Manajemen produk lengkap (kategori, variasi, SKU, promosi)
- Keranjang belanja dan checkout per toko
- Integrasi pembayaran via payment gateway
- Penghitungan ongkos kirim dan tracking
- Sistem voucher dan promosi

Modul admin (MVP) ditambahkan supaya tim internal bisa mengelola data dan memantau aktivitas sistem, dengan jejak audit yang cukup ketika perlu mengecek kembali apa yang pernah dilakukan admin.

---

## 2. Tujuan Sistem

Secara singkat, sistem ini dibuat untuk:

- Menyediakan platform bagi pelanggan untuk mencari, membandingkan, dan membeli produk secara aman.
- Memungkinkan seller mengelola toko, produk, promo, dan pesanan dengan alur yang jelas.
- Memberikan tampilan dan API admin untuk memonitor dan mengendalikan aktivitas sistem.
- Menjaga integritas data dan rekam jejak transaksi sehingga mudah ditelusuri ketika terjadi masalah atau saat dibutuhkan analisis sederhana.

---

## 3. Ruang Lingkup

### 3.1 Dalam Lingkup

- **User & Auth**
  - Registrasi, login, verifikasi email, dan pengelolaan profil.
  - Manajemen alamat pengiriman.
- **Seller & Toko**
  - Registrasi seller, pembuatan dan pengelolaan toko.
  - Pengaturan kurir dan halaman about.
  - Template balasan pelanggan.
- **Katalog Produk**
  - Manajemen kategori produk.
  - Manajemen produk, variasi, SKU, gambar, dan promosi.
- **Cart & Checkout**
  - Keranjang per user.
  - Perhitungan subtotal, ongkir, dan diskon voucher.
  - Checkout multi-toko menjadi beberapa order.
- **Order & Pengiriman**
  - Siklus hidup pesanan (pending → paid → processing → shipped → delivered / cancelled / returned).
  - Penyimpanan informasi shipment dan tracking dasar.
- **Pembayaran**
  - Inisiasi transaksi ke payment gateway.
  - Penerimaan notifikasi (webhook) dan update status pembayaran.
- **Voucher & Promosi**
  - Manajemen voucher (global dan per toko).
  - Pengikatan voucher ke produk tertentu.
  - Pencatatan penggunaan voucher.
- **Admin (MVP)**
  - Admin ditandai dengan `users.role = 'admin'`.
  - Admin dapat mengakses fitur manajemen data (user, seller, toko, produk, order, pembayaran, voucher) melalui endpoint backend yang sudah ada.
  - Pencatatan aktivitas admin dalam tabel `admin_audit_logs`.

### 3.2 Di Luar Lingkup

- Rekomendasi produk berbasis machine learning.
- Sistem poin loyalty dan membership tingkat lanjut.
- Chat real-time dan sistem tiket CS penuh.
- Manajemen gudang multi-lokasi.

---

## 4. Aktor dan Stakeholder

- **Pelanggan (Customer)**
  - Mendaftar, login, mengelola profil & alamat, berbelanja, dan melihat riwayat pesanan.
- **Seller**
  - Mendaftar sebagai seller, mengelola toko, produk, dan pesanan toko.
- **Admin**
  - Mengelola data dan memonitor kesehatan operasional sistem.
- **Payment Gateway**
  - Menangani transaksi pembayaran dan mengirim notifikasi status.
- **Layanan Pengiriman / RajaOngkir**
  - Menyediakan tarif dan estimasi ongkir serta tracking.

---

## 5. Ringkasan Proses Bisnis (DFD)

Mengacu pada `DFD_TOCO_CLONE_PROFESSIONAL.md`, proses utama level 1:

- 1.0 Manajemen User dan Auth
- 2.0 Manajemen Seller dan Toko
- 3.0 Manajemen Katalog Produk
- 4.0 Cart dan Checkout
- 5.0 Order dan Pengiriman
- 6.0 Pembayaran
- 7.0 Voucher dan Promosi
- 8.0 Admin dan Monitoring

Level 2 difokuskan pada:

- 4.x Cart & Checkout (pengelolaan isi cart, perhitungan ongkir & diskon, pembuatan order)
- 8.x Admin & Monitoring (manajemen data oleh admin dan audit log).

---

## 6. Kebutuhan Fungsional

### 6.1 User & Auth

- **FR-AUTH-01** Sistem harus menyediakan registrasi user dengan email, nomor telepon, dan password.
- **FR-AUTH-02** Sistem harus mendukung login dengan kombinasi email/telepon + password dan menghasilkan token JWT.
- **FR-AUTH-03** Sistem harus melakukan verifikasi email sebelum user dianggap terverifikasi (`is_verified = 1`).
- **FR-AUTH-04** Sistem harus menyimpan peran dasar user di kolom `role` pada tabel `users` dengan nilai minimal: `customer`, `seller`, dan `admin`.
- **FR-AUTH-05** User dapat mengelola alamat pengiriman yang disimpan di `user_addresses`.

### 6.2 Seller & Toko

- **FR-SELLER-01** User dengan akun valid dapat mendaftar sebagai seller dan membuat satu toko di `stores`.
- **FR-SELLER-02** Seller dapat mengelola profil toko (nama, deskripsi, logo, banner, dsb.).
- **FR-SELLER-03** Seller dapat mengelola halaman about di `store_about_pages`.
- **FR-SELLER-04** Seller dapat mengonfigurasi pengiriman toko (courier internal/store_courier_settings dan pilihan layanan shipping).
- **FR-SELLER-05** Seller dapat mengelola template balasan (create, update, delete, re-order) di `reply_templates`.

### 6.3 Katalog Produk

- **FR-PROD-01** Seller dapat menambahkan, memperbarui, dan menghapus produk di `products`.
- **FR-PROD-02** Sistem harus mendukung variasi produk dan SKU (tabel `product_variant_attributes`, `product_variant_attribute_options`, `product_skus`, `product_sku_options`).
- **FR-PROD-03** Sistem harus menjaga integritas stok per produk/SKU, termasuk penyesuaian saat order dibuat.
- **FR-PROD-04** Sistem harus mendukung promosi produk di `product_promotions` dengan periode dan status aktif.

### 6.4 Cart & Checkout

- **FR-CART-01** Sistem harus membuat satu keranjang aktif per user di `carts`.
- **FR-CART-02** User dapat menambah/mengubah/menghapus `cart_items` dan memilih item mana saja yang akan di-checkout.
- **FR-CART-03** Sistem harus bisa menghitung subtotal per toko dan grand total.
- **FR-CART-04** Sistem harus menyimpan pilihan alamat pengiriman dan layanan pengiriman di `cart_shipping_selections`.
- **FR-CART-05** Sistem harus dapat mengaplikasikan voucher valid dan menyimpan hasil diskon di `cart_vouchers`.

### 6.5 Order & Pengiriman

- **FR-ORDER-01** Sistem harus dapat membuat 1..N order per proses checkout (1 order per toko) dan menyimpannya di `orders`.
- **FR-ORDER-02** Sistem harus menyimpan line item order di `order_items` serta menghitung total harga per item.
- **FR-ORDER-03** Sistem harus menyimpan informasi pengiriman di `order_shipments` termasuk kurir, layanan, ongkir, dan nomor resi.
- **FR-ORDER-04** Sistem harus menyimpan riwayat perubahan status order di `order_status_logs` beserta siapa yang mengubah (`changed_by`).

### 6.6 Pembayaran

- **FR-PAY-01** Sistem harus dapat menginisiasi pembayaran di `payments` dan mengirim request ke payment gateway.
- **FR-PAY-02** Sistem harus menerima notifikasi dari payment gateway dan menyimpannya di `payment_notifications`.
- **FR-PAY-03** Sistem harus meng-update status pembayaran order berdasarkan hasil notifikasi.

### 6.7 Voucher & Promosi

- **FR-VOUCHER-01** Seller atau admin dapat membuat dan mengelola voucher di `vouchers`.
- **FR-VOUCHER-02** Sistem harus dapat mengaitkan voucher ke produk tertentu di `voucher_products`.
- **FR-VOUCHER-03** Sistem harus mencatat penggunaan voucher di `voucher_usages`, termasuk siapa user dan order terkait.

### 6.8 Admin & Monitoring (Modul Baru)

Menggunakan tabel baru di `ADMIN_DB_SCHEMA.sql`:

- `admin_audit_logs`

**Identifikasi Admin**

- **FR-ADMIN-01** Sistem harus mengidentifikasi admin berdasarkan nilai `users.role = 'admin'` pada tabel `users`.

**Monitoring & Audit**

- **FR-ADMIN-02** Sistem harus menyimpan aktivitas penting admin (aksi CRUD terhadap entitas utama, perubahan status, dsb.) di `admin_audit_logs`.
- **FR-ADMIN-03** Admin dapat melihat daftar aktivitas dari `admin_audit_logs` berdasarkan filter waktu, user, aksi, dan target.

---

## 7. Kebutuhan Non-Fungsional (High Level)

- **NFR-01 Keamanan**
  - Token JWT untuk autentikasi API.
  - Password disimpan dalam bentuk hash (`password_hash` pada `users`).
  - Pembatasan akses admin berbasis role/permission.
- **NFR-02 Integritas Data**
  - Penggunaan foreign key dan constraint CHECK seperti pada schema.
  - Soft delete menggunakan kolom `deleted_at` pada beberapa tabel.
- **NFR-03 Audit & Pelacakan**
  - Semua perubahan kritis oleh admin tercatat di `admin_audit_logs`.
  - Notifikasi pembayaran disimpan untuk audit di `payment_notifications`.
- **NFR-04 Kinerja Dasar**
  - Index disiapkan untuk kolom yang sering digunakan pada filter (status, created_at, role, dsb.).

---

## 8. Asumsi Bisnis

- Setiap user hanya memiliki maksimal satu toko.
- Admin ditandai dengan `users.role = 'admin'`.
- Satu order hanya terkait satu pembayaran aktif di `payments`.
- Penghitungan ongkir dan tracking dilakukan via layanan pihak ketiga (mis. RajaOngkir) yang diakses melalui backend.

---

## 9. Kriteria Penerimaan (High Level)

- User dapat:
  - Registrasi, login, mengelola profil dan alamat.
  - Menjelajah produk dan belanja multi-toko.
  - Menyelesaikan checkout hingga pembayaran sukses.
- Seller dapat:
  - Membuat dan mengelola toko.
  - Mengelola produk dan promosi.
  - Mengelola pesanan toko (lihat order, update status, input resi).
- Admin dapat:
  - Login sebagai admin (dengan `users.role = 'admin'`) dan memiliki akses dashboard admin.
  - Melihat dan mengelola data user, seller, toko, produk, pesanan, pembayaran, dan voucher sesuai kebutuhan operasional.
  - Melihat audit log aktivitas admin untuk keperluan monitoring.

Dokumen BRD ini dimaksudkan sebagai pegangan tingkat bisnis. Detail teknis implementasi API ada di `API_REFERENCE.md` dan struktur tabel dapat dilihat di `DATABASE_SCHEMA_REFERENCE.md` serta script SQL terkait.
