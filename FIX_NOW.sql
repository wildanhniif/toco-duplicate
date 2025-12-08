-- QUICK FIX: Tambahkan 2 kolom yang masih kurang
-- Copy-paste ini ke MySQL dan jalankan!

USE toco;

-- Tambah kolom gambar
ALTER TABLE stores ADD COLUMN profile_image_url VARCHAR(255) NULL;
ALTER TABLE stores ADD COLUMN background_image_url VARCHAR(255) NULL;

-- Verify
DESCRIBE stores;

-- Test query untuk pastikan semua kolom ada
SELECT 
    COUNT(*) as total_columns
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'stores'
    AND COLUMN_NAME IN (
        'address_line',
        'postal_code',
        'province',
        'city',
        'district',
        'subdistrict',
        'province_id',
        'city_id',
        'district_id',
        'subdistrict_id',
        'show_phone_number',
        'latitude',
        'longitude',
        'profile_image_url',
        'background_image_url',
        'use_cloudflare'
    );
-- Harusnya return 16 (semua kolom lengkap)
