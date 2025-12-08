# Database Schema Reference (toco_clone_professional)

Dokumentasi ringkas fungsi tiap tabel, relasi utama, kolom penting, dan aturan bisnis. Gunakan ini sebagai peta saat menulis query atau controller.

## Konvensi Umum
- **Penamaan**: snake_case untuk kolom, singular untuk nama tabel domain (kecuali konvensi umum seperti `orders`, `payments`).
- **Soft delete**: Banyak tabel memiliki kolom `deleted_at` (NULL = aktif). Filter dengan `WHERE deleted_at IS NULL` bila relevan.
- **Timestamps**: `created_at`, `updated_at` (otomatis). Beberapa tabel hanya punya `created_at`.
- **FK behavior**: Mayoritas relasi menggunakan `ON DELETE CASCADE` (data anak ikut terhapus), atau `SET NULL/RESTRICT` jika diperlukan integritas.
- **Booleans**: Tipe `tinyint(1)` dengan constraint `CHECK (col IN (0,1))`.
- **Uang**: Decimal(15,2) untuk nilai uang.
- **Enum**: Digunakan untuk status/tipe (cek valid set di definisi kolom).

---

## Core Tables

### users
- **Fungsi**: Master pengguna (customer, seller, admin).
- **Kolom kunci**: `user_id` (PK), `email`, `phone_number` (UNIQUE).
- **Kolom penting**: `password_hash`, `role` enum('customer','seller','admin'), `is_verified`, `is_active`, `last_login_at`, `email_verified_at`, `deleted_at`.
- **Index**: `idx_users_role`, `idx_users_verified`, `idx_users_active`, `uk_*` untuk unik.

### categories
- **Fungsi**: Kategori produk dengan hierarki (parent-child).
- **Kolom kunci**: `category_id` (PK), `parent_id` (FK->categories), `slug` (UNIQUE).
- **Kolom penting**: `is_active`, `sort_order`, `deleted_at`.
- **Relasi**: Parent `SET NULL` saat parent dihapus.

### couriers
- **Fungsi**: Master kurir (JNE/JNT/dll).
- **Kolom kunci**: `courier_id` (PK), `code` (UNIQUE).
- **Kolom penting**: `name`, `is_active`.

### courier_services
- **Fungsi**: Layanan pengiriman per kurir (regular/express/dll).
- **Kolom kunci**: `service_id` (PK), `courier_id` (FK->couriers), `code` (UNIQUE).
- **Kolom penting**: `service_type` enum('regular','express','economy','same_day','cargo'), `is_active`.

---

## User Related

### user_addresses
- **Fungsi**: Alamat pengguna lengkap dengan geolokasi.
- **Kolom kunci**: `address_id` (PK), `user_id` (FK->users).
- **Kolom penting**: `address_line`, `province/city/district/subdistrict`, `postal_code`, `latitude`, `longitude`, `is_default`, `deleted_at`.

---

## Store Related

### stores
- **Fungsi**: Profil toko milik user.
- **Kolom kunci**: `store_id` (PK), `user_id` (FK->users), `address_id` (FK->user_addresses), `slug` (UNIQUE).
- **Kolom penting**: `is_active`, `is_verified`, `rating_average`, `review_count`, `deleted_at`.

### store_about_pages
- **Fungsi**: Halaman "tentang toko" (profil publik).
- **Kolom kunci**: `about_id` (PK), `store_id` (FK->stores, UNIQUE per store).
- **Kolom penting**: `title`, `content`.

### reply_templates
- **Fungsi**: Template balasan CS toko.
- **Kolom kunci**: `template_id` (PK), `store_id` (FK->stores).
- **Kolom penting**: `title`, `content`, `is_active`, `sort_order`.

---

## Product Related

### products
- **Fungsi**: Master produk.
- **Kolom kunci**: `product_id` (PK), `store_id` (FK->stores), `category_id` (FK->categories), `slug` (UNIQUE), `store_id+sku` (UNIQUE).
- **Kolom penting**: `product_type` enum('marketplace','classified'), `price`, `stock_quantity`, `sku`, `condition`, `brand`, `weight_gram`, `length_mm/width_mm/height_mm`, `is_preorder`, `preorder_days`, `min_order_quantity`, `max_order_quantity`, `status` ('draft','active','inactive','banned'), metrik (`view_count`,`sold_count`,`rating_average`,`review_count`), `deleted_at`.
- **Catatan**: Constraint untuk harga, stok, rating, preorder, dan order qty.

