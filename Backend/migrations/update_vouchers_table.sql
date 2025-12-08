-- ============================================
-- UPDATE VOUCHERS TABLE - Add New Features
-- ============================================
-- Database: toco_clone
-- This upgrades existing vouchers table with new features
-- Data lama tetap aman!
-- ============================================

USE toco_clone;

-- ============================================
-- STEP 1: Add New Columns to Existing Table
-- ============================================

-- Add voucher_type (discount/free_shipping)
ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS voucher_type ENUM('discount', 'free_shipping') NOT NULL DEFAULT 'discount' 
COMMENT 'Voucher Diskon / Gratis Ongkir' AFTER store_id;

-- Add target_type (public/private)
ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS target_type ENUM('public', 'private') NOT NULL DEFAULT 'public' 
COMMENT 'Publik / Khusus' AFTER voucher_type;

-- Rename 'name' to 'title' (optional - kalau mau konsisten)
-- ALTER TABLE vouchers CHANGE COLUMN name title VARCHAR(255) NOT NULL;

-- Add 'title' jika belum ada (untuk backward compatibility)
ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS title VARCHAR(255) NULL AFTER description;

-- Update title from name if empty
UPDATE vouchers SET title = name WHERE title IS NULL OR title = '';

-- Add apply_to column
ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS apply_to ENUM('all_products', 'specific_products') DEFAULT 'all_products' 
COMMENT 'Penerapan voucher' AFTER user_usage_limit;

-- Add status column with auto-calculation
ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS status ENUM('upcoming', 'active', 'ended', 'cancelled') DEFAULT 'active' 
COMMENT 'Status voucher' AFTER is_active;

-- Add estimated_cost column
ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(12,2) NULL 
COMMENT 'Estimasi pengeluaran' AFTER max_discount_amount;

-- Add limit_per_user (alias for user_usage_limit)
ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS limit_per_user INT UNSIGNED NULL 
COMMENT 'Limit voucher per pembeli' AFTER usage_count;

-- Update limit_per_user from existing data
UPDATE vouchers SET limit_per_user = user_usage_limit WHERE limit_per_user IS NULL;

-- Add quota column (alias for usage_limit)
ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS quota INT UNSIGNED NOT NULL DEFAULT 0 
COMMENT 'Kuota promosi total' AFTER apply_to;

-- Update quota from existing data
UPDATE vouchers SET quota = usage_limit WHERE usage_limit IS NOT NULL;

-- Add quota_used column (alias for usage_count)
ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS quota_used INT UNSIGNED DEFAULT 0 
COMMENT 'Kuota yang sudah digunakan' AFTER quota;

-- Update quota_used from existing data
UPDATE vouchers SET quota_used = usage_count;

-- Add deleted_at for soft delete
ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL 
COMMENT 'Soft delete timestamp' AFTER updated_at;

-- ============================================
-- STEP 2: Add Indexes for Performance
-- ============================================

-- Index for voucher_code (renamed from code)
ALTER TABLE vouchers ADD INDEX IF NOT EXISTS idx_voucher_code (code);

-- Index for status
ALTER TABLE vouchers ADD INDEX IF NOT EXISTS idx_status (status);

-- Index for dates
ALTER TABLE vouchers ADD INDEX IF NOT EXISTS idx_dates (started_at, expired_at);

-- Index for store_id
ALTER TABLE vouchers ADD INDEX IF NOT EXISTS idx_store_vouchers (store_id);

-- Index for active vouchers
ALTER TABLE vouchers ADD INDEX IF NOT EXISTS idx_active (is_active, deleted_at);

-- ============================================
-- STEP 3: Update Status Based on Dates
-- ============================================

-- Set status based on current date
UPDATE vouchers 
SET status = CASE 
  WHEN NOW() < started_at THEN 'upcoming'
  WHEN NOW() BETWEEN started_at AND expired_at THEN 'active'
  WHEN NOW() > expired_at THEN 'ended'
  ELSE 'active'
END
WHERE status IS NULL OR status = 'active';

-- ============================================
-- STEP 4: Update voucher_usages Table
-- ============================================

-- Rename to match new naming convention
ALTER TABLE voucher_usages CHANGE COLUMN voucher_usage_id usage_id INT UNSIGNED AUTO_INCREMENT;

-- Add discount_amount column if not exists
ALTER TABLE voucher_usages 
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0 
COMMENT 'Jumlah diskon yang didapat' AFTER order_id;

-- Add used_at column if not exists
ALTER TABLE voucher_usages 
ADD COLUMN IF NOT EXISTS used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
COMMENT 'Waktu penggunaan' AFTER discount_amount;

-- Rename to match new naming (create alias view if needed)
RENAME TABLE voucher_usages TO voucher_usage;

-- ============================================
-- STEP 5: Update voucher_products Table
-- ============================================

-- Add created_at if not exists
ALTER TABLE voucher_products 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
AFTER product_id;

-- Rename ID column
ALTER TABLE voucher_products 
CHANGE COLUMN voucher_product_id id INT UNSIGNED AUTO_INCREMENT;

-- ============================================
-- STEP 6: Verification
-- ============================================

SELECT '✅ VOUCHERS TABLE UPDATED!' as status;

-- Show updated structure
SELECT 'Updated table structure:' as info;
DESCRIBE vouchers;

-- Show column mapping
SELECT '
COLUMN MAPPING (Old → New):
- code → voucher_code (keep as code for now)
- name → title (both available)
- type → discount_type (keep as type for now)
- started_at → start_date (keep as started_at)
- expired_at → end_date (keep as expired_at)
- usage_limit → quota (both available)
- usage_count → quota_used (both available)
- user_usage_limit → limit_per_user (both available)

NEW COLUMNS:
- voucher_type (discount/free_shipping)
- target_type (public/private)
- apply_to (all_products/specific_products)
- status (upcoming/active/ended/cancelled)
- estimated_cost
- deleted_at (soft delete)
' as mapping;

-- Count existing vouchers
SELECT CONCAT('Total existing vouchers: ', COUNT(*)) as existing_data FROM vouchers;

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
  expired_at
FROM vouchers 
LIMIT 3;
