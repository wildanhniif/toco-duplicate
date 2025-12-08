-- ============================================
-- ADD THUMBNAIL COLUMN to store_about_pages
-- ============================================
-- Database: toco_clone
-- This adds the missing thumbnail_url column
-- ============================================

USE toco_clone;

-- Check if column exists
SELECT 'Checking if thumbnail_url column exists...' as info;

-- Add thumbnail_url column if not exists
ALTER TABLE store_about_pages 
ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500) NULL 
COMMENT 'Cloudinary thumbnail URL for about page'
AFTER content;

-- Verify the addition
SELECT 'Table structure after adding column:' as info;
SHOW COLUMNS FROM store_about_pages;

SELECT '✅ Column added successfully!' as status;
