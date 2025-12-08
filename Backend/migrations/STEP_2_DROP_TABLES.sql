-- ============================================
-- STEP 2: HAPUS TABLE YANG GAGAL (JIKA ADA)
-- ============================================
-- Copy script ini ke phpMyAdmin dan jalankan

-- Hapus dalam urutan yang benar (child dulu, parent terakhir)
DROP TABLE IF EXISTS store_courier_services;
DROP TABLE IF EXISTS courier_weight_pricing;
DROP TABLE IF EXISTS courier_distance_pricing;
DROP TABLE IF EXISTS store_courier_config;
DROP TABLE IF EXISTS courier_service_types;
DROP TABLE IF EXISTS courier_services;

-- Verifikasi sudah terhapus
SHOW TABLES LIKE '%courier%';
-- Hasilnya harus kosong (0 rows)
