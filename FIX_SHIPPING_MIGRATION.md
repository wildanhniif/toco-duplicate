# Fix Shipping Tables Migration Error

## ❌ Error You Got

```
#1005 - Can't create table `toco_clone`.`store_courier_config`
(errno: 150 "Foreign key constraint is incorrectly formed")
```

---

## 🔍 Root Cause

Error 150 (foreign key constraint) terjadi karena salah satu dari:

1. **Table `stores` belum ada** di database
2. **Column `store_id`** di table `stores` bukan INT atau bukan PRIMARY KEY
3. **Table order salah** - table yang di-reference harus dibuat duluan
4. **Engine tidak sama** - semua table harus InnoDB
5. **Charset tidak match**

---

## ✅ Solution - 2 Options

### Option 1: Use FIXED Migration File (Recommended)

Saya sudah buat file baru: **`create_shipping_tables_FIXED.sql`**

**Changes:**

- ✅ Added `DROP TABLE` statements (proper order)
- ✅ Explicit `ENGINE=InnoDB` on all tables
- ✅ Explicit `DEFAULT CHARSET=utf8mb4`
- ✅ Create tables in correct order (no dependencies first)
- ✅ Foreign keys to `stores` added via `ALTER TABLE` (safer)
- ✅ Better error handling

**Run this:**

```sql
-- In phpMyAdmin or MySQL Workbench:
USE toco;
SOURCE c:/Users/WILDAN HANIF/Desktop/Blibli/Backend/migrations/create_shipping_tables_FIXED.sql;
```

OR copy-paste entire file content into phpMyAdmin SQL tab.

---

### Option 2: Manual Fix Step-by-Step

#### Step 1: Check if `stores` table exists

```sql
USE toco;
SHOW TABLES LIKE 'stores';
```

If **NOT EXISTS**, you need to create it first or check database name.

#### Step 2: Check `stores` structure

```sql
DESCRIBE stores;
```

**Expected:**

```
store_id | INT | PRIMARY KEY
```

If column is named differently (e.g., `id` instead of `store_id`), you need to:

- Either update migration to use correct column name
- Or add `store_id` column to stores table

#### Step 3: Drop existing failed tables

```sql
DROP TABLE IF EXISTS store_courier_services;
DROP TABLE IF EXISTS courier_weight_pricing;
DROP TABLE IF EXISTS courier_distance_pricing;
DROP TABLE IF EXISTS courier_service_types;
DROP TABLE IF EXISTS courier_services;
DROP TABLE IF EXISTS store_courier_config;
```

#### Step 4: Run FIXED migration

Use the new file `create_shipping_tables_FIXED.sql`

---

## 🎯 Quick Fix Commands

### If `stores` table uses `id` instead of `store_id`:

**Option A: Update migration file**
Replace all instances:

```sql
-- Find:
FOREIGN KEY (store_id) REFERENCES stores(store_id)

-- Replace with:
FOREIGN KEY (store_id) REFERENCES stores(id)
```

**Option B: Add store_id column** (if it doesn't exist)

```sql
ALTER TABLE stores ADD COLUMN store_id INT;
UPDATE stores SET store_id = id;
ALTER TABLE stores ADD UNIQUE KEY (store_id);
```

---

## 📋 Verification Steps

After running migration, verify:

```sql
-- 1. Check tables created
SHOW TABLES LIKE '%courier%';
-- Should show 6 tables

-- 2. Check courier services
SELECT * FROM courier_services;
-- Should show 7 rows (GoSend, J&T, etc)

-- 3. Check service types
SELECT * FROM courier_service_types;
-- Should show 28 rows

-- 4. Check foreign keys
SELECT
    TABLE_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM
    information_schema.KEY_COLUMN_USAGE
WHERE
    TABLE_SCHEMA = 'toco'
    AND TABLE_NAME LIKE '%courier%'
    AND REFERENCED_TABLE_NAME IS NOT NULL;
```

---

## 🔧 Common Issues & Solutions

### Issue 1: "Table 'stores' doesn't exist"

**Solution:** Create stores table first or check database name

```sql
SHOW DATABASES;
USE correct_database_name;
```

### Issue 2: "Column 'store_id' doesn't exist in table 'stores'"

**Solution:** Check actual column name

```sql
DESCRIBE stores;
-- Then update migration to use correct column
```

### Issue 3: "Cannot delete or update a parent row"

**Solution:** Drop tables in reverse order

```sql
-- Child tables first, parent tables last
DROP TABLE IF EXISTS store_courier_services;
DROP TABLE IF EXISTS courier_service_types;
-- etc...
```

### Issue 4: "Engine type doesn't match"

**Solution:** Ensure all tables are InnoDB

```sql
ALTER TABLE stores ENGINE=InnoDB;
```

---

## 📝 What I Changed in FIXED File

### 1. Table Creation Order

```
✅ courier_services (no dependencies)
✅ courier_service_types (depends on courier_services)
✅ store_courier_config (depends on stores)
✅ courier_distance_pricing (depends on store_courier_config)
✅ courier_weight_pricing (depends on store_courier_config)
✅ store_courier_services (depends on stores + courier_service_types)
```

### 2. Added Engine & Charset

```sql
CREATE TABLE courier_services (
    ...
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 3. Safer Foreign Keys

```sql
-- Create table without FK first
CREATE TABLE store_courier_config (
    id INT PRIMARY KEY,
    store_id INT NOT NULL,
    ...
);

-- Add FK separately (will show error if fails, but won't block table creation)
ALTER TABLE store_courier_config
ADD CONSTRAINT fk_store_courier_config_store
FOREIGN KEY (store_id) REFERENCES stores(store_id) ON DELETE CASCADE;
```

---

## 🚀 Recommended Action

**Use the FIXED file:**

1. Open **phpMyAdmin**
2. Select database **`toco`** (or your actual database name)
3. Go to **SQL** tab
4. Copy entire content of **`create_shipping_tables_FIXED.sql`**
5. Paste and click **Go**
6. Check results

**If still error:** Send me the error message and output of:

```sql
DESCRIBE stores;
```

---

## ✅ Success Indicators

You know it worked when:

```sql
SELECT COUNT(*) FROM courier_services;
-- Returns: 7

SELECT COUNT(*) FROM courier_service_types;
-- Returns: 28

SELECT * FROM courier_services;
-- Shows: GoSend, J&T, SiCepat, Paxel, JNE, Anteraja, POS
```

---

**File Ready:** `create_shipping_tables_FIXED.sql` ✅  
**Status:** Ready to run!
