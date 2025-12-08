-- Migration: Create shipping configuration tables
-- Date: 2024-11-29
-- Description: Tables for store courier settings and courier services

-- 1. Table for store courier configuration (kurir toko sendiri)
CREATE TABLE IF NOT EXISTS store_courier_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    store_id INT NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    max_delivery_distance INT NULL COMMENT 'Batas pengiriman dalam km',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE,
    UNIQUE KEY unique_store_courier (store_id)
);

-- 2. Table for distance-based pricing (pengaturan jarak)
CREATE TABLE IF NOT EXISTS courier_distance_pricing (
    id INT PRIMARY KEY AUTO_INCREMENT,
    store_courier_config_id INT NOT NULL,
    distance_from INT NOT NULL COMMENT 'Jarak dari (km)',
    distance_to INT NOT NULL COMMENT 'Jarak sampai (km)',
    price DECIMAL(10, 2) NOT NULL COMMENT 'Harga ongkir',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_courier_config_id) REFERENCES store_courier_config(id) ON DELETE CASCADE,
    INDEX idx_store_courier (store_courier_config_id)
);

-- 3. Table for weight-based pricing (pengaturan berat)
CREATE TABLE IF NOT EXISTS courier_weight_pricing (
    id INT PRIMARY KEY AUTO_INCREMENT,
    store_courier_config_id INT NOT NULL,
    weight_from INT NOT NULL COMMENT 'Berat dari (gram)',
    additional_price DECIMAL(10, 2) NOT NULL COMMENT 'Biaya tambahan',
    description VARCHAR(255) NULL COMMENT 'Keterangan',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_courier_config_id) REFERENCES store_courier_config(id) ON DELETE CASCADE,
    INDEX idx_store_courier_weight (store_courier_config_id)
);

-- 4. Master table for courier services (ekspedisi)
CREATE TABLE IF NOT EXISTS courier_services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Kode ekspedisi, e.g., GOSEND, JNT',
    name VARCHAR(100) NOT NULL COMMENT 'Nama ekspedisi',
    logo_url VARCHAR(255) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Master table for courier service types
CREATE TABLE IF NOT EXISTS courier_service_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    courier_service_id INT NOT NULL,
    code VARCHAR(50) NOT NULL COMMENT 'e.g., SAMEDAY, INSTANT, REGULAR',
    name VARCHAR(100) NOT NULL COMMENT 'e.g., GoSend Sameday, JNE Regular',
    description TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (courier_service_id) REFERENCES courier_services(id) ON DELETE CASCADE,
    UNIQUE KEY unique_courier_type (courier_service_id, code)
);

-- 6. Table for store's selected courier services
CREATE TABLE IF NOT EXISTS store_courier_services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    store_id INT NOT NULL,
    courier_service_type_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE,
    FOREIGN KEY (courier_service_type_id) REFERENCES courier_service_types(id) ON DELETE CASCADE,
    UNIQUE KEY unique_store_courier_service (store_id, courier_service_type_id)
);

-- Insert courier services data
INSERT INTO courier_services (code, name) VALUES
('GOSEND', 'GoSend'),
('JNT', 'J&T'),
('SICEPAT', 'SiCepat Logistic'),
('PAXEL', 'Paxel'),
('JNE', 'JNE'),
('ANTERAJA', 'Anteraja'),
('POS', 'POS Indonesia');

-- Insert courier service types
-- GoSend
INSERT INTO courier_service_types (courier_service_id, code, name) VALUES
((SELECT id FROM courier_services WHERE code = 'GOSEND'), 'SAMEDAY', 'GoSend Sameday'),
((SELECT id FROM courier_services WHERE code = 'GOSEND'), 'INSTANT', 'GoSend Instant');

-- J&T
INSERT INTO courier_service_types (courier_service_id, code, name) VALUES
((SELECT id FROM courier_services WHERE code = 'JNT'), 'HBO', 'J&T HBO'),
((SELECT id FROM courier_services WHERE code = 'JNT'), 'NEXTDAY', 'J&T Nextday'),
((SELECT id FROM courier_services WHERE code = 'JNT'), 'SAMEDAY', 'J&T Sameday'),
((SELECT id FROM courier_services WHERE code = 'JNT'), 'REGULAR', 'J&T Regular');

-- SiCepat
INSERT INTO courier_service_types (courier_service_id, code, name) VALUES
((SELECT id FROM courier_services WHERE code = 'SICEPAT'), 'BEST', 'SiCepat BEST'),
((SELECT id FROM courier_services WHERE code = 'SICEPAT'), 'GOKIL', 'SiCepat GOKIL'),
((SELECT id FROM courier_services WHERE code = 'SICEPAT'), 'SIUNTUNG', 'SiCepat SIUNTUNG');

-- Paxel
INSERT INTO courier_service_types (courier_service_id, code, name) VALUES
((SELECT id FROM courier_services WHERE code = 'PAXEL'), 'SAMEDAY', 'Paxel Sameday'),
((SELECT id FROM courier_services WHERE code = 'PAXEL'), 'BIG', 'Paxel Big'),
((SELECT id FROM courier_services WHERE code = 'PAXEL'), 'INSTANT', 'Paxel Instant');

-- JNE
INSERT INTO courier_service_types (courier_service_id, code, name) VALUES
((SELECT id FROM courier_services WHERE code = 'JNE'), 'TRUCKING', 'JNE Trucking'),
((SELECT id FROM courier_services WHERE code = 'JNE'), 'YES', 'JNE Yes'),
((SELECT id FROM courier_services WHERE code = 'JNE'), 'REGULAR', 'JNE Regular'),
((SELECT id FROM courier_services WHERE code = 'JNE'), 'OKE', 'JNE OKE');

-- Anteraja
INSERT INTO courier_service_types (courier_service_id, code, name) VALUES
((SELECT id FROM courier_services WHERE code = 'ANTERAJA'), 'REGULAR', 'Anteraja Regular'),
((SELECT id FROM courier_services WHERE code = 'ANTERAJA'), 'NEXTDAY', 'Anteraja Next day'),
((SELECT id FROM courier_services WHERE code = 'ANTERAJA'), 'SAMEDAY', 'Anteraja Same Day');

-- POS Indonesia
INSERT INTO courier_service_types (courier_service_id, code, name) VALUES
((SELECT id FROM courier_services WHERE code = 'POS'), 'KARGO', 'Pos Kargo'),
((SELECT id FROM courier_services WHERE code = 'POS'), 'SAMEDAY', 'Pos Sameday'),
((SELECT id FROM courier_services WHERE code = 'POS'), 'REGULAR', 'Pos Regular'),
((SELECT id FROM courier_services WHERE code = 'POS'), 'EXPRESS', 'Pos Express');

-- Verify tables created
SHOW TABLES LIKE '%courier%';
