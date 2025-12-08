# Fix Error 500: Database Migration Required

## 🔴 Error yang Terjadi

```
Error saat update toko: Error: Unknown column 'show_phone_number' in 'field list'
SQL Error: ER_BAD_FIELD_ERROR (1054)
```

**Penyebab:** Database table `stores` tidak memiliki kolom yang dibutuhkan oleh backend.

---

## ✅ Solusi: Jalankan Migration SQL

### Step 1: Buka MySQL Client

Pilih salah satu cara:

**Opsi A: Menggunakan Terminal/CMD**

```bash
# Connect ke MySQL
mysql -u root -p

# Atau jika ada password
mysql -u root -p[password_anda]
```

**Opsi B: Menggunakan phpMyAdmin**

- Buka browser → `http://localhost/phpmyadmin`
- Login dengan kredensial MySQL
- Pilih database Toco Anda

**Opsi C: Menggunakan MySQL Workbench**

- Buka MySQL Workbench
- Connect ke local instance
- Select database Toco

---

### Step 2: Pilih Database

```sql
USE toco;  -- Ganti 'toco' dengan nama database Anda
```

---

### Step 3: Jalankan Migration

Copy-paste SQL berikut dan execute:

```sql
-- Migration: Add missing columns to stores table
-- Date: 2024-11-29
-- Description: Add show_phone_number, latitude, longitude, use_cloudflare columns

-- Add show_phone_number column
ALTER TABLE stores
ADD COLUMN show_phone_number BOOLEAN DEFAULT FALSE AFTER business_phone;

-- Add latitude and longitude for Google Maps
ALTER TABLE stores
ADD COLUMN latitude DECIMAL(10, 8) NULL AFTER subdistrict_id,
ADD COLUMN longitude DECIMAL(11, 8) NULL AFTER latitude;

-- Add use_cloudflare flag
ALTER TABLE stores
ADD COLUMN use_cloudflare BOOLEAN DEFAULT FALSE AFTER background_image_url;
```

---

### Step 4: Verify Changes

Jalankan query ini untuk memastikan kolom sudah ditambahkan:

```sql
DESCRIBE stores;
```

**Expected Output:**
Anda harus melihat kolom-kolom baru:

- `show_phone_number` (tinyint/boolean)
- `latitude` (decimal(10,8))
- `longitude` (decimal(11,8))
- `use_cloudflare` (tinyint/boolean)

---

## 📊 Struktur Table `stores` (Updated)

Setelah migration, table `stores` akan memiliki kolom:

| Column Name           | Type              | Nullable | Default           | Description                    |
| --------------------- | ----------------- | -------- | ----------------- | ------------------------------ |
| store_id              | INT               | NO       | AUTO_INCREMENT    | Primary key                    |
| user_id               | INT               | NO       | -                 | Foreign key ke users table     |
| name                  | VARCHAR(255)      | NO       | -                 | Nama toko                      |
| slug                  | VARCHAR(255)      | NO       | UNIQUE            | URL slug toko                  |
| description           | TEXT              | YES      | NULL              | Deskripsi toko                 |
| business_phone        | VARCHAR(20)       | YES      | NULL              | Nomor telepon usaha            |
| **show_phone_number** | **BOOLEAN**       | **YES**  | **FALSE**         | Toggle show/hide nomor telepon |
| address_line          | TEXT              | YES      | NULL              | Alamat lengkap                 |
| postal_code           | VARCHAR(10)       | YES      | NULL              | Kode pos                       |
| province              | VARCHAR(100)      | YES      | NULL              | Nama provinsi                  |
| city                  | VARCHAR(100)      | YES      | NULL              | Nama kota/kabupaten            |
| district              | VARCHAR(100)      | YES      | NULL              | Nama kecamatan                 |
| subdistrict           | VARCHAR(100)      | YES      | NULL              | Nama kelurahan                 |
| province_id           | VARCHAR(10)       | YES      | NULL              | ID provinsi (wilayah API)      |
| city_id               | VARCHAR(10)       | YES      | NULL              | ID kota (wilayah API)          |
| district_id           | VARCHAR(10)       | YES      | NULL              | ID kecamatan (wilayah API)     |
| subdistrict_id        | VARCHAR(10)       | YES      | NULL              | ID kelurahan (wilayah API)     |
| **latitude**          | **DECIMAL(10,8)** | **YES**  | **NULL**          | Koordinat Google Maps          |
| **longitude**         | **DECIMAL(11,8)** | **YES**  | **NULL**          | Koordinat Google Maps          |
| profile_image_url     | VARCHAR(255)      | YES      | NULL              | URL gambar profil              |
| background_image_url  | VARCHAR(255)      | YES      | NULL              | URL gambar background          |
| **use_cloudflare**    | **BOOLEAN**       | **YES**  | **FALSE**         | Flag optimasi Cloudflare       |
| is_active             | BOOLEAN           | NO       | FALSE             | Status aktif toko              |
| created_at            | TIMESTAMP         | NO       | CURRENT_TIMESTAMP | Waktu dibuat                   |
| updated_at            | TIMESTAMP         | NO       | CURRENT_TIMESTAMP | Waktu update terakhir          |

