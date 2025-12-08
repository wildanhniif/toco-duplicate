-- SAFE Migration: Add missing columns to stores table (with error handling)
-- Date: 2024-11-29
-- Description: This version checks if columns exist before adding them

DELIMITER $$

-- Procedure to add column if not exists
DROP PROCEDURE IF EXISTS AddColumnIfNotExists$$
CREATE PROCEDURE AddColumnIfNotExists(
    IN tableName VARCHAR(128),
    IN columnName VARCHAR(128),
    IN columnDefinition VARCHAR(255)
)
BEGIN
    DECLARE columnExists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO columnExists
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = tableName
        AND COLUMN_NAME = columnName;
    
    IF columnExists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE ', tableName, ' ADD COLUMN ', columnName, ' ', columnDefinition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        SELECT CONCAT('✓ Added column: ', columnName) AS Result;
    ELSE
        SELECT CONCAT('⊗ Column already exists: ', columnName) AS Result;
    END IF;
END$$

DELIMITER ;

-- Add all columns using the safe procedure
CALL AddColumnIfNotExists('stores', 'address_line', 'TEXT NULL');
CALL AddColumnIfNotExists('stores', 'postal_code', 'VARCHAR(10) NULL');
CALL AddColumnIfNotExists('stores', 'province', 'VARCHAR(100) NULL');
CALL AddColumnIfNotExists('stores', 'city', 'VARCHAR(100) NULL');
CALL AddColumnIfNotExists('stores', 'district', 'VARCHAR(100) NULL');
CALL AddColumnIfNotExists('stores', 'subdistrict', 'VARCHAR(100) NULL');
CALL AddColumnIfNotExists('stores', 'province_id', 'VARCHAR(10) NULL');
CALL AddColumnIfNotExists('stores', 'city_id', 'VARCHAR(10) NULL');
CALL AddColumnIfNotExists('stores', 'district_id', 'VARCHAR(10) NULL');
CALL AddColumnIfNotExists('stores', 'subdistrict_id', 'VARCHAR(10) NULL');
CALL AddColumnIfNotExists('stores', 'show_phone_number', 'BOOLEAN DEFAULT FALSE');
CALL AddColumnIfNotExists('stores', 'latitude', 'DECIMAL(10, 8) NULL');
CALL AddColumnIfNotExists('stores', 'longitude', 'DECIMAL(11, 8) NULL');
CALL AddColumnIfNotExists('stores', 'profile_image_url', 'VARCHAR(255) NULL');
CALL AddColumnIfNotExists('stores', 'background_image_url', 'VARCHAR(255) NULL');
CALL AddColumnIfNotExists('stores', 'use_cloudflare', 'BOOLEAN DEFAULT FALSE');

-- Clean up
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;

-- Verify the changes
DESCRIBE stores;
