# Analisis Tabel Database - Toco Clone

## 📊 Ringkasan Analisis

Dari skema database `toco_clone.sql`, ditemukan beberapa tabel yang **tidak terhubung dengan routes/controllers** atau memiliki **fitur yang tidak lengkap**.

---

## ❌ Tabel yang Tidak Terhubung / Tidak Berguna

### 1. **`product_options`** dan **`product_option_values`**

**Status:** ⚠️ **Hampir Tidak Terpakai**

**Masalah:**

- Tabel ini hanya digunakan untuk **READ** di `routes/optionsRoutes.js` (endpoint `/api/options`)
- **TIDAK digunakan** saat membuat atau mengupdate produk
- Sistem produk menggunakan sistem variant yang berbeda: `product_variant_attributes` dan `product_variant_attribute_options`

**Bukti:**

- Di `productController.js`, saat create product, sistem menggunakan:
  - `product_variant_attributes` (untuk nama atribut seperti "Color", "Size")
  - `product_variant_attribute_options` (untuk nilai seperti "Black", "M")
- Tabel `product_options` dan `product_option_values` hanya dibaca untuk referensi, tapi tidak di-insert saat create product

**Rekomendasi:**

- **Opsi 1:** Hapus tabel ini jika memang tidak diperlukan
- **Opsi 2:** Integrasikan dengan sistem variant yang ada, atau
- **Opsi 3:** Gunakan sebagai "master data" untuk dropdown options (jika memang diperlukan untuk UI)

---

## ⚠️ Fitur yang Tidak Lengkap

### 2. **`voucher_usages`**

**Status:** ⚠️ **Tracking Tidak Lengkap**

**Masalah:**

- Tabel ini hanya digunakan untuk **COUNT** (menghitung berapa kali voucher digunakan)
- **TIDAK ada INSERT** saat order dibuat dengan voucher
- Di `orderController.js` saat create order, tidak ada insert ke `voucher_usages`
- Hanya digunakan di `voucherSellerController.js` untuk menampilkan usage count

**Dampak:**

- Tidak bisa track history penggunaan voucher per user
- Tidak bisa validasi `usage_limit_per_user` dengan benar
- Data usage count tidak akurat

**Rekomendasi:**
Tambahkan INSERT ke `voucher_usages` di `orderController.js` saat order berhasil dibuat dengan voucher:

```javascript
// Setelah order berhasil dibuat dan voucher digunakan
if (cart.voucher && cart.voucher.voucher_id) {
  await conn.query(
    `INSERT INTO voucher_usages (voucher_id, user_id, order_id) 
     VALUES (?, ?, ?)`,
    [cart.voucher.voucher_id, userId, orderId]
  );
}
```

---

## ✅ Tabel yang Terhubung dan Digunakan

Berikut adalah daftar tabel yang **terhubung dengan routes/controllers**:

### Core Tables

- ✅ `users` - authLogin, authRegister, userController
- ✅ `stores` - sellerController, storeSettings, berbagai controller
- ✅ `products` - productController
- ✅ `categories` - categories controller
- ✅ `user_addresses` - addressController

### Cart & Order Tables

- ✅ `carts` - cartController
- ✅ `cart_items` - cartController
- ✅ `cart_shipping_selections` - cartController
- ✅ `cart_vouchers` - cartController
- ✅ `orders` - orderController, paymentController
- ✅ `order_items` - orderController
- ✅ `order_shipping` - orderController
- ✅ `order_status_logs` - orderController

### Product Variant Tables

- ✅ `product_images` - productController
- ✅ `product_variant_attributes` - productController
- ✅ `product_variant_attribute_options` - productController
- ✅ `product_skus` - productController, cartController, orderController
- ✅ `product_sku_options` - productController
- ✅ `product_promotions` - productController

### Classified Product Tables

- ✅ `vehicle_motor_specs` - productController
- ✅ `vehicle_mobil_specs` - productController
- ✅ `property_specs` - productController

### Voucher Tables

- ✅ `vouchers` - voucherSellerController, cartController
- ✅ `voucher_products` - voucherSellerController
- ⚠️ `voucher_usages` - **Hanya untuk COUNT, tidak ada INSERT**

### Shipping Tables

- ✅ `couriers` - shippingController, storeSettings
- ✅ `courier_services` - shippingController, storeSettings
- ✅ `store_selected_services` - storeSettings
- ✅ `store_courier_settings` - storeSettings
- ✅ `store_courier_distance_rates` - storeSettings
- ✅ `store_courier_weight_rates` - storeSettings

### Store Settings Tables

- ✅ `store_about_pages` - storeSettings
- ✅ `reply_templates` - templateController

---

## 📋 Kesimpulan

### Tabel yang Bisa Dihapus (Jika Tidak Diperlukan):

1. **`product_options`** - Hanya untuk read, tidak digunakan saat create product
2. **`product_option_values`** - Hanya untuk read, tidak digunakan saat create product

### Fitur yang Perlu Dilengkapi:

