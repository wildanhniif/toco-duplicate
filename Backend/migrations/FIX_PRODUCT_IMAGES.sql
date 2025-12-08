-- ============================================
-- FIX PRODUCT_IMAGES TABLE STRUCTURE
-- ============================================
-- Run this in phpMyAdmin to fix column names

-- First check current structure
DESCRIBE product_images;

-- If the table has 'image_url' instead of 'url', run this:
-- ALTER TABLE product_images CHANGE COLUMN image_url url VARCHAR(500) NOT NULL;

-- If the table has 'display_order' instead of 'sort_order', run this:
-- ALTER TABLE product_images CHANGE COLUMN display_order sort_order INT DEFAULT 0;

-- Add alt_text if missing:
-- ALTER TABLE product_images ADD COLUMN alt_text VARCHAR(255) NULL AFTER url;

-- ============================================
-- VERIFY COURIER SERVICE DATA EXISTS
-- ============================================
SELECT 'Courier Services:' as info;
SELECT COUNT(*) as total FROM courier_services;
SELECT * FROM courier_services;

SELECT 'Courier Service Types:' as info;
SELECT COUNT(*) as total FROM courier_service_types;

-- If empty, run STEP_5_INSERT_DATA.sql to seed courier data

-- ============================================
-- CHECK PRODUCT IMAGES
-- ============================================
SELECT 'Product Images Count:' as info;
SELECT COUNT(*) as total FROM product_images;

SELECT 'Sample Product Images:' as info;
SELECT pi.*, p.name as product_name 
FROM product_images pi 
JOIN products p ON p.product_id = pi.product_id 
LIMIT 10;

-- ============================================
-- CHECK STORE 34 EXISTS
-- ============================================
SELECT 'Store 34:' as info;
SELECT store_id, name, city FROM stores WHERE store_id = 34;
