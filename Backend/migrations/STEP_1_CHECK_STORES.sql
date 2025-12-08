-- ============================================
-- STEP 1: CEK TABLE STORES
-- ============================================
-- Copy script ini ke phpMyAdmin dan jalankan

-- 1. Cek apakah table stores ada
SHOW TABLES LIKE 'stores';

-- 2. Cek struktur table stores (PRIMARY KEY nya apa)
DESCRIBE stores;

-- 3. Cek data yang ada
SELECT store_id, user_id, name FROM stores LIMIT 5;