1. **`voucher_usages`** - Perlu ditambahkan INSERT saat order dibuat dengan voucher

### Tabel yang Perlu Dipertimbangkan:

- `product_options` dan `product_option_values` bisa dipertahankan jika:
  - Akan digunakan sebagai "master data" untuk dropdown di frontend
  - Akan diintegrasikan dengan sistem variant yang ada
  - Akan digunakan untuk fitur pencarian/filter produk berdasarkan option

---

## 🔧 Action Items

1. **Evaluasi `product_options` dan `product_option_values`**

   - Tentukan apakah akan digunakan atau dihapus
   - Jika akan digunakan, integrasikan dengan sistem variant

2. **Perbaiki tracking `voucher_usages`**

   - Tambahkan INSERT di `orderController.js` saat order dibuat dengan voucher
   - Pastikan validasi `usage_limit_per_user` bekerja dengan benar

3. **Review Foreign Key Constraints**
   - Pastikan semua foreign key masih relevan
   - Hapus constraint yang tidak diperlukan jika tabel dihapus

---

## 📖 Dokumentasi Fungsi Setiap Atribut

Berikut adalah penjelasan fungsi setiap atribut pada tabel-tabel yang **berguna dan terhubung** dengan sistem:

---

### 🔵 **Core Tables**

#### **`users`**

| Atribut        | Tipe                          | Fungsi                                           |
| -------------- | ----------------------------- | ------------------------------------------------ |
| `user_id`      | int(11) PK                    | ID unik pengguna (Primary Key)                   |
| `full_name`    | varchar(255)                  | Nama lengkap pengguna                            |
| `phone_number` | varchar(20) UNIQUE            | Nomor telepon (unik, untuk login)                |
| `email`        | varchar(255) UNIQUE           | Email pengguna (unik, untuk login)               |
| `password`     | varchar(255)                  | Password ter-hash (bcrypt)                       |
| `role`         | enum('user','seller','admin') | Role pengguna: user biasa, seller, atau admin    |
| `is_verified`  | tinyint(1)                    | Status verifikasi akun (0=belum, 1=sudah)        |
| `google_id`    | varchar(255)                  | ID dari Google OAuth (jika login via Google)     |
| `facebook_id`  | varchar(255)                  | ID dari Facebook OAuth (jika login via Facebook) |
| `gender`       | enum('Laki-laki','Perempuan') | Jenis kelamin                                    |
| `birth_date`   | date                          | Tanggal lahir                                    |
| `created_at`   | timestamp                     | Waktu registrasi                                 |

#### **`stores`**

| Atribut                                                    | Tipe                         | Fungsi                                   |
| ---------------------------------------------------------- | ---------------------------- | ---------------------------------------- |
| `store_id`                                                 | int(10) UNSIGNED PK          | ID unik toko (Primary Key)               |
| `user_id`                                                  | int(11) FK                   | ID pemilik toko (Foreign Key ke users)   |
| `name`                                                     | varchar(100)                 | Nama toko                                |
| `slug`                                                     | varchar(120) UNIQUE          | URL-friendly nama toko (untuk SEO)       |
| `profile_image_url`                                        | varchar(255)                 | URL foto profil toko                     |
| `background_image_url`                                     | varchar(255)                 | URL gambar latar belakang toko           |
| `description`                                              | text                         | Deskripsi toko                           |
| `business_phone`                                           | varchar(20)                  | Nomor telepon bisnis toko                |
| `show_business_phone`                                      | tinyint(1)                   | Tampilkan nomor telepon di halaman toko? |
| `address_detail`                                           | text                         | Detail alamat toko                       |
| `postal_code`                                              | varchar(10)                  | Kode pos                                 |
| `province_id`, `city_id`, `district_id`, `sub_district_id` | varchar(10)                  | ID wilayah (untuk integrasi API wilayah) |
| `province`, `city`, `district`, `sub_district`             | varchar(100)                 | Nama wilayah (untuk display)             |
| `latitude`, `longitude`                                    | decimal(10,8), decimal(11,8) | Koordinat GPS toko                       |
| `use_cloudflare`                                           | tinyint(1)                   | Gunakan Cloudflare untuk CDN?            |
| `is_active`                                                | tinyint(1)                   | Status aktif toko (0=nonaktif, 1=aktif)  |
| `is_on_holiday`                                            | tinyint(1)                   | Mode libur aktif?                        |
| `holiday_start_date`, `holiday_end_date`                   | date                         | Tanggal mulai dan akhir libur            |
| `show_phone_number`                                        | tinyint(1)                   | Tampilkan nomor telepon di produk?       |
| `created_at`, `updated_at`                                 | timestamp                    | Waktu pembuatan dan update               |

#### **`products`**

