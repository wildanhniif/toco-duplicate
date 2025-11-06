-- ============================================================
-- Script ALTER untuk update tabel vouchers dan buat tabel voucher_products
-- JALANKAN DI phpMyAdmin - Kompatibel dengan MySQL/MariaDB
-- Script ini AMAN untuk database yang sudah ada (tidak menghapus data)
-- ============================================================

-- ============================================================
-- LANGKAH 1: UPDATE TABEL vouchers - Tambah kolom baru
-- ============================================================
-- Jalankan satu per satu di phpMyAdmin

-- 1.1. Tambah kolom store_id
ALTER TABLE `vouchers` 
ADD COLUMN `store_id` int(10) UNSIGNED NULL AFTER `voucher_id`;

-- 1.2. Tambah kolom voucher_type
ALTER TABLE `vouchers` 
ADD COLUMN `voucher_type` enum('discount','free_shipping') NULL COMMENT 'discount: diskon, free_shipping: gratis ongkir' AFTER `code`;

-- 1.3. Tambah kolom title
ALTER TABLE `vouchers` 
ADD COLUMN `title` varchar(255) NULL COMMENT 'judul promosi' AFTER `min_order_amount`;

-- 1.4. Tambah kolom description
ALTER TABLE `vouchers` 
ADD COLUMN `description` text NULL COMMENT 'deskripsi promosi' AFTER `title`;

-- 1.5. Tambah kolom target
ALTER TABLE `vouchers` 
ADD COLUMN `target` enum('public','private') NOT NULL DEFAULT 'public' COMMENT 'public: publik, private: khusus' AFTER `description`;

-- 1.6. Tambah kolom applicable_to
ALTER TABLE `vouchers` 
ADD COLUMN `applicable_to` enum('all_products','specific_products') NOT NULL DEFAULT 'all_products' COMMENT 'semua produk atau produk tertentu' AFTER `target`;

-- 1.7. Tambah kolom min_discount
ALTER TABLE `vouchers` 
ADD COLUMN `min_discount` decimal(15,2) NULL COMMENT 'minimum diskon untuk persentase' AFTER `max_discount`;

-- 1.8. Update kolom start_at dan end_at menjadi NOT NULL
-- PERHATIAN: Pastikan semua voucher sudah punya start_at dan end_at sebelum menjalankan ini!
ALTER TABLE `vouchers` 
MODIFY COLUMN `start_at` datetime NOT NULL COMMENT 'periode dimulai',
MODIFY COLUMN `end_at` datetime NOT NULL COMMENT 'periode berakhir';

-- 1.9. Tambah index untuk store_id
ALTER TABLE `vouchers` 
ADD INDEX `idx_v_store` (`store_id`);

-- 1.10. Tambah index untuk start_at dan end_at
ALTER TABLE `vouchers` 
ADD INDEX `idx_v_start_end` (`start_at`,`end_at`);

-- ============================================================
-- LANGKAH 2: BUAT TABEL voucher_products (jika belum ada)
-- ============================================================

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

-- ============================================================
-- LANGKAH 3: UPDATE DATA YANG SUDAH ADA (Jika perlu)
-- ============================================================
-- Jalankan query ini jika ada voucher yang sudah ada tapi kolom baru masih NULL

-- 3.1. Update store_id untuk voucher yang sudah ada
-- PERHATIAN: Sesuaikan store_id sesuai kebutuhan Anda
-- Jika Anda tidak tahu store_id, cek dulu di tabel stores
-- Contoh: UPDATE vouchers SET store_id = 1 WHERE store_id IS NULL;

-- 3.2. Update voucher_type berdasarkan type yang sudah ada
-- Jika type = 'percent' atau 'fixed', set voucher_type = 'discount'
UPDATE `vouchers` 
SET `voucher_type` = 'discount' 
WHERE `voucher_type` IS NULL 
AND (`type` = 'percent' OR `type` = 'fixed');

-- 3.3. Update title jika masih NULL (gunakan code sebagai title sementara)
UPDATE `vouchers` 
SET `title` = `code` 
WHERE `title` IS NULL OR `title` = '';

-- 3.4. Pastikan start_at dan end_at sudah diisi
-- Jika ada yang NULL, update manual sesuai kebutuhan
-- Contoh: UPDATE vouchers SET start_at = '2025-01-01 00:00:00', end_at = '2025-12-31 23:59:59' WHERE start_at IS NULL;

-- ============================================================
-- LANGKAH 4: TAMBAH FOREIGN KEY CONSTRAINTS
-- ============================================================
-- Jalankan setelah memastikan semua data sudah benar

-- 4.1. Foreign key untuk voucher_products -> vouchers
ALTER TABLE `voucher_products` 
ADD CONSTRAINT `fk_vp_voucher` 
FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`voucher_id`) ON DELETE CASCADE;

-- 4.2. Foreign key untuk voucher_products -> products
ALTER TABLE `voucher_products` 
ADD CONSTRAINT `fk_vp_product` 
FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE;

-- 4.3. Foreign key untuk vouchers -> stores
-- PERHATIAN: Pastikan semua voucher sudah punya store_id yang valid!
ALTER TABLE `vouchers` 
ADD CONSTRAINT `fk_v_store` 
FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON DELETE CASCADE;

-- ============================================================
-- CATATAN PENTING:
-- ============================================================
-- 1. Jika error "Duplicate column name" saat menambah kolom,
--    berarti kolom sudah ada, skip query tersebut.
--
-- 2. Jika error "Duplicate key name" saat menambah index,
--    berarti index sudah ada, skip query tersebut.
--
-- 3. Jika error "Cannot add foreign key constraint" saat menambah FK,
--    pastikan:
--    - Tabel stores dan products sudah ada
--    - Semua voucher sudah punya store_id yang valid
--    - Data di voucher_products sudah sesuai dengan voucher_id dan product_id yang ada
--
-- 4. Jika start_at atau end_at masih NULL untuk voucher yang sudah ada,
--    UPDATE manual dulu sebelum mengubah menjadi NOT NULL
--
-- 5. Jika store_id masih NULL, UPDATE manual dengan store_id yang sesuai
--    sebelum menambah foreign key constraint
-- ============================================================


