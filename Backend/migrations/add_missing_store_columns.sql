-- Migration: Add missing columns to stores table
-- Date: 2024-11-29
-- Description: Add wilayah, show_phone_number, latitude, longitude, use_cloudflare columns

-- Note: Run each ALTER TABLE separately. If column exists, you'll get error but can skip it.
-- Or run entire script and ignore "Duplicate column name" errors.

-- Add address and location columns
ALTER TABLE stores ADD COLUMN address_line TEXT NULL;
ALTER TABLE stores ADD COLUMN postal_code VARCHAR(10) NULL;
ALTER TABLE stores ADD COLUMN province VARCHAR(100) NULL;
ALTER TABLE stores ADD COLUMN city VARCHAR(100) NULL;
ALTER TABLE stores ADD COLUMN district VARCHAR(100) NULL;
ALTER TABLE stores ADD COLUMN subdistrict VARCHAR(100) NULL;
ALTER TABLE stores ADD COLUMN province_id VARCHAR(10) NULL;
ALTER TABLE stores ADD COLUMN city_id VARCHAR(10) NULL;
ALTER TABLE stores ADD COLUMN district_id VARCHAR(10) NULL;
ALTER TABLE stores ADD COLUMN subdistrict_id VARCHAR(10) NULL;

-- Add show_phone_number column
ALTER TABLE stores ADD COLUMN show_phone_number BOOLEAN DEFAULT FALSE;

-- Add latitude and longitude for Google Maps
ALTER TABLE stores ADD COLUMN latitude DECIMAL(10, 8) NULL;
ALTER TABLE stores ADD COLUMN longitude DECIMAL(11, 8) NULL;

-- Add image URL columns
ALTER TABLE stores ADD COLUMN profile_image_url VARCHAR(255) NULL;
ALTER TABLE stores ADD COLUMN background_image_url VARCHAR(255) NULL;

-- Add use_cloudflare flag
ALTER TABLE stores ADD COLUMN use_cloudflare BOOLEAN DEFAULT FALSE;

-- Verify the changes
DESCRIBE stores;