| Atribut                    | Tipe                             | Fungsi                                                                              |
| -------------------------- | -------------------------------- | ----------------------------------------------------------------------------------- |
| `product_id`               | bigint(20) UNSIGNED PK           | ID unik produk (Primary Key)                                                        |
| `store_id`                 | int(10) UNSIGNED FK              | ID toko pemilik produk                                                              |
| `category_id`              | int(10) UNSIGNED FK              | ID kategori produk                                                                  |
| `name`                     | varchar(255)                     | Nama produk                                                                         |
| `slug`                     | varchar(255) UNIQUE              | URL-friendly nama produk (untuk SEO)                                                |
| `description`              | text                             | Deskripsi produk (HTML)                                                             |
| `product_classification`   | enum('marketplace','classified') | Jenis: marketplace (barang baru/bekas biasa) atau classified (motor/mobil/properti) |
| `price`                    | decimal(15,2)                    | Harga dasar produk (jika tidak pakai SKU)                                           |
| `stock`                    | int(10) UNSIGNED                 | Stok produk (jika tidak pakai SKU)                                                  |
| `sku`                      | varchar(100)                     | SKU produk (jika tidak pakai variant SKU)                                           |
| `condition`                | enum('new','used')               | Kondisi: baru atau bekas                                                            |
| `brand`                    | varchar(255)                     | Merek produk                                                                        |
| `weight_gram`              | int(10) UNSIGNED                 | Berat produk dalam gram (untuk kalkulasi ongkir)                                    |
| `dimensions`               | longtext JSON                    | Dimensi produk (length, width, height) dalam format JSON                            |
| `is_preorder`              | tinyint(1)                       | Apakah produk pre-order?                                                            |
| `use_store_courier`        | tinyint(1)                       | Gunakan kurir toko sendiri? (bukan kurir pihak ketiga)                              |
| `insurance`                | enum('wajib','opsional')         | Asuransi pengiriman: wajib atau opsional                                            |
| `status`                   | enum('active','inactive')        | Status produk: aktif atau nonaktif                                                  |
| `average_rating`           | decimal(3,2)                     | Rating rata-rata produk (0.00 - 5.00)                                               |
| `review_count`             | int(10) UNSIGNED                 | Jumlah review produk                                                                |
| `created_at`, `updated_at` | timestamp                        | Waktu pembuatan dan update                                                          |

#### **`categories`**

| Atribut                    | Tipe                | Fungsi                                                 |
| -------------------------- | ------------------- | ------------------------------------------------------ |
| `category_id`              | int(10) UNSIGNED PK | ID unik kategori (Primary Key)                         |
| `name`                     | varchar(255)        | Nama kategori                                          |
| `slug`                     | varchar(255) UNIQUE | URL-friendly nama kategori                             |
| `parent_id`                | int(10) UNSIGNED FK | ID kategori induk (untuk kategori bertingkat/hierarki) |
| `image_url`                | varchar(255)        | URL gambar kategori                                    |
| `created_at`, `updated_at` | timestamp           | Waktu pembuatan dan update                             |

#### **`user_addresses`**

| Atribut                                        | Tipe                         | Fungsi                                                |
| ---------------------------------------------- | ---------------------------- | ----------------------------------------------------- |
| `userAddress_id`                               | int(11) PK                   | ID unik alamat (Primary Key)                          |
| `user_id`                                      | int(11) FK                   | ID pengguna pemilik alamat                            |
| `label`                                        | varchar(50)                  | Label alamat (contoh: "Rumah", "Kantor")              |
| `recipient_name`                               | varchar(100)                 | Nama penerima                                         |
| `phone_number`                                 | varchar(20)                  | Nomor telepon penerima                                |
| `latitude`, `longitude`                        | decimal(10,8), decimal(11,8) | Koordinat GPS alamat                                  |
| `map_address`                                  | text                         | Alamat lengkap dari Google Maps                       |
| `address_detail`                               | text                         | Detail alamat (contoh: "Lantai 2, dekat patung kuda") |
| `postal_code`                                  | varchar(10)                  | Kode pos                                              |
| `province`, `city`, `district`, `sub_district` | varchar(100)                 | Nama wilayah lengkap                                  |
| `is_primary`                                   | tinyint(1)                   | Alamat utama? (untuk default saat checkout)           |
| `created_at`, `updated_at`                     | timestamp                    | Waktu pembuatan dan update                            |

---

### 🛒 **Cart & Order Tables**

#### **`carts`**

| Atribut                    | Tipe                   | Fungsi                                  |
| -------------------------- | ---------------------- | --------------------------------------- |
| `cart_id`                  | bigint(20) UNSIGNED PK | ID unik keranjang (Primary Key)         |
| `user_id`                  | int(11) UNIQUE         | ID pengguna (satu user = satu cart)     |
| `selected_address_id`      | bigint(20) UNSIGNED FK | ID alamat yang dipilih untuk pengiriman |
| `created_at`, `updated_at` | timestamp              | Waktu pembuatan dan update              |

#### **`cart_items`**

