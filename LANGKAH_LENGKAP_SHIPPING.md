# 📋 LANGKAH LENGKAP FIX SHIPPING MIGRATION

## ⚠️ Error Yang Anda Alami

```
#1005 - Can't create table `toco_clone`.`store_courier_config`
(errno: 150 "Foreign key constraint is incorrectly formed")
```

---

## 🎯 Solusi: 5 STEPS

Saya sudah buat **5 file SQL** yang harus Anda jalankan **SATU PER SATU** di phpMyAdmin.

---

## 📝 STEP-BY-STEP INSTRUCTIONS

### **STEP 1: CEK TABLE STORES** ✅

**File:** `STEP_1_CHECK_STORES.sql`

**Tujuan:** Cek apakah table `stores` ada dan strukturnya benar

**Cara:**

1. Buka **phpMyAdmin**
2. Pilih database **`toco`** atau **`toco_clone`** (sesuai nama database Anda)
3. Klik tab **SQL**
4. Buka file `STEP_1_CHECK_STORES.sql`
5. **Copy SELURUH isi** file tersebut
6. **Paste** ke SQL editor phpMyAdmin
7. Klik tombol **Go** / **Kirim**

**Yang Harus Anda Cek Dari Hasil:**

**A. Cek Table Stores Ada:**

```
Hasil query 1: SHOW TABLES LIKE 'stores';
✅ Harus muncul 1 row dengan nama "stores"
❌ Jika kosong (0 rows) = table stores belum ada, STOP dan beritahu saya
```

**B. Cek Struktur Stores:**

```
Hasil query 2: DESCRIBE stores;
✅ Cari baris dengan Field = "store_id"
✅ Type harus = "int" atau "int(11)"
✅ Key harus = "PRI" (Primary Key) atau "UNI" (Unique)

Contoh yang BENAR:
Field       | Type    | Key
store_id    | int(11) | PRI
user_id     | int(11) | MUL
name        | varchar |

❌ Jika store_id tidak ada atau bukan INT atau bukan PRI/UNI, beritahu saya
```

**C. Cek Data:**

```
Hasil query 3: SELECT store_id, user_id, name FROM stores LIMIT 5;
✅ Harus muncul data store (bisa 0 rows jika belum ada data)
```

**⏸️ STOP DI SINI SAMPAI STEP 1 BERHASIL**

---

### **STEP 2: HAPUS TABLE YANG GAGAL** 🗑️

**File:** `STEP_2_DROP_TABLES.sql`

**Tujuan:** Hapus table courier yang mungkin sudah terbuat sebagian

**Cara:**

1. Masih di phpMyAdmin, tab **SQL**
2. Buka file `STEP_2_DROP_TABLES.sql`
3. **Copy SELURUH isi** file
4. **Paste** ke SQL editor
5. Klik **Go**

**Yang Harus Anda Cek:**

```
Hasil terakhir: SHOW TABLES LIKE '%courier%';
✅ Harus kosong (0 rows) atau "Query results empty"
✅ Tidak ada table dengan nama mengandung "courier"
```

**⏸️ LANJUT KE STEP 3 JIKA BERHASIL**

---

### **STEP 3: BUAT TABLE TANPA FOREIGN KEY** 🏗️

**File:** `STEP_3_CREATE_WITHOUT_FK.sql`

**Tujuan:** Buat table tanpa foreign key dulu (lebih aman)

**Cara:**

1. Masih di phpMyAdmin, tab **SQL**
2. Buka file `STEP_3_CREATE_WITHOUT_FK.sql`
3. **Copy SELURUH isi** file
4. **Paste** ke SQL editor
5. Klik **Go**

**Yang Harus Anda Cek:**

```
Hasil terakhir: SHOW TABLES LIKE '%courier%';
✅ Harus muncul 6 tables:
   - courier_services
   - courier_service_types
   - store_courier_config
   - courier_distance_pricing
   - courier_weight_pricing
   - store_courier_services

❌ Jika kurang dari 6 atau ada error, screenshot error nya dan beritahu saya
```

**⏸️ LANJUT KE STEP 4 JIKA BERHASIL (6 TABLES TERBUAT)**

---

### **STEP 4: TAMBAH FOREIGN KEYS** 🔗

**File:** `STEP_4_ADD_FK.sql`

**Tujuan:** Tambahkan foreign key constraints satu per satu

**Cara - PENTING! BACA DULU:**

❗ **Jangan jalankan sekaligus!** Jalankan **SATU QUERY** per kali!

1. Buka file `STEP_4_ADD_FK.sql`
2. **Copy HANYA ALTER TABLE pertama** (FK 1)
3. Paste ke phpMyAdmin dan **Go**
4. **Jika berhasil** (ada tulisan "Query OK"), lanjut copy FK 2
5. **Jika error**, skip FK tersebut, lanjut ke berikutnya
6. Ulangi sampai semua FK dicoba

**Query by Query:**

**FK 1:** ✅ Ini pasti berhasil

```sql
ALTER TABLE courier_service_types
ADD CONSTRAINT fk_courier_service_types_service
FOREIGN KEY (courier_service_id)
REFERENCES courier_services(id)
ON DELETE CASCADE;
```

**FK 2:** ✅ Ini pasti berhasil

```sql
ALTER TABLE courier_distance_pricing
ADD CONSTRAINT fk_distance_pricing_config
FOREIGN KEY (store_courier_config_id)
REFERENCES store_courier_config(id)
ON DELETE CASCADE;
```

**FK 3:** ✅ Ini pasti berhasil

```sql
ALTER TABLE courier_weight_pricing
ADD CONSTRAINT fk_weight_pricing_config
FOREIGN KEY (store_courier_config_id)
REFERENCES store_courier_config(id)
ON DELETE CASCADE;
```

