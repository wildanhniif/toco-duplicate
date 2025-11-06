# Panduan Update Database Voucher di XAMPP/phpMyAdmin

## Cara Menjalankan Script ALTER

### Langkah 1: Buka phpMyAdmin
1. Buka browser dan akses `http://localhost/phpmyadmin`
2. Pilih database Anda (misalnya: `toco_clone`)
3. Klik tab **SQL**

### Langkah 2: Jalankan Query Per Bagian

**⚠️ PENTING:** Jalankan query **satu per satu** atau per kelompok, jangan semua sekaligus untuk menghindari error.

---

## BAGIAN 1: Tambah Kolom ke Tabel vouchers

### 1.1 Tambah kolom `store_id`
```sql
ALTER TABLE `vouchers` 
ADD COLUMN `store_id` int(10) UNSIGNED NULL AFTER `voucher_id`;
```

**Jika error:** "Duplicate column name" → Skip (kolom sudah ada)

---

### 1.2 Tambah kolom `voucher_type`
```sql
ALTER TABLE `vouchers` 
ADD COLUMN `voucher_type` enum('discount','free_shipping') NULL COMMENT 'discount: diskon, free_shipping: gratis ongkir' AFTER `code`;
```

**Jika error:** "Duplicate column name" → Skip (kolom sudah ada)

---

### 1.3 Tambah kolom `title`
```sql
ALTER TABLE `vouchers` 
ADD COLUMN `title` varchar(255) NULL COMMENT 'judul promosi' AFTER `min_order_amount`;
```

**Jika error:** "Duplicate column name" → Skip (kolom sudah ada)

---

### 1.4 Tambah kolom `description`
```sql
ALTER TABLE `vouchers` 
ADD COLUMN `description` text NULL COMMENT 'deskripsi promosi' AFTER `title`;
```

**Jika error:** "Duplicate column name" → Skip (kolom sudah ada)

---

### 1.5 Tambah kolom `target`
```sql
ALTER TABLE `vouchers` 
ADD COLUMN `target` enum('public','private') NOT NULL DEFAULT 'public' COMMENT 'public: publik, private: khusus' AFTER `description`;
```

**Jika error:** "Duplicate column name" → Skip (kolom sudah ada)

---

### 1.6 Tambah kolom `applicable_to`
```sql
ALTER TABLE `vouchers` 
ADD COLUMN `applicable_to` enum('all_products','specific_products') NOT NULL DEFAULT 'all_products' COMMENT 'semua produk atau produk tertentu' AFTER `target`;
```

**Jika error:** "Duplicate column name" → Skip (kolom sudah ada)

---

### 1.7 Tambah kolom `min_discount`
```sql
ALTER TABLE `vouchers` 
ADD COLUMN `min_discount` decimal(15,2) NULL COMMENT 'minimum diskon untuk persentase' AFTER `max_discount`;
```

**Jika error:** "Duplicate column name" → Skip (kolom sudah ada)

---

### 1.8 Update kolom `start_at` dan `end_at` menjadi NOT NULL
**⚠️ PENTING:** Pastikan semua voucher sudah punya `start_at` dan `end_at` sebelum menjalankan ini!

```sql
ALTER TABLE `vouchers` 
MODIFY COLUMN `start_at` datetime NOT NULL COMMENT 'periode dimulai',
MODIFY COLUMN `end_at` datetime NOT NULL COMMENT 'periode berakhir';
```

**Jika error:** "Invalid default value" atau "Column cannot be null"
→ Ada voucher yang `start_at` atau `end_at` masih NULL
→ **SOLUSI:** Update manual dulu:
```sql
-- Cek voucher yang NULL
SELECT voucher_id, code, start_at, end_at FROM vouchers WHERE start_at IS NULL OR end_at IS NULL;

-- Update manual (sesuaikan voucher_id dan tanggalnya)
UPDATE vouchers 
SET start_at = '2025-01-01 00:00:00', end_at = '2025-12-31 23:59:59' 
WHERE voucher_id = X AND (start_at IS NULL OR end_at IS NULL);
```

---

### 1.9 Tambah index untuk `store_id`
```sql
ALTER TABLE `vouchers` 
ADD INDEX `idx_v_store` (`store_id`);
```

**Jika error:** "Duplicate key name" → Skip (index sudah ada)

---

### 1.10 Tambah index untuk `start_at` dan `end_at`
```sql
ALTER TABLE `vouchers` 
ADD INDEX `idx_v_start_end` (`start_at`,`end_at`);
```

**Jika error:** "Duplicate key name" → Skip (index sudah ada)

---

## BAGIAN 2: Buat Tabel voucher_products

### 2.1 Buat tabel `voucher_products`
```sql
CREATE TABLE IF NOT EXISTS `voucher_products` (
  `voucher_product_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `voucher_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`voucher_product_id`),
  UNIQUE KEY `uniq_vp_voucher_product` (`voucher_id`,`product_id`),
  KEY `idx_vp_voucher` (`voucher_id`),
  KEY `idx_vp_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Jika error:** "Table already exists" → Skip (tabel sudah ada)

---

## BAGIAN 3: Update Data yang Sudah Ada (Jika Perlu)

### 3.1 Update `store_id` untuk voucher yang sudah ada
**⚠️ PENTING:** Ini diperlukan jika ada voucher lama yang `store_id` masih NULL.

**Cek dulu:**
```sql
SELECT voucher_id, code, store_id FROM vouchers WHERE store_id IS NULL;
```