| Atribut                    | Tipe                   | Fungsi                                                                               |
| -------------------------- | ---------------------- | ------------------------------------------------------------------------------------ |
| `cart_item_id`             | bigint(20) UNSIGNED PK | ID unik item dalam cart                                                              |
| `cart_id`                  | bigint(20) UNSIGNED FK | ID keranjang                                                                         |
| `store_id`                 | int(10) UNSIGNED FK    | ID toko (untuk grouping per toko)                                                    |
| `product_id`               | bigint(20) UNSIGNED FK | ID produk                                                                            |
| `product_sku_id`           | bigint(20) UNSIGNED FK | ID SKU variant (jika produk punya variant)                                           |
| `product_name_snapshot`    | varchar(255)           | Snapshot nama produk saat ditambahkan ke cart (untuk konsistensi jika produk diubah) |
| `variant_snapshot`         | varchar(255)           | Snapshot variant (contoh: "Black, M")                                                |
| `image_url_snapshot`       | varchar(255)           | Snapshot URL gambar produk                                                           |
| `unit_price_snapshot`      | decimal(15,2)          | Snapshot harga satuan saat ditambahkan                                               |
| `weight_gram_snapshot`     | int(10) UNSIGNED       | Snapshot berat produk (untuk kalkulasi ongkir)                                       |
| `quantity`                 | int(10) UNSIGNED       | Jumlah item                                                                          |
| `selected`                 | tinyint(1)             | Dipilih untuk checkout? (1=ya, 0=tidak)                                              |
| `created_at`, `updated_at` | timestamp              | Waktu pembuatan dan update                                                           |

#### **`cart_shipping_selections`**

| Atribut                        | Tipe                   | Fungsi                                   |
| ------------------------------ | ---------------------- | ---------------------------------------- |
| `selection_id`                 | bigint(20) UNSIGNED PK | ID unik pilihan pengiriman               |
| `cart_id`                      | bigint(20) UNSIGNED FK | ID keranjang                             |
| `store_id`                     | int(10) UNSIGNED FK    | ID toko (satu toko = satu pilihan kurir) |
| `courier_code`                 | varchar(50)            | Kode kurir (contoh: "jne", "jnt")        |
| `service_code`                 | varchar(50)            | Kode layanan (contoh: "REG", "YES")      |
| `service_name`                 | varchar(100)           | Nama layanan (contoh: "JNE Regular")     |
| `etd_min_days`, `etd_max_days` | int(11)                | Estimasi hari pengiriman (min dan max)   |
| `delivery_fee`                 | decimal(15,2)          | Ongkos kirim                             |
| `note`                         | varchar(255)           | Catatan tambahan                         |
| `updated_at`                   | timestamp              | Waktu update                             |

#### **`cart_vouchers`**

| Atribut           | Tipe                   | Fungsi                                               |
| ----------------- | ---------------------- | ---------------------------------------------------- |
| `cart_id`         | bigint(20) UNSIGNED PK | ID keranjang (Primary Key, satu cart = satu voucher) |
| `voucher_code`    | varchar(50)            | Kode voucher yang digunakan                          |
| `discount_amount` | decimal(15,2)          | Jumlah diskon yang dihitung                          |
| `voucher_id`      | bigint(20) UNSIGNED FK | ID voucher (Foreign Key ke vouchers)                 |

#### **`orders`**

| Atribut                                          | Tipe                   | Fungsi                                                                                                    |
| ------------------------------------------------ | ---------------------- | --------------------------------------------------------------------------------------------------------- |
| `order_id`                                       | bigint(20) UNSIGNED PK | ID unik order (Primary Key)                                                                               |
| `order_code`                                     | varchar(30) UNIQUE     | Kode order unik (contoh: "TC251110-YX3X")                                                                 |
| `user_id`                                        | int(11) FK             | ID pembeli                                                                                                |
| `store_id`                                       | int(10) UNSIGNED FK    | ID toko (satu order = satu toko)                                                                          |
| `address_id`                                     | bigint(20) UNSIGNED FK | ID alamat pengiriman                                                                                      |
| `subtotal_amount`                                | decimal(15,2)          | Subtotal (harga produk sebelum ongkir dan diskon)                                                         |
| `shipping_amount`                                | decimal(15,2)          | Ongkos kirim                                                                                              |
| `discount_amount`                                | decimal(15,2)          | Jumlah diskon voucher                                                                                     |
| `total_amount`                                   | decimal(15,2)          | Total akhir (subtotal + shipping - discount)                                                              |
| `voucher_id`                                     | bigint(20) UNSIGNED FK | ID voucher yang digunakan                                                                                 |
| `voucher_code`                                   | varchar(50)            | Kode voucher (snapshot)                                                                                   |
| `status`                                         | enum                   | Status order: 'pending_unpaid', 'waiting_confirmation', 'processing', 'shipped', 'completed', 'cancelled' |
| `payment_status`                                 | enum                   | Status pembayaran: 'unpaid', 'paid', 'refunded'                                                           |
| `payment_provider`                               | varchar(50)            | Provider pembayaran (contoh: "midtrans")                                                                  |
| `payment_reference`                              | varchar(100)           | Reference ID dari payment gateway                                                                         |
| `shipping_courier_code`                          | varchar(50)            | Kode kurir (snapshot)                                                                                     |
| `shipping_service_code`                          | varchar(50)            | Kode layanan (snapshot)                                                                                   |
| `shipping_service_name`                          | varchar(100)           | Nama layanan (snapshot)                                                                                   |
| `shipping_etd_min_days`, `shipping_etd_max_days` | int(11)                | Estimasi hari pengiriman (snapshot)                                                                       |
| `shipping_tracking_no`                           | varchar(100)           | Nomor resi pengiriman                                                                                     |
| `note`                                           | varchar(255)           | Catatan order                                                                                             |
| `created_at`, `updated_at`                       | timestamp              | Waktu pembuatan dan update                                                                                |

