-- Migration: Create product_variants table
-- Description: Add support for product variants (different colors, sizes, etc.)
-- Date: 2025-12-29

CREATE TABLE IF NOT EXISTS product_variants (
  variant_id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  variant_name VARCHAR(100) NOT NULL COMMENT 'e.g., "Warna", "Ukuran"',
  variant_value VARCHAR(100) NOT NULL COMMENT 'e.g., "Merah", "XL"',
  price_adjustment DECIMAL(10,2) DEFAULT 0 COMMENT 'Additional price for this variant (can be negative for discount)',
  image_url VARCHAR(500) DEFAULT NULL COMMENT 'Variant-specific image URL',
  stock_quantity INT DEFAULT 0 COMMENT 'Stock for this specific variant',
  sku VARCHAR(100) DEFAULT NULL COMMENT 'Stock Keeping Unit for variant',
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id),
  INDEX idx_is_active (is_active),
  UNIQUE KEY unique_product_variant (product_id, variant_name, variant_value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Product variants for different options like color, size, etc.';

-- Add variant_id to cart_items (check if column doesn't exist first)
SET @dbname = DATABASE();
SET @tablename = 'cart_items';
SET @columnname = 'variant_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN variant_id INT DEFAULT NULL AFTER sku_id, ADD INDEX idx_cart_variant_id (variant_id)')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add variant_id to order_items (check if column doesn't exist first)
SET @tablename = 'order_items';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN variant_id INT DEFAULT NULL AFTER sku_id, ADD INDEX idx_order_variant_id (variant_id)')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
