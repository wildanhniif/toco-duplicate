-- ============================================
-- STEP 4: TAMBAH FOREIGN KEYS
-- ============================================
-- Copy script ini ke phpMyAdmin dan jalankan SATU PER SATU
-- Jika ada yang error, skip dan lanjut ke berikutnya

-- FK 1: courier_service_types -> courier_services
ALTER TABLE courier_service_types
ADD CONSTRAINT fk_courier_service_types_service
FOREIGN KEY (courier_service_id) 
REFERENCES courier_services(id) 
ON DELETE CASCADE;

-- FK 2: courier_distance_pricing -> store_courier_config
ALTER TABLE courier_distance_pricing
ADD CONSTRAINT fk_distance_pricing_config
FOREIGN KEY (store_courier_config_id) 
REFERENCES store_courier_config(id) 
ON DELETE CASCADE;

-- FK 3: courier_weight_pricing -> store_courier_config
ALTER TABLE courier_weight_pricing
ADD CONSTRAINT fk_weight_pricing_config
FOREIGN KEY (store_courier_config_id) 
REFERENCES store_courier_config(id) 
ON DELETE CASCADE;

-- FK 4: store_courier_config -> stores (YANG BERMASALAH)
-- CEK DULU: Pastikan column store_id di stores adalah INT dan PRIMARY KEY atau UNIQUE
ALTER TABLE store_courier_config
ADD CONSTRAINT fk_store_courier_config_store
FOREIGN KEY (store_id) 
REFERENCES stores(store_id) 
ON DELETE CASCADE;

-- FK 5: store_courier_services -> stores (YANG BERMASALAH)
ALTER TABLE store_courier_services
ADD CONSTRAINT fk_store_courier_services_store
FOREIGN KEY (store_id) 
REFERENCES stores(store_id) 
ON DELETE CASCADE;

-- FK 6: store_courier_services -> courier_service_types
ALTER TABLE store_courier_services
ADD CONSTRAINT fk_store_courier_services_type
FOREIGN KEY (courier_service_type_id) 
REFERENCES courier_service_types(id) 
ON DELETE CASCADE;

-- Verifikasi FK berhasil dibuat
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME LIKE '%courier%'
AND REFERENCED_TABLE_NAME IS NOT NULL;
