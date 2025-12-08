# Fix Migration Error: Unknown column 'subdistrict_id'

## 🔴 Error yang Terjadi

```
#1054 - Unknown column 'subdistrict_id' in 'stores'
```

**Penyebab:** Migration SQL lama pakai `AFTER subdistrict_id`, tapi kolom tersebut belum ada di table `stores`.

---

## ✅ Solusi: Pakai Migration yang Sudah Diperbaiki

Saya sudah buat **2 versi** migration SQL:

### Opsi 1: Direct Migration (Simple)

**File:** `Backend/migrations/add_missing_store_columns.sql`

**Karakteristik:**

- Langsung add semua kolom
- Jika kolom sudah ada, akan error "Duplicate column name" (SKIP saja)
- Lebih cepat

### Opsi 2: Safe Migration (Recommended) ✅

**File:** `Backend/migrations/add_missing_store_columns_SAFE.sql`

**Karakteristik:**

- Check dulu apakah kolom sudah ada
- Hanya add kolom yang belum ada
- Tidak akan error
- Ada message untuk setiap kolom

---

## 🚀 Cara Jalankan Migration

### Method 1: Via MySQL Command Line (Recommended)

```bash
# 1. Connect ke MySQL
mysql -u root -p

# 2. Select database
USE toco;  # Ganti dengan nama database Anda

# 3. Jalankan SAFE migration
source Backend/migrations/add_missing_store_columns_SAFE.sql;

# ATAU jalankan langsung:
```

```sql
-- Copy-paste entire SQL from add_missing_store_columns_SAFE.sql
-- Tekan Enter untuk execute
```

---

### Method 2: Via phpMyAdmin

1. Buka `http://localhost/phpmyadmin`
2. Pilih database Toco
3. Klik tab **SQL**
4. Copy-paste isi file `add_missing_store_columns_SAFE.sql`
5. Klik **Go**
6. ✅ Lihat hasil - setiap kolom akan show status:
   - `✓ Added column: xxx` = Berhasil ditambahkan
   - `⊗ Column already exists: xxx` = Sudah ada, di-skip

---

### Method 3: Manual (Satu per Satu)

Jika kedua cara di atas tidak berhasil, jalankan satu per satu:

```sql
-- 1. Check kolom apa yang sudah ada
DESCRIBE stores;

-- 2. Add kolom yang belum ada (skip yang error)
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
ALTER TABLE stores ADD COLUMN show_phone_number BOOLEAN DEFAULT FALSE;
ALTER TABLE stores ADD COLUMN latitude DECIMAL(10, 8) NULL;
ALTER TABLE stores ADD COLUMN longitude DECIMAL(11, 8) NULL;
ALTER TABLE stores ADD COLUMN use_cloudflare BOOLEAN DEFAULT FALSE;

-- 3. Verify
DESCRIBE stores;
```

**Tips:** Jika ada error "Duplicate column name", abaikan saja. Itu berarti kolom sudah ada.

---

## ✅ Verify Migration Sukses

Jalankan query ini:

```sql
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'toco'  -- Ganti dengan nama database Anda
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
        'use_cloudflare'
    )
ORDER BY COLUMN_NAME;
```

**Expected Output:** Harus ada 14 rows (semua kolom yang dibutuhkan)

---

## 📋 Checklist Kolom yang Harus Ada

Pastikan table `stores` punya kolom-kolom ini:

**Address & Location:**

- [ ] `address_line` (TEXT)
- [ ] `postal_code` (VARCHAR)
- [ ] `province` (VARCHAR)
- [ ] `city` (VARCHAR)
- [ ] `district` (VARCHAR)
- [ ] `subdistrict` (VARCHAR)

**Wilayah IDs:**

- [ ] `province_id` (VARCHAR)
- [ ] `city_id` (VARCHAR)
- [ ] `district_id` (VARCHAR)
- [ ] `subdistrict_id` (VARCHAR)

**New Features:**

- [ ] `show_phone_number` (BOOLEAN/TINYINT)
- [ ] `latitude` (DECIMAL)
- [ ] `longitude` (DECIMAL)
- [ ] `use_cloudflare` (BOOLEAN/TINYINT)

---

## 🔄 Setelah Migration

### 1. Restart Backend Server

```bash
cd Backend
# Stop jika running (Ctrl+C)
npm start
```

### 2. Test Submit Form

1. Login sebagai seller
2. Klik "Lengkapi Sekarang"
3. Isi form lengkap
4. Submit
5. ✅ **Harusnya berhasil tanpa error!**

### 3. Check Database

```sql
SELECT * FROM stores WHERE user_id = [YOUR_USER_ID];
```

Pastikan semua field tersimpan dengan benar.

---

## 🐛 Troubleshooting

### Error: "Procedure already exists"

Jika dapat error saat create procedure:

```sql
-- Drop procedure dulu
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;

-- Lalu jalankan lagi migration SAFE
```

### Error: "Access denied"

Login sebagai user dengan privilege ALTER:

```bash
mysql -u root -p
```

### Some columns still missing

Check satu per satu dengan:

```sql
SHOW COLUMNS FROM stores LIKE 'latitude';
-- Jika empty result, berarti kolom belum ada

-- Add manual
ALTER TABLE stores ADD COLUMN latitude DECIMAL(10, 8) NULL;
```

---

## 📊 Comparison: Before vs After

### BEFORE (Error)

```
Table: stores
- store_id
- user_id
- name
- slug
- description
- business_phone  ← Last column
- profile_image_url
- background_image_url
- is_active
- created_at
- updated_at
```

### AFTER (Complete)

```
Table: stores
- store_id
- user_id
- name
- slug
- description
- business_phone
+ address_line          ← NEW
+ postal_code           ← NEW
+ province              ← NEW
+ city                  ← NEW
+ district              ← NEW
+ subdistrict           ← NEW
+ province_id           ← NEW
+ city_id               ← NEW
+ district_id           ← NEW
+ subdistrict_id        ← NEW
+ show_phone_number     ← NEW
+ latitude              ← NEW
+ longitude             ← NEW
- profile_image_url
- background_image_url
+ use_cloudflare        ← NEW
- is_active
- created_at
- updated_at
```

---

## ✅ Quick Start (TL;DR)

```bash
# 1. Connect MySQL
mysql -u root -p

# 2. Select DB
USE toco;

# 3. Run SAFE migration
source Backend/migrations/add_missing_store_columns_SAFE.sql;

# 4. Verify
DESCRIBE stores;

# 5. Restart backend
cd Backend
npm start

# 6. Test form - DONE! ✅
```

---

**Recommended Method:** Pakai **SAFE migration** (`add_missing_store_columns_SAFE.sql`)  
**Reason:** Otomatis check & skip kolom yang sudah ada, tidak akan error.