### product_images
- **Fungsi**: Gambar produk.
- **Kolom kunci**: `image_id` (PK), `product_id` (FK->products).
- **Kolom penting**: `url`, `alt_text`, `sort_order`, `is_primary`.

### product_variant_attributes
- **Fungsi**: Atribut variasi (mis. Warna, Ukuran) per produk.
- **Kolom kunci**: `attribute_id` (PK), `product_id` (FK->products).
- **Kolom penting**: `attribute_name`, `sort_order`.

### product_variant_attribute_options
- **Fungsi**: Opsi untuk setiap atribut (mis. Merah, Biru).
- **Kolom kunci**: `option_id` (PK), `attribute_id` (FK->product_variant_attributes).
- **Kolom penting**: `option_value`, `sort_order`.

### product_skus
- **Fungsi**: SKU turunan produk (kombinasi opsi).
- **Kolom kunci**: `sku_id` (PK), `product_id` (FK->products), `(product_id, sku_code)` (UNIQUE).
- **Kolom penting**: `sku_code`, `price`, `stock_quantity`, `weight_gram`, `length_mm/width_mm/height_mm`, `image_url`.

### product_sku_options
- **Fungsi**: Pemetaan SKU ke opsi atribut (SKU -> sekumpulan option_id).
- **Kolom kunci**: `sku_option_id` (PK), `sku_id` (FK->product_skus), `option_id` (FK->product_variant_attribute_options), UNIQUE per kombinasi.

### product_promotions
- **Fungsi**: Promosi produk (featured/discount/flash_sale/buy_get).
- **Kolom kunci**: `promotion_id` (PK), `product_id` (FK->products), `store_id` (FK->stores).
- **Kolom penting**: `promotion_type`, `discount_percentage`, `discount_amount`, periode aktif, `is_active`.

---

## Cart Related

### carts
- **Fungsi**: Keranjang belanja per user.
- **Kolom kunci**: `cart_id` (PK), `user_id` (FK->users).
- **Kolom penting**: `shipping_address_id` (FK->user_addresses, alamat pengiriman terpilih).

### cart_items
- **Fungsi**: Item di keranjang.
- **Kolom kunci**: `cart_item_id` (PK), `cart_id` (FK->carts), `product_id` (FK->products), `sku_id` (FK->product_skus, opsional).
- **Kolom penting**: `quantity`, `unit_price`, `is_selected` (item terpilih untuk checkout).

### cart_shipping_selections
- **Fungsi**: Pilihan layanan pengiriman per toko dalam suatu cart.
- **Kolom kunci**: `shipping_selection_id` (PK), `cart_id` (FK->carts), `store_id` (FK->stores), UNIQUE per (cart_id, store_id).
- **Kolom penting**: `courier_code`, `service_code`, `service_name`, `etd_min_days`, `etd_max_days`, `shipping_cost`.

### cart_vouchers
- **Fungsi**: Voucher yang terpasang pada cart.
- **Kolom kunci**: `cart_voucher_id` (PK), `cart_id` (FK->carts), `voucher_id` (FK->vouchers), UNIQUE per (cart_id, voucher_id).
- **Kolom penting**: `discount_amount` (nominal diskon yang diterapkan saat ini).

---

## Order Related

### orders
- **Fungsi**: Header pesanan.
- **Kolom kunci**: `order_id` (PK), `order_number` (UNIQUE), `user_id` (FK->users), `store_id` (FK->stores), `shipping_address_id` (FK->user_addresses).
- **Kolom penting**: `status` (lifecycle order), `payment_status`, `subtotal_amount`, `shipping_cost`, `voucher_discount`, `total_amount`, `currency`, waktu status (`paid_at`, `shipped_at`, `delivered_at`, `cancelled_at`), `cancellation_reason`, `notes`.

