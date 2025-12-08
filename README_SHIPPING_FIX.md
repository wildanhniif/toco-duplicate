# 🚀 QUICK START - Fix Shipping Migration Error

## 📋 5 Files SQL Sudah Siap!

Saya sudah pecah migration menjadi 5 steps agar mudah diikuti:

```
Backend/migrations/
├── STEP_1_CHECK_STORES.sql      ✅ Cek table stores
├── STEP_2_DROP_TABLES.sql       ✅ Hapus table gagal
├── STEP_3_CREATE_WITHOUT_FK.sql ✅ Buat 6 tables
├── STEP_4_ADD_FK.sql            ⚠️ Tambah FK (satu-satu)
└── STEP_5_INSERT_DATA.sql       ✅ Insert 7 couriers
```

---

## ⚡ CARA CEPAT (Copy-Paste di phpMyAdmin)

### 1️⃣ STEP 1: Cek Stores

```sql
-- Buka phpMyAdmin → Pilih database 'toco' → Tab SQL
-- Copy-paste script dari STEP_1_CHECK_STORES.sql
-- Klik Go

-- EXPECTED: Table stores ada, store_id type INT dengan Key PRI
```

### 2️⃣ STEP 2: Drop Tables

```sql
-- Copy-paste script dari STEP_2_DROP_TABLES.sql
-- Klik Go

-- EXPECTED: 0 tables found (semua terhapus)
```

### 3️⃣ STEP 3: Create Tables

```sql
-- Copy-paste script dari STEP_3_CREATE_WITHOUT_FK.sql
-- Klik Go

-- EXPECTED: 6 tables created (courier_services, courier_service_types, dll)
```

### 4️⃣ STEP 4: Add Foreign Keys

```sql
-- ⚠️ JANGAN SEKALIGUS! Jalankan SATU ALTER TABLE per kali
-- Copy FK 1 → Go → Berhasil? Lanjut FK 2
-- FK 4 & 5 boleh error (skip saja)

-- EXPECTED: Minimal 4 FK berhasil dibuat
```

### 5️⃣ STEP 5: Insert Data

```sql
-- Copy-paste script dari STEP_5_INSERT_DATA.sql
-- Klik Go

-- EXPECTED: 7 couriers, 28 service types
```

---

## ✅ Verifikasi Sukses

Jalankan query ini untuk cek:

```sql
-- Cek jumlah courier
SELECT COUNT(*) FROM courier_services;
-- Harus: 7

-- Cek jumlah service types
SELECT COUNT(*) FROM courier_service_types;
-- Harus: 28

-- Cek data
SELECT * FROM courier_services;
-- Harus ada: GoSend, J&T, SiCepat, Paxel, JNE, Anteraja, POS
```

---

## 🎯 Success Criteria

✅ **6 tables** created  
✅ **7 couriers** inserted  
✅ **28 service types** inserted  
⚠️ FK 4 & 5 boleh gagal (tidak masalah untuk sistem)

---

## 📖 Dokumentasi Lengkap

Baca file: `LANGKAH_LENGKAP_SHIPPING.md` untuk penjelasan detail setiap step.

---

## 🆘 Jika Masih Error

**Screenshot error message** dan kirim ke saya dengan info:

1. Step berapa error terjadi?
2. Error message lengkap
3. Hasil dari `DESCRIBE stores;`

---

**Files Location:**

```
c:\Users\WILDAN HANIF\Desktop\Blibli\Backend\migrations\
```

**Start Here:** `STEP_1_CHECK_STORES.sql` 🚀
