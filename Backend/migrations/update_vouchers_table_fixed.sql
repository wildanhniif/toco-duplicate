-- ============================================
-- UPDATE VOUCHERS TABLE - FIXED VERSION
-- ============================================
-- Database: toco_clone
-- Fixed: Handle invalid default value for expired_at
-- ============================================

USE toco_clone;

-- ============================================
-- STEP 0: Fix expired_at column first
-- ============================================

-- Temporarily disable strict mode
SET sql_mode = '';

-- Fix expired_at column to allow NULL or proper default
ALTER TABLE vouchers 
MODIFY COLUMN expired_at TIMESTAMP NULL DEFAULT NULL;

-- Update any zero dates to NULL
UPDATE vouchers 
SET expired_at = NULL 
WHERE expired_at = '0000-00-00 00:00:00' OR expired_at < '1970-01-01';

-- If you want to keep dates, update to valid date
-- UPDATE vouchers SET expired_at = DATE_ADD(started_at, INTERVAL 30 DAY) WHERE expired_at IS NULL;

-- Re-enable strict mode (optional)
-- SET sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE';

-- ============================================
-- STEP 1: Add New Columns
-- ============================================

-- Add voucher_type (discount/free_shipping)
ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS voucher_type ENUM('discount', 'free_shipping') NOT NULL DEFAULT 'discount' 
COMMENT 'Voucher Diskon / Gratis Ongkir' AFTER store_id;

-- Add target_type (public/private)
ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS target_type ENUM('public', 'private') NOT NULL DEFAULT 'public' 
COMMENT 'Publik / Khusus' AFTER voucher_type;

-- Add 'title' column
ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS title VARCHAR(255) NULL AFTER description;

-- Update title from name if empty
UPDATE vouchers SET title = name WHERE title IS NULL OR title = '';

-- Add apply_to column
ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS apply_to ENUM('all_products', 'specific_products') DEFAULT 'all_products' 
COMMENT 'Penerapan voucher' AFTER user_usage_limit;

-- Add status column
ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS status ENUM('upcoming', 'active', 'ended', 'cancelled') DEFAULT 'active' 
COMMENT 'Status voucher' AFTER is_active;

-- Add estimated_cost column
ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(12,2) NULL 
COMMENT 'Estimasi pengeluaran' AFTER max_discount_amount;

-- Add limit_per_user
ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS limit_per_user INT UNSIGNED NULL 
COMMENT 'Limit voucher per pembeli' AFTER usage_count;

-- Update limit_per_user from existing data
UPDATE vouchers SET limit_per_user = user_usage_limit WHERE limit_per_user IS NULL;

-- Add quota column
ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS quota INT UNSIGNED NOT NULL DEFAULT 0 
COMMENT 'Kuota promosi total' AFTER apply_to;

-- Update quota from existing data
UPDATE vouchers SET quota = COALESCE(usage_limit, 0) WHERE quota = 0;

-- Add quota_used column
ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS quota_used INT UNSIGNED DEFAULT 0 
COMMENT 'Kuota yang sudah digunakan' AFTER quota;

-- Update quota_used from existing data
UPDATE vouchers SET quota_used = COALESCE(usage_count, 0) WHERE quota_used = 0;

-- Add deleted_at for soft delete
ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL 
COMMENT 'Soft delete timestamp' AFTER updated_at;

-- ============================================
-- STEP 2: Add Indexes (if not exists)
-- ============================================

-- Check and add indexes one by one
SET @index_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                     WHERE table_schema = 'toco_clone' 
                     AND table_name = 'vouchers' 
                     AND index_name = 'idx_voucher_code');
                     
SET @sql = IF(@index_exists = 0, 
              'ALTER TABLE vouchers ADD INDEX idx_voucher_code (code)', 
              'SELECT "Index idx_voucher_code already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index for status
SET @index_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                     WHERE table_schema = 'toco_clone' 
                     AND table_name = 'vouchers' 
                     AND index_name = 'idx_status');
                     
SET @sql = IF(@index_exists = 0, 
              'ALTER TABLE vouchers ADD INDEX idx_status (status)', 
              'SELECT "Index idx_status already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index for dates
SET @index_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                     WHERE table_schema = 'toco_clone' 
                     AND table_name = 'vouchers' 
                     AND index_name = 'idx_dates');
                     