#### **`order_items`**

| Atribut         | Tipe                   | Fungsi                                                 |
| --------------- | ---------------------- | ------------------------------------------------------ |
| `order_item_id` | bigint(20) UNSIGNED PK | ID unik item dalam order                               |
| `order_id`      | bigint(20) UNSIGNED FK | ID order                                               |
| `product_id`    | bigint(20) UNSIGNED FK | ID produk                                              |
| `product_name`  | varchar(255)           | Nama produk (snapshot)                                 |
| `sku_code`      | varchar(100)           | Kode SKU (jika ada)                                    |
| `price`         | decimal(15,2)          | Harga satuan (snapshot)                                |
| `quantity`      | int(11)                | Jumlah item                                            |
| `weight_gram`   | int(11)                | Berat item (snapshot)                                  |
| `image_url`     | varchar(255)           | URL gambar produk (snapshot)                           |
| `created_at`    | timestamp              | Waktu pembuatan (tidak ada updated_at karena snapshot) |

#### **`order_shipping`**

| Atribut                        | Tipe                         | Fungsi                                           |
| ------------------------------ | ---------------------------- | ------------------------------------------------ |
| `order_id`                     | bigint(20) UNSIGNED PK       | ID order (Primary Key, satu order = satu alamat) |
| `recipient_name`               | varchar(255)                 | Nama penerima (snapshot)                         |
| `phone_number`                 | varchar(30)                  | Nomor telepon penerima (snapshot)                |
| `address_line`                 | text                         | Alamat lengkap (snapshot)                        |
| `province`, `city`, `district` | varchar(100)                 | Nama wilayah (snapshot)                          |
| `postal_code`                  | varchar(10)                  | Kode pos (snapshot)                              |
| `latitude`, `longitude`        | decimal(10,8), decimal(11,8) | Koordinat GPS (snapshot)                         |

#### **`order_status_logs`**

| Atribut      | Tipe                                   | Fungsi                     |
| ------------ | -------------------------------------- | -------------------------- |
| `log_id`     | bigint(20) UNSIGNED PK                 | ID unik log                |
| `order_id`   | bigint(20) UNSIGNED FK                 | ID order                   |
| `old_status` | varchar(50)                            | Status sebelumnya          |
| `new_status` | varchar(50)                            | Status baru                |
| `changed_by` | enum('system','user','seller','admin') | Siapa yang mengubah status |
| `note`       | varchar(255)                           | Catatan perubahan          |
| `created_at` | timestamp                              | Waktu perubahan            |

---

### 📦 **Product Variant Tables**

#### **`product_images`**

| Atribut      | Tipe                   | Fungsi                                    |
| ------------ | ---------------------- | ----------------------------------------- |
| `image_id`   | bigint(20) UNSIGNED PK | ID unik gambar                            |
| `product_id` | bigint(20) UNSIGNED FK | ID produk                                 |
| `url`        | varchar(255)           | URL gambar                                |
| `alt_text`   | varchar(255)           | Teks alternatif untuk aksesibilitas       |
| `sort_order` | smallint(5) UNSIGNED   | Urutan tampilan gambar (0 = gambar utama) |

#### **`product_variant_attributes`**

| Atribut          | Tipe                   | Fungsi                                 |
| ---------------- | ---------------------- | -------------------------------------- |
| `attribute_id`   | bigint(20) UNSIGNED PK | ID unik atribut                        |
| `product_id`     | bigint(20) UNSIGNED FK | ID produk                              |
| `attribute_name` | varchar(100)           | Nama atribut (contoh: "Color", "Size") |
| `sort_order`     | smallint(5) UNSIGNED   | Urutan tampilan atribut                |

#### **`product_variant_attribute_options`**

| Atribut        | Tipe                   | Fungsi                            |
| -------------- | ---------------------- | --------------------------------- |
| `option_id`    | bigint(20) UNSIGNED PK | ID unik opsi                      |
| `attribute_id` | bigint(20) UNSIGNED FK | ID atribut                        |
| `option_value` | varchar(100)           | Nilai opsi (contoh: "Black", "M") |
| `sort_order`   | smallint(5) UNSIGNED   | Urutan tampilan opsi              |

#### **`product_skus`**