---

## 🧪 Testing Setelah Migration

### 1. Restart Backend Server

Jika backend sedang running, restart:

```bash
# Stop server (Ctrl+C)
# Start ulang
cd Backend
npm start
```

### 2. Test Form Submit

1. Login sebagai seller
2. Klik "Lengkapi Sekarang" di modal
3. Isi form lengkap:
   - Nama toko ✅
   - Nomor telepon ✅
   - Toggle "Tampilkan No. Telepon" ✅
   - Deskripsi ✅
   - Lokasi (via modal) ✅
   - Cloudflare checkbox ✅
4. Klik "Simpan Perubahan"
5. ✅ Harusnya sukses tanpa error 500

### 3. Check Database

```sql
SELECT
  name,
  show_phone_number,
  latitude,
  longitude,
  use_cloudflare,
  is_active
FROM stores
WHERE user_id = [YOUR_USER_ID];
```

Expected: Data tersimpan dengan benar

---

## 🚨 Troubleshooting

### Error: "Column already exists"

Jika error:

```
Error 1060: Duplicate column name 'show_phone_number'
```

**Solusi:** Kolom sudah ada. Skip migration atau drop dulu:

```sql
-- Check kolom yang sudah ada
SHOW COLUMNS FROM stores LIKE 'show_phone_number';

-- Jika ada tapi tipe salah, drop dulu
ALTER TABLE stores DROP COLUMN show_phone_number;

-- Lalu tambah lagi dengan tipe yang benar
ALTER TABLE stores
ADD COLUMN show_phone_number BOOLEAN DEFAULT FALSE AFTER business_phone;
```

---

### Error: Permission Denied

```
Error 1142: ALTER command denied to user
```

**Solusi:** Login sebagai user dengan privilege ALTER:

```bash
mysql -u root -p
```

Atau grant privilege:

```sql
GRANT ALTER ON toco.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

---

### Verify Migration Success

Run this query untuk pastikan semua kolom ada:

```sql
SELECT
  COLUMN_NAME,
  DATA_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'toco'
  AND TABLE_NAME = 'stores'
  AND COLUMN_NAME IN (
    'show_phone_number',
    'latitude',
    'longitude',
    'use_cloudflare'
  );
```

**Expected Output:**

```
+-----------------------+--------------+-------------+----------------+
| COLUMN_NAME           | DATA_TYPE    | IS_NULLABLE | COLUMN_DEFAULT |
+-----------------------+--------------+-------------+----------------+
| show_phone_number     | tinyint      | YES         | 0              |
| latitude              | decimal      | YES         | NULL           |
| longitude             | decimal      | YES         | NULL           |
| use_cloudflare        | tinyint      | YES         | 0              |
+-----------------------+--------------+-------------+----------------+
```

---

## 📝 Migration File Location

Migration SQL file sudah dibuat di:

```
Backend/migrations/add_missing_store_columns.sql
```

Anda bisa jalankan langsung dari file tersebut:

```bash
# Via terminal
mysql -u root -p toco < Backend/migrations/add_missing_store_columns.sql
```

---

## ✅ Checklist

- [ ] Connect ke MySQL
- [ ] Select database Toco
- [ ] Execute migration SQL
- [ ] Verify kolom baru dengan `DESCRIBE stores`
- [ ] Restart backend server
- [ ] Test form submit
- [ ] Check data tersimpan di database
- [ ] Confirm is_active = true setelah submit

---

**Status:** 🔧 **READY TO MIGRATE**  
**Impact:** High (blocking seller store setup)  
**Required:** Yes (before any seller can complete setup)
