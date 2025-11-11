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