| Atribut                    | Tipe                   | Fungsi                                     |
| -------------------------- | ---------------------- | ------------------------------------------ |
| `product_sku_id`           | bigint(20) UNSIGNED PK | ID unik SKU                                |
| `product_id`               | bigint(20) UNSIGNED FK | ID produk                                  |
| `sku_code`                 | varchar(120)           | Kode SKU unik (contoh: "KAOS-BLACK-M")     |
| `price`                    | decimal(15,2)          | Harga untuk SKU ini                        |
| `stock`                    | int(10) UNSIGNED       | Stok untuk SKU ini                         |
| `weight_gram`              | int(10) UNSIGNED       | Berat SKU (jika berbeda dari produk utama) |
| `dimensions`               | longtext JSON          | Dimensi SKU dalam format JSON              |
| `created_at`, `updated_at` | timestamp              | Waktu pembuatan dan update                 |

#### **`product_sku_options`**

| Atribut                 | Tipe                   | Fungsi                                         |
| ----------------------- | ---------------------- | ---------------------------------------------- |
| `product_sku_option_id` | bigint(20) UNSIGNED PK | ID unik relasi                                 |
| `product_sku_id`        | bigint(20) UNSIGNED FK | ID SKU                                         |
| `option_id`             | bigint(20) UNSIGNED FK | ID opsi dari product_variant_attribute_options |

**Fungsi:** Menghubungkan SKU dengan opsi variant yang dipilih. Contoh: SKU "KAOS-BLACK-M" terhubung dengan opsi "Black" (Color) dan "M" (Size).

#### **`product_promotions`**

| Atribut        | Tipe                   | Fungsi                      |
| -------------- | ---------------------- | --------------------------- |
| `promotion_id` | bigint(20) UNSIGNED PK | ID unik promosi             |
| `product_id`   | bigint(20) UNSIGNED FK | ID produk yang dipromosikan |
| `store_id`     | int(10) UNSIGNED FK    | ID toko                     |
| `started_at`   | datetime               | Waktu mulai promosi         |
| `expires_at`   | datetime               | Waktu berakhir promosi      |
| `created_at`   | timestamp              | Waktu pembuatan             |

---

### 🏠 **Classified Product Tables**

#### **`vehicle_motor_specs`** (Spesifikasi Motor)

| Atribut                 | Tipe                         | Fungsi                                           |
| ----------------------- | ---------------------------- | ------------------------------------------------ |
| `product_id`            | bigint(20) UNSIGNED PK       | ID produk (Primary Key, Foreign Key ke products) |
| `brand`                 | varchar(100)                 | Merek motor (contoh: "Yamaha")                   |
| `year`                  | smallint(4)                  | Tahun produksi                                   |
| `model`                 | varchar(100)                 | Model motor (contoh: "NMAX")                     |
| `transmission`          | enum('manual','automatic')   | Transmisi: manual atau otomatis                  |
| `mileage_km`            | int(11)                      | Jarak tempuh dalam km                            |
| `engine_cc`             | int(11)                      | Kapasitas mesin dalam cc                         |
| `color`                 | varchar(50)                  | Warna motor                                      |
| `fuel`                  | varchar(50)                  | Jenis bahan bakar                                |
| `tax_expiry_date`       | date                         | Tanggal kadaluarsa pajak                         |
| `completeness_text`     | varchar(255)                 | Kelengkapan dokumen (contoh: "STNK, BPKB")       |
| `latitude`, `longitude` | decimal(10,8), decimal(11,8) | Lokasi motor                                     |

#### **`vehicle_mobil_specs`** (Spesifikasi Mobil)

| Atribut                 | Tipe                         | Fungsi                   |
| ----------------------- | ---------------------------- | ------------------------ |
| `product_id`            | bigint(20) UNSIGNED PK       | ID produk                |
| `brand`                 | varchar(100)                 | Merek mobil              |
| `model`                 | varchar(100)                 | Model mobil              |
| `year`                  | smallint(4)                  | Tahun produksi           |
| `transmission`          | enum('manual','automatic')   | Transmisi                |
| `mileage_km`            | int(11)                      | Jarak tempuh             |
| `license_plate`         | varchar(20)                  | Nomor polisi             |
| `color`                 | varchar(50)                  | Warna mobil              |
| `fuel`                  | varchar(50)                  | Jenis bahan bakar        |
| `engine_cc`             | int(11)                      | Kapasitas mesin          |
| `seat_count`            | tinyint(3)                   | Jumlah kursi             |
| `tax_expiry_date`       | date                         | Tanggal kadaluarsa pajak |
| `completeness_text`     | varchar(255)                 | Kelengkapan dokumen      |
| `latitude`, `longitude` | decimal(10,8), decimal(11,8) | Lokasi mobil             |

#### **`property_specs`** (Spesifikasi Properti)

