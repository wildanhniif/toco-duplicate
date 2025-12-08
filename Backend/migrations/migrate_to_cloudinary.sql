-- Migration Script: Update Local URLs to Cloudinary
-- Run this after you've set up Cloudinary credentials
-- This will mark old localhost URLs for cleanup

-- ============================================
-- STEP 1: Check current local image URLs
-- ============================================
SELECT 'Product Images with localhost URLs:' as info;
SELECT product_id, url 
FROM product_images 
WHERE url LIKE 'http://localhost%' OR url LIKE '/uploads/%';

SELECT 'Store Images with localhost URLs:' as info;
SELECT store_id, profile_image_url, background_image_url 
FROM stores 
WHERE profile_image_url LIKE 'http://localhost%' 
   OR profile_image_url LIKE '/uploads/%'
   OR background_image_url LIKE 'http://localhost%' 
   OR background_image_url LIKE '/uploads/%';

SELECT 'Store About Pages with localhost URLs:' as info;
SELECT about_id, store_id, thumbnail_url 
FROM store_about_pages 
WHERE thumbnail_url LIKE 'http://localhost%' OR thumbnail_url LIKE '/uploads/%';

-- ============================================
-- STEP 2: OPTION A - Delete all local images
-- (Recommended: User will re-upload to Cloudinary)
-- ============================================

-- Uncomment below to DELETE all product images with localhost URLs
-- DELETE FROM product_images 
-- WHERE url LIKE 'http://localhost%' OR url LIKE '/uploads/%';

-- Uncomment below to CLEAR store images with localhost URLs
-- UPDATE stores 
-- SET profile_image_url = NULL, background_image_url = NULL
-- WHERE profile_image_url LIKE 'http://localhost%' 
--    OR profile_image_url LIKE '/uploads/%'
--    OR background_image_url LIKE 'http://localhost%' 
--    OR background_image_url LIKE '/uploads/%';

-- Uncomment below to CLEAR store about thumbnails with localhost URLs
-- UPDATE store_about_pages 
-- SET thumbnail_url = NULL
-- WHERE thumbnail_url LIKE 'http://localhost%' OR thumbnail_url LIKE '/uploads/%';

-- ============================================
-- STEP 3: Verify cleanup (Run after uncomment)
-- ============================================
SELECT 'Remaining Product Images:' as info;
SELECT COUNT(*) as count FROM product_images WHERE url IS NOT NULL;

SELECT 'Stores with images:' as info;
SELECT COUNT(*) as count FROM stores 
WHERE profile_image_url IS NOT NULL OR background_image_url IS NOT NULL;

SELECT 'Store About Pages with thumbnails:' as info;
SELECT COUNT(*) as count FROM store_about_pages WHERE thumbnail_url IS NOT NULL;