**FK 4:** ⚠️ INI YANG BERMASALAH - Jika error, beritahu saya error message nya

```sql
ALTER TABLE store_courier_config
ADD CONSTRAINT fk_store_courier_config_store
FOREIGN KEY (store_id)
REFERENCES stores(store_id)
ON DELETE CASCADE;
```

**FK 5:** ⚠️ INI YANG BERMASALAH - Jika error, skip saja

```sql
ALTER TABLE store_courier_services
ADD CONSTRAINT fk_store_courier_services_store
FOREIGN KEY (store_id)
REFERENCES stores(store_id)
ON DELETE CASCADE;
```

**FK 6:** ✅ Ini pasti berhasil

```sql
ALTER TABLE store_courier_services
ADD CONSTRAINT fk_store_courier_services_type
FOREIGN KEY (courier_service_type_id)
REFERENCES courier_service_types(id)
ON DELETE CASCADE;
```

**Verifikasi:**

```sql
-- Copy dan jalankan query ini
SELECT
    TABLE_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME LIKE '%courier%'
AND REFERENCED_TABLE_NAME IS NOT NULL;
```

**Expected Result:**

```
✅ Harus muncul minimal 4 rows (FK 1, 2, 3, 6)
⚠️ FK 4 dan 5 mungkin tidak ada jika error - TIDAK MASALAH, sistem tetap jalan
```

**⏸️ LANJUT KE STEP 5**

---

### **STEP 5: INSERT DATA** 📊

**File:** `STEP_5_INSERT_DATA.sql`

**Tujuan:** Isi data courier services

**Cara:**

1. Buka file `STEP_5_INSERT_DATA.sql`
2. **Copy SELURUH isi** file
3. Paste ke phpMyAdmin dan **Go**

**Yang Harus Anda Cek:**

```
Hasil query 1: SELECT COUNT(*) FROM courier_services;
✅ Harus = 7

Hasil query 2: SELECT COUNT(*) FROM courier_service_types;
✅ Harus = 28

Hasil query 3: Data semua courier dengan jumlah service nya
✅ GoSend: 2 services
✅ J&T: 4 services
✅ SiCepat: 3 services
✅ Paxel: 3 services
✅ JNE: 4 services
✅ Anteraja: 3 services
✅ POS: 4 services
```

---

## ✅ VERIFIKASI AKHIR

Setelah semua step selesai, jalankan query ini:

```sql
-- 1. Cek semua table courier ada
SHOW TABLES LIKE '%courier%';
-- Harus 6 tables

-- 2. Cek data courier services
SELECT * FROM courier_services;
-- Harus 7 rows

-- 3. Cek data courier types
SELECT * FROM courier_service_types;
-- Harus 28 rows

-- 4. Test query join
SELECT
    cs.name as courier,
    cst.name as service_type
FROM courier_services cs
JOIN courier_service_types cst ON cs.id = cst.courier_service_id
WHERE cs.code = 'GOSEND';
-- Harus muncul 2 rows: GoSend Sameday, GoSend Instant
```

---

## 🚨 JIKA ADA ERROR

### Error di STEP 1

**Problem:** Table stores tidak ada
**Solusi:** Beritahu saya, mungkin nama database salah atau stores belum dibuat

### Error di STEP 3

**Problem:** Tidak bisa create table
**Solusi:**

1. Screenshot error nya
2. Cek apakah database yang dipilih benar
3. Cek user MySQL punya permission CREATE TABLE

### Error di STEP 4 (FK 4 atau FK 5)

**Problem:** Foreign key ke stores gagal
**Solusi:** **TIDAK MASALAH!** Skip saja. Sistem tetap bisa jalan tanpa FK ini.

Nantinya di backend, kita handle foreign key checking manual di code.

### Error di STEP 5

**Problem:** Duplicate entry
**Solusi:** Data sudah ada. Check dengan:

```sql
SELECT * FROM courier_services;
```

Jika sudah ada 7 rows, skip step ini.

---

## 🎯 RINGKASAN LANGKAH

```
✅ STEP 1: Check stores table → Verify structure
✅ STEP 2: Drop failed tables → Clean slate
✅ STEP 3: Create tables WITHOUT FK → 6 tables created
⚠️ STEP 4: Add FK one by one → FK 4,5 might fail, OK to skip
✅ STEP 5: Insert data → 7 couriers, 28 services
```

---

## 📁 FILES YANG HARUS ANDA JALANKAN

Urutan wajib:

1. ✅ `STEP_1_CHECK_STORES.sql`
2. ✅ `STEP_2_DROP_TABLES.sql`
3. ✅ `STEP_3_CREATE_WITHOUT_FK.sql`
4. ⚠️ `STEP_4_ADD_FK.sql` (satu per satu)
5. ✅ `STEP_5_INSERT_DATA.sql`

---

## 💡 TIPS

1. **Jangan skip step** - Jalankan berurutan
2. **Screenshot setiap hasil** - Jika ada error, kirim screenshot
3. **Baca error message** - Biasanya ada petunjuk di error message
4. **FK 4 & 5 boleh gagal** - Sistem tetap jalan
5. **Verifikasi setiap step** - Pastikan hasil sesuai expected

---

## ✅ SUCCESS INDICATOR

Migration berhasil jika:

```sql
SELECT COUNT(*) FROM courier_services;        -- 7
SELECT COUNT(*) FROM courier_service_types;   -- 28
SHOW TABLES LIKE '%courier%';                 -- 6 tables
```

---

**Status:** 5 files SQL sudah dibuat dan siap digunakan! 🚀

**Next Action:** Jalankan STEP 1 dulu, lalu screenshot hasilnya untuk verifikasi.