**Update manual (sesuaikan store_id sesuai kebutuhan Anda):**
```sql
-- Cek store_id yang ada di tabel stores
SELECT store_id, name FROM stores LIMIT 10;

-- Update voucher dengan store_id tertentu
-- GANTI X dengan store_id yang sesuai
UPDATE vouchers 
SET store_id = 1 
WHERE store_id IS NULL;
```

---

### 3.2 Update `voucher_type` berdasarkan `type` yang sudah ada
```sql
UPDATE `vouchers` 
SET `voucher_type` = 'discount' 
WHERE `voucher_type` IS NULL 
AND (`type` = 'percent' OR `type` = 'fixed');
```

---

### 3.3 Update `title` jika masih NULL
```sql
UPDATE `vouchers` 
SET `title` = `code` 
WHERE `title` IS NULL OR `title` = '';
```

---

## BAGIAN 4: Tambah Foreign Key Constraints

**⚠️ PENTING:** Pastikan semua data sudah benar sebelum menambah foreign key!

### 4.1 Foreign key untuk `voucher_products` -> `vouchers`
```sql
ALTER TABLE `voucher_products` 
ADD CONSTRAINT `fk_vp_voucher` 
FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`voucher_id`) ON DELETE CASCADE;
```

**Jika error:** "Cannot add foreign key constraint"
→ Pastikan semua `voucher_id` di `voucher_products` ada di tabel `vouchers`
→ Jika tidak ada, hapus data yang tidak valid:
```sql
-- Hapus voucher_products yang voucher_id-nya tidak ada di vouchers
DELETE FROM voucher_products 
WHERE voucher_id NOT IN (SELECT voucher_id FROM vouchers);
```

---

### 4.2 Foreign key untuk `voucher_products` -> `products`
```sql
ALTER TABLE `voucher_products` 
ADD CONSTRAINT `fk_vp_product` 
FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE;
```

**Jika error:** "Cannot add foreign key constraint"
→ Pastikan semua `product_id` di `voucher_products` ada di tabel `products`
→ Jika tidak ada, hapus data yang tidak valid:
```sql
-- Hapus voucher_products yang product_id-nya tidak ada di products
DELETE FROM voucher_products 
WHERE product_id NOT IN (SELECT product_id FROM products);
```

---

### 4.3 Foreign key untuk `vouchers` -> `stores`
**⚠️ PENTING:** Pastikan semua voucher sudah punya `store_id` yang valid!

```sql
ALTER TABLE `vouchers` 
ADD CONSTRAINT `fk_v_store` 
FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE;
```

**Jika error:** "Cannot add foreign key constraint"
→ Pastikan semua `store_id` di `vouchers` ada di tabel `stores`
→ Jika ada yang NULL, update dulu:
```sql
-- Cek voucher yang store_id-nya tidak valid
SELECT v.voucher_id, v.code, v.store_id 
FROM vouchers v 
WHERE v.store_id NOT IN (SELECT store_id FROM stores) 
   OR v.store_id IS NULL;

-- Update manual dengan store_id yang valid
UPDATE vouchers 
SET store_id = 1 
WHERE store_id IS NULL OR store_id NOT IN (SELECT store_id FROM stores);
```

---

## Troubleshooting

### Error "Duplicate column name"
→ **Solusi:** Kolom sudah ada, skip query tersebut.

### Error "Duplicate key name"
→ **Solusi:** Index sudah ada, skip query tersebut.

### Error "Cannot add foreign key constraint"
→ **Solusi:** 
1. Cek data yang tidak valid (misalnya `store_id` yang tidak ada di tabel `stores`)
2. Update atau hapus data yang tidak valid
3. Coba lagi tambah foreign key

### Error "Column cannot be null"
→ **Solusi:**
1. Cek kolom yang masih NULL
2. Update manual dengan nilai default yang sesuai
3. Coba lagi modify kolom menjadi NOT NULL

### Error "Table already exists"
→ **Solusi:** Tabel sudah ada, skip query tersebut.

---

## Verifikasi Setelah Update

### Cek struktur tabel vouchers
```sql
DESCRIBE vouchers;
```

**Pastikan kolom berikut ada:**
- `store_id`
- `voucher_type`
- `title`
- `description`
- `target`
- `applicable_to`
- `min_discount`

### Cek tabel voucher_products
```sql
DESCRIBE voucher_products;
```

**Pastikan tabel sudah dibuat dengan kolom:**
- `voucher_product_id` (PRIMARY KEY)
- `voucher_id`
- `product_id`
- `created_at`

### Cek foreign keys
```sql
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'toco_clone'  -- GANTI dengan nama database Anda
    AND TABLE_NAME IN ('vouchers', 'voucher_products')
    AND REFERENCED_TABLE_NAME IS NOT NULL;
```

**Pastikan foreign keys berikut ada:**
- `fk_v_store` (vouchers -> stores)
- `fk_vp_voucher` (voucher_products -> vouchers)
- `fk_vp_product` (voucher_products -> products)

---

## Setelah Update Selesai

1. **Test backend:** Jalankan server dan test endpoint voucher
2. **Cek error log:** Jika ada error, cek console/log backend
3. **Update aplikasi:** Pastikan aplikasi frontend menggunakan field baru

---

**Catatan:** Jika ada masalah saat menjalankan script, screenshot error-nya dan kirim ke saya untuk dibantu troubleshooting.