### order_items
- **Fungsi**: Rincian item pada order.
- **Kolom kunci**: `order_item_id` (PK), `order_id` (FK->orders), `product_id` (FK->products), `sku_id` (FK->product_skus, opsional).
- **Kolom penting**: `quantity`, `unit_price`, `total_price` (kolom terhitung: quantity * unit_price).

### order_shipments
- **Fungsi**: Informasi pengiriman untuk order.
- **Kolom kunci**: `shipment_id` (PK), `order_id` (FK->orders, UNIQUE per order).
- **Kolom penting**: `courier_code`, `service_code`, `service_name`, `tracking_number`, `etd_min_days`, `etd_max_days`, `shipping_cost`, `shipped_at`, `delivered_at`.

### order_status_logs
- **Fungsi**: Riwayat perubahan status order.
- **Kolom kunci**: `status_log_id` (PK), `order_id` (FK->orders).
- **Kolom penting**: `old_status`, `new_status`, `changed_by` enum('system','customer','seller','admin'), `notes`.

---

## Payment Related

### payments
- **Fungsi**: Data pembayaran untuk order.
- **Kolom kunci**: `payment_id` (PK), `order_id` (FK->orders, UNIQUE, 1:1 per order).
- **Kolom penting**: `provider` (midtrans/manual/bank_transfer/ewallet/cod), `payment_type`, `payment_status`, `gross_amount`, `transaction_id`, `transaction_time`, `expiry_time`, detail VA/bank/QR, `raw_response` (JSON), cap waktu `paid_at/failed_at/refunded_at`.

### payment_notifications
- **Fungsi**: Log notifikasi pembayaran (webhook/callback) untuk audit.
- **Kolom kunci**: `notification_id` (PK), `payment_id` (FK->payments, nullable).
- **Kolom penting**: `order_id` (string dari provider), `transaction_status`, `fraud_status`, `status_code`, `signature_key`, `raw_payload` (JSON), `is_processed`, `processed_at`.

---

## Voucher Related

### vouchers
- **Fungsi**: Master voucher (global atau milik store tertentu).
- **Kolom kunci**: `voucher_id` (PK), `store_id` (FK->stores, nullable), `code` (kode tebus), `name`.
- **Kolom penting**: `type` ('fixed'/'percentage'), `value`, `min_purchase_amount`, `max_discount_amount`, limit penggunaan (`usage_limit`, `usage_count`, `user_usage_limit`), periode (`started_at`–`expired_at`), `is_active`.
- **Constraint bisnis**: Persentase `<= 100`, nilai `> 0`, periode valid, limit >= 0.

### voucher_products
- **Fungsi**: Relasi voucher ke produk (whitelist/daftar spesifik yang eligible).
- **Kolom kunci**: `voucher_product_id` (PK), `voucher_id` (FK->vouchers), `product_id` (FK->products), UNIQUE per (voucher_id, product_id).

### voucher_usages
- **Fungsi**: Log pemakaian voucher oleh user dan order.
- **Kolom kunci**: `voucher_usage_id` (PK), `voucher_id` (FK->vouchers), `user_id` (FK->users), `order_id` (FK->orders, nullable, UNIQUE per voucher_id+order_id).
- **Kolom penting**: `discount_amount`, `used_at`.

---

## Diagram Relasi (teks)
- users 1—N stores, user_addresses, carts, orders, voucher_usages
- stores 1—N products, reply_templates, product_promotions, cart_shipping_selections, orders
- products 1—N product_images, product_variant_attributes, product_skus, product_promotions, cart_items, order_items, voucher_products
- product_variant_attributes 1—N product_variant_attribute_options
- product_skus 1—N product_sku_options; cart_items/order_items dapat refer ke sku_id
- carts 1—N cart_items, cart_shipping_selections, cart_vouchers
- orders 1—N order_items, order_status_logs; 1—1 payments, order_shipments
- vouchers 1—N voucher_products, voucher_usages; N—N products via voucher_products

## Catatan Praktik Baik
- Selalu sertakan filter `deleted_at IS NULL` untuk tabel yang memilikinya.
- Gunakan index yang tersedia untuk query pencarian/filter (role/status/created_at/type).
- Pastikan validasi aplikasi mengikuti constraint DB (CHECK/ENUM/UNIQUE/FK) untuk menghindari error runtime.