SET @sql = IF(@index_exists = 0, 
              'ALTER TABLE vouchers ADD INDEX idx_dates (started_at, expired_at)', 
              'SELECT "Index idx_dates already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index for store_id
SET @index_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                     WHERE table_schema = 'toco_clone' 
                     AND table_name = 'vouchers' 
                     AND index_name = 'idx_store_vouchers');
                     
SET @sql = IF(@index_exists = 0, 
              'ALTER TABLE vouchers ADD INDEX idx_store_vouchers (store_id)', 
              'SELECT "Index idx_store_vouchers already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index for active vouchers
SET @index_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                     WHERE table_schema = 'toco_clone' 
                     AND table_name = 'vouchers' 
                     AND index_name = 'idx_active');
                     
SET @sql = IF(@index_exists = 0, 
              'ALTER TABLE vouchers ADD INDEX idx_active (is_active, deleted_at)', 
              'SELECT "Index idx_active already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- STEP 3: Update Status Based on Dates
-- ============================================

-- Set status based on current date (only for vouchers with valid dates)
UPDATE vouchers 
SET status = CASE 
  WHEN expired_at IS NULL THEN 'active'
  WHEN NOW() < started_at THEN 'upcoming'
  WHEN NOW() BETWEEN started_at AND expired_at THEN 'active'
  WHEN NOW() > expired_at THEN 'ended'
  ELSE 'active'
END
WHERE status = 'active' OR status IS NULL;

-- ============================================
-- STEP 4: Update Related Tables
-- ============================================

-- Check if voucher_usage table exists (might be voucher_usages)
SET @table_exists = (SELECT COUNT(*) 
                     FROM information_schema.tables 
                     WHERE table_schema = 'toco_clone' 
                     AND table_name = 'voucher_usages');

-- Rename if exists
SET @sql = IF(@table_exists > 0, 
              'RENAME TABLE voucher_usages TO voucher_usage', 
              'SELECT "Table voucher_usages does not exist or already renamed"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add columns to voucher_usage if table exists
SET @table_exists = (SELECT COUNT(*) 
                     FROM information_schema.tables 
                     WHERE table_schema = 'toco_clone' 
                     AND table_name = 'voucher_usage');

SET @sql = IF(@table_exists > 0, 
              'ALTER TABLE voucher_usage 
               ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER order_id,
               ADD COLUMN IF NOT EXISTS used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER discount_amount', 
              'SELECT "Table voucher_usage does not exist"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update voucher_products if exists
SET @table_exists = (SELECT COUNT(*) 
                     FROM information_schema.tables 
                     WHERE table_schema = 'toco_clone' 
                     AND table_name = 'voucher_products');

SET @sql = IF(@table_exists > 0, 
              'ALTER TABLE voucher_products 
               ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER product_id', 
              'SELECT "Table voucher_products does not exist"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- STEP 5: Verification
-- ============================================

SELECT '✅ VOUCHERS TABLE UPDATED!' as status;

-- Show updated structure
SELECT 'Updated table structure:' as info;
DESCRIBE vouchers;

-- Show sample data
SELECT 'Sample voucher data:' as info;
SELECT 
  voucher_id, 
  code,
  COALESCE(title, name) as title,
  voucher_type,
  target_type,
  type as discount_type,
  status,
  started_at,
  expired_at,
  quota,
  quota_used
FROM vouchers 
LIMIT 3;

-- Count existing vouchers
SELECT CONCAT('✅ Total vouchers: ', COUNT(*)) as result FROM vouchers;

SELECT '
✅ MIGRATION COMPLETE!

COLUMN MAPPING:
- code → voucher_code (use code for now)
- name → title (both available, use COALESCE)
- type → discount_type (use type)
- started_at → start_date (use started_at)
- expired_at → end_date (use expired_at)
- usage_limit → quota (both available)
- usage_count → quota_used (both available)

NEW FEATURES:
✓ voucher_type (discount/free_shipping)
✓ target_type (public/private)
✓ apply_to (all_products/specific_products)
✓ status (upcoming/active/ended/cancelled)
✓ estimated_cost
✓ soft delete (deleted_at)

NEXT STEPS:
1. Restart backend server
2. Test API: GET http://localhost:5000/api/vouchers
3. Create new voucher via API
4. Build frontend
' as summary;