| Atribut                 | Tipe                         | Fungsi                                          |
| ----------------------- | ---------------------------- | ----------------------------------------------- |
| `product_id`            | bigint(20) UNSIGNED PK       | ID produk                                       |
| `transaction_type`      | enum('sale','rent')          | Jenis transaksi: jual atau sewa                 |
| `price`                 | decimal(15,2)                | Harga (jual/sewa)                               |
| `building_area_m2`      | int(11)                      | Luas bangunan dalam m²                          |
| `land_area_m2`          | int(11)                      | Luas tanah dalam m²                             |
| `bedrooms`              | tinyint(3)                   | Jumlah kamar tidur                              |
| `bathrooms`             | tinyint(3)                   | Jumlah kamar mandi                              |
| `floors`                | tinyint(3)                   | Jumlah lantai                                   |
| `certificate_text`      | varchar(255)                 | Jenis sertifikat (contoh: "SHM")                |
| `facilities_text`       | text                         | Fasilitas (contoh: "Keamanan 24 jam, One Gate") |
| `latitude`, `longitude` | decimal(10,8), decimal(11,8) | Lokasi properti                                 |

---

### 🎫 **Voucher Tables**

#### **`vouchers`**

| Atribut                    | Tipe                                     | Fungsi                                           |
| -------------------------- | ---------------------------------------- | ------------------------------------------------ |
| `voucher_id`               | bigint(20) UNSIGNED PK                   | ID unik voucher                                  |
| `store_id`                 | int(10) UNSIGNED FK                      | ID toko (NULL = voucher global/platform)         |
| `code`                     | varchar(50) UNIQUE                       | Kode voucher (contoh: "HARI_RAYA_50")            |
| `voucher_type`             | enum('discount','free_shipping')         | Jenis: diskon atau gratis ongkir                 |
| `type`                     | enum('fixed','percent')                  | Tipe diskon: nominal tetap atau persentase       |
| `value`                    | decimal(15,2)                            | Nilai diskon (nominal atau persentase)           |
| `max_discount`             | decimal(15,2)                            | Maksimal diskon (untuk persentase)               |
| `min_discount`             | decimal(15,2)                            | Minimal diskon (untuk persentase)                |
| `min_order_amount`         | decimal(15,2)                            | Minimum belanja untuk bisa pakai voucher         |
| `title`                    | varchar(255)                             | Judul promosi                                    |
| `description`              | text                                     | Deskripsi promosi                                |
| `target`                   | enum('public','private')                 | Target: publik atau khusus                       |
| `applicable_to`            | enum('all_products','specific_products') | Berlaku untuk: semua produk atau produk tertentu |
| `start_at`                 | datetime                                 | Waktu mulai voucher                              |
| `end_at`                   | datetime                                 | Waktu berakhir voucher                           |
| `usage_limit_total`        | int(11)                                  | Batas penggunaan total (NULL = unlimited)        |
| `usage_limit_per_user`     | int(11)                                  | Batas penggunaan per user (NULL = unlimited)     |
| `is_active`                | tinyint(1)                               | Status aktif voucher                             |
| `created_at`, `updated_at` | timestamp                                | Waktu pembuatan dan update                       |

#### **`voucher_products`**

| Atribut              | Tipe                   | Fungsi                                               |
| -------------------- | ---------------------- | ---------------------------------------------------- |
| `voucher_product_id` | bigint(20) UNSIGNED PK | ID unik relasi                                       |
| `voucher_id`         | bigint(20) UNSIGNED FK | ID voucher                                           |
| `product_id`         | bigint(20) UNSIGNED FK | ID produk (jika applicable_to = 'specific_products') |
| `created_at`         | timestamp              | Waktu pembuatan                                      |

**Fungsi:** Menentukan produk mana saja yang bisa pakai voucher (jika `applicable_to = 'specific_products'`).

#### **`voucher_usages`** ⚠️

| Atribut      | Tipe                   | Fungsi                            |
| ------------ | ---------------------- | --------------------------------- |
| `usage_id`   | bigint(20) UNSIGNED PK | ID unik penggunaan                |
| `voucher_id` | bigint(20) UNSIGNED FK | ID voucher                        |
| `user_id`    | int(11) FK             | ID user yang menggunakan          |
| `order_id`   | bigint(20) UNSIGNED FK | ID order yang menggunakan voucher |
| `used_at`    | timestamp              | Waktu penggunaan                  |

**Catatan:** Tabel ini hanya digunakan untuk COUNT, belum ada INSERT saat order dibuat. Perlu diperbaiki!

---

### 🚚 **Shipping Tables**

#### **`couriers`**

| Atribut      | Tipe               | Fungsi                              |
| ------------ | ------------------ | ----------------------------------- |
| `courier_id` | int(11) PK         | ID unik kurir                       |
| `code`       | varchar(50) UNIQUE | Kode kurir (contoh: "jne", "jnt")   |
| `name`       | varchar(100)       | Nama kurir (contoh: "JNE Logistic") |
| `logo_url`   | varchar(255)       | URL logo kurir                      |
| `is_active`  | tinyint(1)         | Status aktif kurir                  |

