-- ============================================
-- CREATE VOUCHERS & RELATED TABLES
-- ============================================
-- Database: toco_clone
-- For seller promotional vouchers/coupons
-- ============================================

USE toco_clone;

-- ============================================
-- Main Vouchers Table
-- ============================================
CREATE TABLE IF NOT EXISTS vouchers (
  voucher_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  store_id INT UNSIGNED NOT NULL,
  
  -- Informasi Voucher
  voucher_type ENUM('discount', 'free_shipping') NOT NULL DEFAULT 'discount' COMMENT 'Voucher Diskon / Gratis Ongkir',
  target_type ENUM('public', 'private') NOT NULL DEFAULT 'public' COMMENT 'Publik / Khusus',
  voucher_code VARCHAR(50) NULL COMMENT 'Kode unik untuk voucher khusus',
  title VARCHAR(255) NOT NULL COMMENT 'Judul promosi',
  description TEXT NULL COMMENT 'Deskripsi promosi',
  
  -- Informasi Program
  start_date DATETIME NOT NULL COMMENT 'Periode dimulai',
  end_date DATETIME NOT NULL COMMENT 'Periode berakhir',
  quota INT UNSIGNED NOT NULL COMMENT 'Kuota promosi total',
  quota_used INT UNSIGNED DEFAULT 0 COMMENT 'Kuota yang sudah digunakan',
  limit_per_user INT UNSIGNED NULL COMMENT 'Limit voucher per pembeli (NULL = unlimited)',
  target_users ENUM('all') DEFAULT 'all' COMMENT 'Target pengguna',
  apply_to ENUM('all_products', 'specific_products') DEFAULT 'all_products' COMMENT 'Penerapan voucher',
  
  -- Detail Promo
  discount_type ENUM('percentage', 'fixed') NOT NULL COMMENT 'Presentase / Potongan',
  discount_value DECIMAL(10,2) NOT NULL COMMENT 'Nilai diskon (% atau Rp)',
  max_discount DECIMAL(10,2) NULL COMMENT 'Maksimum diskon (untuk percentage)',
  min_transaction DECIMAL(10,2) DEFAULT 0 COMMENT 'Minimum transaksi',
  estimated_cost DECIMAL(12,2) NULL COMMENT 'Estimasi pengeluaran (quota x discount)',
  
  -- Status & Metadata
  status ENUM('upcoming', 'active', 'ended', 'cancelled') DEFAULT 'upcoming' COMMENT 'Status voucher',
  is_active BOOLEAN DEFAULT TRUE COMMENT 'Aktif/Non-aktif',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  -- Indexes
  INDEX idx_store_vouchers (store_id),
  INDEX idx_voucher_code (voucher_code),
  INDEX idx_status (status),
  INDEX idx_dates (start_date, end_date),
  INDEX idx_active (is_active, deleted_at),
  
  -- Foreign Key
  CONSTRAINT fk_voucher_store FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Voucher Products (for specific products)
-- ============================================
CREATE TABLE IF NOT EXISTS voucher_products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  voucher_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  UNIQUE KEY uk_voucher_product (voucher_id, product_id),
  INDEX idx_voucher (voucher_id),
  INDEX idx_product (product_id),
  
  -- Foreign Keys
  CONSTRAINT fk_vp_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(voucher_id) ON DELETE CASCADE,
  CONSTRAINT fk_vp_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Voucher Usage Log
-- ============================================
CREATE TABLE IF NOT EXISTS voucher_usage (
  usage_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  voucher_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  order_id INT UNSIGNED NULL,
  discount_amount DECIMAL(10,2) NOT NULL COMMENT 'Jumlah diskon yang didapat',
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_voucher_usage (voucher_id),
  INDEX idx_user_usage (user_id),
  INDEX idx_order (order_id),
  
  -- Foreign Keys
  CONSTRAINT fk_vu_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(voucher_id) ON DELETE CASCADE,
  CONSTRAINT fk_vu_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Insert Sample Data (Optional - for testing)
-- ============================================
-- Uncomment to insert sample voucher
/*
INSERT INTO vouchers (
  store_id, voucher_type, target_type, title, description,
  start_date, end_date, quota, discount_type, discount_value, 
  min_transaction, status
) VALUES (
  1, 'discount', 'public', 'Diskon 20% All Products', 
  'Dapatkan diskon 20% untuk semua produk di toko kami!',
  NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 100, 
  'percentage', 20.00, 50000.00, 'active'
);
*/

-- ============================================
-- Verification
-- ============================================
SELECT 'Tables created successfully!' as status;
SHOW TABLES LIKE 'voucher%';
DESCRIBE vouchers;
