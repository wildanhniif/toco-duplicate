-- Migration: Create products and related tables
-- Date: 2024-11-29
-- Description: Complete product management system for Toco Marketplace & Classified

-- 1. Product Categories
CREATE TABLE IF NOT EXISTS product_categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    parent_id INT NULL,
    category_type ENUM('marketplace', 'classified', 'both') DEFAULT 'both',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES product_categories(category_id) ON DELETE SET NULL
);

-- 2. Products (Main table)
CREATE TABLE IF NOT EXISTS products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    store_id INT NOT NULL,
    category_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Product type
    product_type ENUM('marketplace', 'classified') NOT NULL DEFAULT 'marketplace',
    
    -- Common fields
    price DECIMAL(15, 2) NOT NULL,
    discount_percentage INT DEFAULT 0,
    final_price DECIMAL(15, 2) GENERATED ALWAYS AS (price - (price * discount_percentage / 100)) STORED,
    
    -- Marketplace specific
    stock INT DEFAULT 0,
    sku VARCHAR(100) NULL,
    condition_type ENUM('new', 'used') DEFAULT 'new',
    brand VARCHAR(100) NULL,
    
    -- Shipping (marketplace only)
    weight INT NULL COMMENT 'Weight in grams',
    length INT NULL COMMENT 'Length in cm',
    width INT NULL COMMENT 'Width in cm',
    height INT NULL COMMENT 'Height in cm',
    is_pre_order BOOLEAN DEFAULT FALSE,
    use_store_courier BOOLEAN DEFAULT FALSE,
    insurance_type ENUM('required', 'optional') DEFAULT 'optional',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES product_categories(category_id),
    INDEX idx_store (store_id),
    INDEX idx_category (category_id),
    INDEX idx_type (product_type),
    INDEX idx_active (is_active)
);

-- 3. Product Images
CREATE TABLE IF NOT EXISTS product_images (
    image_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255) NULL,
    sort_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    INDEX idx_product (product_id)
);

-- 4. Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
    variant_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    variant_name VARCHAR(100) NOT NULL COMMENT 'e.g., Size, Color',
    variant_value VARCHAR(100) NOT NULL COMMENT 'e.g., M, Red',
    price_adjustment DECIMAL(10, 2) DEFAULT 0,
    stock INT DEFAULT 0,
    sku VARCHAR(100) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    INDEX idx_product (product_id)
);

-- 5. Classified Products - Motor
CREATE TABLE IF NOT EXISTS product_motor_specs (
    spec_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL UNIQUE,
    
    -- Spesifikasi
    brand VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    model VARCHAR(100) NOT NULL,
    transmission ENUM('manual', 'automatic') NOT NULL,
    
    -- Detail
    mileage INT NULL COMMENT 'Jarak tempuh (km)',
    engine_capacity INT NULL COMMENT 'Kapasitas mesin (cc)',
    color VARCHAR(50) NULL,
    fuel_type VARCHAR(50) NULL COMMENT 'Bensin, Diesel, Listrik',
    
    -- Pajak & Kelengkapan
    tax_expiry_date DATE NULL,
    completeness TEXT NULL COMMENT 'STNK, BPKB, dll',
    
    -- Lokasi
    location_name VARCHAR(255) NULL,
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- 6. Classified Products - Mobil
CREATE TABLE IF NOT EXISTS product_car_specs (
    spec_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL UNIQUE,
    
    -- Spesifikasi
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    transmission ENUM('manual', 'automatic') NOT NULL,
    
    -- Detail
    mileage INT NULL COMMENT 'Jarak tempuh (km)',
    license_plate VARCHAR(20) NULL,
    color VARCHAR(50) NULL,
    fuel_type VARCHAR(50) NULL,
    engine_capacity INT NULL COMMENT 'cc',
    seat_capacity INT NULL,
    
    -- Pajak & Kelengkapan
    tax_expiry_date DATE NULL,
    completeness TEXT NULL,
    
    -- Lokasi
    location_name VARCHAR(255) NULL,
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- 7. Classified Products - Property
CREATE TABLE IF NOT EXISTS product_property_specs (
    spec_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL UNIQUE,
    
    -- Tipe
    listing_type ENUM('sale', 'rent') NOT NULL,
    property_type VARCHAR(50) NULL COMMENT 'Rumah, Kost, Apartemen',
    
    -- Spesifikasi
    building_area INT NULL COMMENT 'Luas bangunan (m2)',
    land_area INT NULL COMMENT 'Luas tanah (m2)',
    bedrooms INT NULL,
    bathrooms INT NULL,
    floors INT NULL,
    
    -- Sertifikat & Fasilitas
    certificate_type VARCHAR(100) NULL COMMENT 'SHM, SHGB, dll',
    facilities TEXT NULL COMMENT 'Fasilitas lingkungan',
    
    -- Lokasi
    location_name VARCHAR(255) NULL,
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- Insert sample categories
INSERT INTO product_categories (name, slug, parent_id, category_type) VALUES
-- Marketplace categories
('Elektronik', 'elektronik', NULL, 'marketplace'),
('Fashion', 'fashion', NULL, 'marketplace'),
('Makanan & Minuman', 'makanan-minuman', NULL, 'marketplace'),
('Kesehatan & Kecantikan', 'kesehatan-kecantikan', NULL, 'marketplace'),

-- Classified categories
('Otomotif', 'otomotif', NULL, 'classified'),
('Motor', 'motor', (SELECT category_id FROM (SELECT * FROM product_categories) AS pc WHERE slug = 'otomotif'), 'classified'),
('Mobil', 'mobil', (SELECT category_id FROM (SELECT * FROM product_categories) AS pc WHERE slug = 'otomotif'), 'classified'),

-- Property
('Properti', 'properti', NULL, 'classified'),
('Rumah', 'rumah', (SELECT category_id FROM (SELECT * FROM product_categories) AS pc WHERE slug = 'properti'), 'classified'),
('Kost', 'kost', (SELECT category_id FROM (SELECT * FROM product_categories) AS pc WHERE slug = 'properti'), 'classified'),
('Apartemen', 'apartemen', (SELECT category_id FROM (SELECT * FROM product_categories) AS pc WHERE slug = 'properti'), 'classified');

-- Verify tables
SHOW TABLES LIKE '%product%';