#### **`courier_services`**

| Atribut       | Tipe               | Fungsi                               |
| ------------- | ------------------ | ------------------------------------ |
| `service_id`  | int(11) PK         | ID unik layanan                      |
| `courier_id`  | int(11) FK         | ID kurir                             |
| `code`        | varchar(50) UNIQUE | Kode layanan (contoh: "REG", "YES")  |
| `name`        | varchar(100)       | Nama layanan (contoh: "JNE Regular") |
| `description` | text               | Deskripsi layanan                    |
| `is_active`   | tinyint(1)         | Status aktif layanan                 |

#### **`store_selected_services`**

| Atribut      | Tipe                | Fungsi                             |
| ------------ | ------------------- | ---------------------------------- |
| `store_id`   | int(10) UNSIGNED FK | ID toko                            |
| `service_id` | int(11) FK          | ID layanan kurir yang dipilih toko |

**Fungsi:** Menentukan layanan kurir mana saja yang tersedia untuk toko tertentu.

#### **`store_courier_settings`**

| Atribut                    | Tipe                       | Fungsi                             |
| -------------------------- | -------------------------- | ---------------------------------- |
| `setting_id`               | int(11) PK                 | ID unik pengaturan                 |
| `store_id`                 | int(10) UNSIGNED FK UNIQUE | ID toko (satu toko = satu setting) |
| `is_active`                | tinyint(1)                 | Aktifkan kurir toko sendiri?       |
| `max_delivery_km`          | decimal(10,2)              | Maksimal jarak pengiriman (km)     |
| `created_at`, `updated_at` | timestamp                  | Waktu pembuatan dan update         |

#### **`store_courier_distance_rates`**

| Atribut              | Tipe          | Fungsi                             |
| -------------------- | ------------- | ---------------------------------- |
| `courierDistance_id` | int(11) PK    | ID unik tarif                      |
| `setting_id`         | int(11) FK    | ID pengaturan kurir toko           |
| `from_km`            | decimal(10,2) | Jarak mulai (km)                   |
| `to_km`              | decimal(10,2) | Jarak akhir (km)                   |
| `price`              | int(11)       | Harga ongkir untuk range jarak ini |

**Contoh:** 0-5 km = 10.000, 5.01-10 km = 15.000, dst.

#### **`store_courier_weight_rates`**

| Atribut            | Tipe       | Fungsi                                     |
| ------------------ | ---------- | ------------------------------------------ |
| `courierWeight_id` | int(11) PK | ID unik tarif                              |
| `setting_id`       | int(11) FK | ID pengaturan kurir toko                   |
| `above_weight_gr`  | int(11)    | Berat minimal (gram) untuk tarif tambahan  |
| `additional_price` | int(11)    | Harga tambahan per berat di atas threshold |

**Contoh:** Setiap 1000 gram di atas 1000 gram = tambahan 3.000.

---

### 🏪 **Store Settings Tables**

#### **`store_about_pages`**

| Atribut                    | Tipe                   | Fungsi                       |
| -------------------------- | ---------------------- | ---------------------------- |
| `about_id`                 | bigint(20) UNSIGNED PK | ID unik halaman              |
| `store_id`                 | int(10) UNSIGNED FK    | ID toko                      |
| `title`                    | varchar(255)           | Judul halaman "Tentang Toko" |
| `thumbnail_url`            | varchar(255)           | URL thumbnail halaman        |
| `content`                  | text                   | Konten halaman (HTML)        |
| `created_at`, `updated_at` | timestamp              | Waktu pembuatan dan update   |

#### **`reply_templates`**

| Atribut                    | Tipe                | Fungsi                     |
| -------------------------- | ------------------- | -------------------------- |
| `reply_id`                 | int(11) PK          | ID unik template           |
| `store_id`                 | int(10) UNSIGNED FK | ID toko                    |
| `content`                  | text                | Isi template balasan chat  |
| `display_order`            | int(11)             | Urutan tampilan template   |
| `created_at`, `updated_at` | timestamp           | Waktu pembuatan dan update |

**Fungsi:** Template balasan cepat untuk seller saat chat dengan pembeli.

---

## 📝 Catatan Penting

1. **Snapshot Fields**: Banyak tabel memiliki field "snapshot" (seperti `product_name_snapshot`, `unit_price_snapshot`) yang menyimpan data saat item ditambahkan ke cart. Ini penting untuk konsistensi data jika produk diubah setelah ditambahkan ke cart.

2. **Status Enums**: Pastikan memahami flow status order dan payment status untuk implementasi yang benar.

3. **Foreign Keys**: Semua foreign key relationships harus dijaga konsistensinya saat melakukan operasi CRUD.

4. **JSON Fields**: Field `dimensions` di `products` dan `product_skus` menggunakan format JSON, pastikan validasi JSON saat insert/update.

5. **Unique Constraints**: Beberapa field memiliki unique constraint (seperti `order_code`, `voucher_code`), pastikan tidak ada duplikasi.
