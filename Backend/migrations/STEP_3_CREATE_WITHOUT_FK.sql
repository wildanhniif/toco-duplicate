-- ============================================
-- STEP 3: BUAT TABLE TANPA FOREIGN KEY DULU
-- ============================================
-- Copy script ini ke phpMyAdmin dan jalankan

-- 1. Master courier services (tidak ada dependency)
CREATE TABLE courier_services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    logo_url VARCHAR(255) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Courier service types (depends on courier_services)
CREATE TABLE courier_service_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    courier_service_id INT NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_courier_type (courier_service_id, code),
    INDEX idx_courier_service (courier_service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Store courier config (TANPA FK ke stores dulu)
CREATE TABLE store_courier_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    store_id INT NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    max_delivery_distance INT NULL COMMENT 'Batas pengiriman dalam km',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_store_courier (store_id),
    INDEX idx_store (store_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Distance pricing
CREATE TABLE courier_distance_pricing (
    id INT PRIMARY KEY AUTO_INCREMENT,
    store_courier_config_id INT NOT NULL,
    distance_from INT NOT NULL,
    distance_to INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_store_courier (store_courier_config_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Weight pricing
CREATE TABLE courier_weight_pricing (
    id INT PRIMARY KEY AUTO_INCREMENT,
    store_courier_config_id INT NOT NULL,
    weight_from INT NOT NULL,
    additional_price DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_store_courier_weight (store_courier_config_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Store courier services (TANPA FK ke stores dulu)
CREATE TABLE store_courier_services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    store_id INT NOT NULL,
    courier_service_type_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_store_courier_service (store_id, courier_service_type_id),
    INDEX idx_store (store_id),
    INDEX idx_courier_type (courier_service_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Verifikasi table berhasil dibuat
SHOW TABLES LIKE '%courier%';
-- Harus ada 6 tables
