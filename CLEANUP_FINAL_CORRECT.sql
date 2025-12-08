-- ============================================
-- 🧹 FINAL CLEANUP - CORRECT DATABASE NAME
-- ============================================
-- Database: toco_clone (NOT blibli!)
-- Fixed for actual table structure
-- ============================================

USE toco_clone;

-- ============================================
-- STEP 1: CHECK CURRENT LOCALHOST IMAGES
-- ============================================
SELECT '=== CHECKING LOCALHOST IMAGES ===' as info;

-- Product images
SELECT COUNT(*) as product_images_with_localhost 
FROM product_images 
WHERE url LIKE '%localhost%' OR url LIKE '/uploads/%';

-- Store images
SELECT COUNT(*) as stores_with_localhost_profile
FROM stores 
WHERE profile_image_url IS NOT NULL 
  AND (profile_image_url LIKE '%localhost%' OR profile_image_url LIKE '/uploads/%');

SELECT COUNT(*) as stores_with_localhost_background
FROM stores 
WHERE background_image_url IS NOT NULL 
  AND (background_image_url LIKE '%localhost%' OR background_image_url LIKE '/uploads/%');

-- Show sample data before cleanup
SELECT 'Sample product images:' as info;
SELECT product_id, url FROM product_images LIMIT 5;

-- ============================================
-- STEP 2: CLEANUP PRODUCT IMAGES
-- ============================================
SELECT '=== DELETING LOCALHOST PRODUCT IMAGES ===' as info;

DELETE FROM product_images 
WHERE url LIKE '%localhost%' OR url LIKE '/uploads/%';

SELECT CONCAT('✅ Deleted ', ROW_COUNT(), ' product images') as result;

-- ============================================
-- STEP 3: CLEANUP STORE IMAGES
-- ============================================
SELECT '=== CLEARING LOCALHOST STORE IMAGES ===' as info;

UPDATE stores 
SET profile_image_url = NULL 
WHERE profile_image_url LIKE '%localhost%' OR profile_image_url LIKE '/uploads/%';

SELECT CONCAT('✅ Cleared ', ROW_COUNT(), ' store profile images') as result;

UPDATE stores 
SET background_image_url = NULL 
WHERE background_image_url LIKE '%localhost%' OR background_image_url LIKE '/uploads/%';

SELECT CONCAT('✅ Cleared ', ROW_COUNT(), ' store background images') as result;

-- ============================================
-- STEP 4: VERIFICATION
-- ============================================
SELECT '=== CLEANUP VERIFICATION ===' as info;

SELECT COUNT(*) as remaining_localhost_product_images
FROM product_images 
WHERE url LIKE '%localhost%' OR url LIKE '/uploads/%';

SELECT COUNT(*) as remaining_localhost_store_images
FROM stores 
WHERE (profile_image_url LIKE '%localhost%' OR profile_image_url LIKE '/uploads/%')
   OR (background_image_url LIKE '%localhost%' OR background_image_url LIKE '/uploads/%');

-- Show sample of cleaned data
SELECT 'Sample after cleanup (should be empty or NULL):' as info;
SELECT product_id, url FROM product_images LIMIT 5;
SELECT store_id, profile_image_url, background_image_url FROM stores LIMIT 5;

-- ============================================
-- FINAL STATUS
-- ============================================
SELECT '✅ DATABASE CLEANUP COMPLETE!' as status;
SELECT 'All localhost image URLs have been removed.' as message;
SELECT 'Next: Restart backend server and test upload.' as next_step;
