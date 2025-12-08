-- ============================================
-- CLEANUP SCRIPT: Remove Local Image References
-- WARNING: This will delete all localhost image URLs from database
-- Run this AFTER you've decided to fully migrate to Cloudinary
-- ============================================

-- Start transaction for safety
START TRANSACTION;

-- Show what will be deleted
SELECT '=== BEFORE CLEANUP ===' as status;

SELECT 'Product images to delete:' as info, COUNT(*) as count 
FROM product_images 
WHERE url LIKE 'http://localhost%' OR url LIKE '/uploads/%';

SELECT 'Store profile images to clear:' as info, COUNT(*) as count 
FROM stores 
WHERE profile_image_url LIKE 'http://localhost%' OR profile_image_url LIKE '/uploads/%';

SELECT 'Store background images to clear:' as info, COUNT(*) as count 
FROM stores 
WHERE background_image_url LIKE 'http://localhost%' OR background_image_url LIKE '/uploads/%';

SELECT 'Store about thumbnails to clear:' as info, COUNT(*) as count 
FROM store_about_pages 
WHERE thumbnail_url LIKE 'http://localhost%' OR thumbnail_url LIKE '/uploads/%';

-- ============================================
-- EXECUTE CLEANUP
-- ============================================

-- Delete product images with localhost URLs
DELETE FROM product_images 
WHERE url LIKE 'http://localhost%' OR url LIKE '/uploads/%';

-- Clear store profile images
UPDATE stores 
SET profile_image_url = NULL
WHERE profile_image_url LIKE 'http://localhost%' OR profile_image_url LIKE '/uploads/%';

-- Clear store background images
UPDATE stores 
SET background_image_url = NULL
WHERE background_image_url LIKE 'http://localhost%' OR background_image_url LIKE '/uploads/%';

-- Clear store about thumbnails
UPDATE store_about_pages 
SET thumbnail_url = NULL
WHERE thumbnail_url LIKE 'http://localhost%' OR thumbnail_url LIKE '/uploads/%';

-- Show results
SELECT '=== AFTER CLEANUP ===' as status;

SELECT 'Remaining product images with localhost:' as info, COUNT(*) as count 
FROM product_images 
WHERE url LIKE 'http://localhost%' OR url LIKE '/uploads/%';

SELECT 'Remaining store images with localhost:' as info, COUNT(*) as count 
FROM stores 
WHERE profile_image_url LIKE 'http://localhost%' 
   OR profile_image_url LIKE '/uploads/%'
   OR background_image_url LIKE 'http://localhost%' 
   OR background_image_url LIKE '/uploads/%';

SELECT 'Remaining about thumbnails with localhost:' as info, COUNT(*) as count 
FROM store_about_pages 
WHERE thumbnail_url LIKE 'http://localhost%' OR thumbnail_url LIKE '/uploads/%';

-- If everything looks good, commit. Otherwise rollback.
-- COMMIT;
-- ROLLBACK;

SELECT 'Review the results above. If correct, run COMMIT; otherwise run ROLLBACK;' as action_required;
