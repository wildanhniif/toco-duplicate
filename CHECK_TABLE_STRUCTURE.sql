-- Check table structure untuk fix cleanup script
USE blibli;

-- Show store_about_pages structure
SELECT '=== store_about_pages TABLE STRUCTURE ===' as info;
SHOW COLUMNS FROM store_about_pages;

-- Show all column names
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'blibli' 
  AND TABLE_NAME = 'store_about_pages';

-- Check if there are any records
SELECT COUNT(*) as total_records FROM store_about_pages;

-- Show sample data
SELECT * FROM store_about_pages LIMIT 5;
