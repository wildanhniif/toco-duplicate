-- ============================================
-- 🧹 QUICK CLEANUP - Run This in phpMyAdmin
-- ============================================
-- This will remove ALL localhost image URLs from database
-- Run this, then restart backend server
-- ============================================

USE blibli;

-- Show current localhost images
SELECT '=== CURRENT LOCALHOST IMAGES ===' as info;
SELECT COUNT(*) as product_images_count FROM product_images WHERE url LIKE '%localhost%' OR url LIKE '/uploads/%';
SELECT COUNT(*) as store_images_count FROM stores WHERE profile_image_url LIKE '%localhost%' OR profile_image_url LIKE '/uploads/%' OR background_image_url LIKE '%localhost%' OR background_image_url LIKE '/uploads/%';

-- Delete localhost product images
DELETE FROM product_images WHERE url LIKE '%localhost%' OR url LIKE '/uploads/%';

-- Clear localhost store images
UPDATE stores SET profile_image_url = NULL WHERE profile_image_url LIKE '%localhost%' OR profile_image_url LIKE '/uploads/%';
UPDATE stores SET background_image_url = NULL WHERE background_image_url LIKE '%localhost%' OR background_image_url LIKE '/uploads/%';

-- Clear localhost about thumbnails
UPDATE store_about_pages SET thumbnail_url = NULL WHERE thumbnail_url LIKE '%localhost%' OR thumbnail_url LIKE '/uploads/%';

-- Verify cleanup
SELECT '=== CLEANUP COMPLETE ===' as info;
SELECT COUNT(*) as remaining_localhost_images FROM product_images WHERE url LIKE '%localhost%' OR url LIKE '/uploads/%';
SELECT 'All localhost URLs have been removed!' as status;
