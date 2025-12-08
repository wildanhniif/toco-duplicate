-- ============================================
-- 🧹 FIXED CLEANUP - Run This in phpMyAdmin
-- ============================================
-- Updated: Fixed column names for all tables
-- ============================================

USE blibli;

-- Show current localhost images
SELECT '=== CHECKING LOCALHOST IMAGES ===' as info;

-- Product images
SELECT COUNT(*) as product_images_with_localhost 
FROM product_images 
WHERE url LIKE '%localhost%' OR url LIKE '/uploads/%';

-- Store images (check if columns exist first)
SELECT COUNT(*) as stores_with_localhost 
FROM stores 
WHERE (profile_image_url IS NOT NULL AND (profile_image_url LIKE '%localhost%' OR profile_image_url LIKE '/uploads/%'))
   OR (background_image_url IS NOT NULL AND (background_image_url LIKE '%localhost%' OR background_image_url LIKE '/uploads/%'));

-- ============================================
-- CLEANUP PRODUCT IMAGES
-- ============================================
SELECT '=== DELETING LOCALHOST PRODUCT IMAGES ===' as info;

DELETE FROM product_images 
WHERE url LIKE '%localhost%' OR url LIKE '/uploads/%';

SELECT CONCAT('Deleted ', ROW_COUNT(), ' product images') as result;

-- ============================================
-- CLEANUP STORE IMAGES
-- ============================================
SELECT '=== CLEARING LOCALHOST STORE IMAGES ===' as info;

UPDATE stores 
SET profile_image_url = NULL 
WHERE profile_image_url LIKE '%localhost%' OR profile_image_url LIKE '/uploads/%';

SELECT CONCAT('Cleared ', ROW_COUNT(), ' store profile images') as result;

UPDATE stores 
SET background_image_url = NULL 
WHERE background_image_url LIKE '%localhost%' OR background_image_url LIKE '/uploads/%';

SELECT CONCAT('Cleared ', ROW_COUNT(), ' store background images') as result;

-- ============================================
-- CLEANUP STORE ABOUT PAGES (Only if table exists)
-- ============================================
-- Check table structure first, then uncomment the correct UPDATE statement

-- If column is named 'thumbnail_url':
-- UPDATE store_about_pages SET thumbnail_url = NULL WHERE thumbnail_url LIKE '%localhost%' OR thumbnail_url LIKE '/uploads/%';

-- If column is named 'thumbnail':
-- UPDATE store_about_pages SET thumbnail = NULL WHERE thumbnail LIKE '%localhost%' OR thumbnail LIKE '/uploads/%';

-- If column is named 'image_url':
-- UPDATE store_about_pages SET image_url = NULL WHERE image_url LIKE '%localhost%' OR image_url LIKE '/uploads/%';

-- ============================================
-- VERIFY CLEANUP
-- ============================================
SELECT '=== VERIFICATION ===' as info;

SELECT COUNT(*) as remaining_localhost_in_products 
FROM product_images 
WHERE url LIKE '%localhost%' OR url LIKE '/uploads/%';

SELECT COUNT(*) as remaining_localhost_in_stores 
FROM stores 
WHERE (profile_image_url LIKE '%localhost%' OR profile_image_url LIKE '/uploads/%')
   OR (background_image_url LIKE '%localhost%' OR background_image_url LIKE '/uploads/%');

SELECT '✅ CLEANUP COMPLETE!' as status;
