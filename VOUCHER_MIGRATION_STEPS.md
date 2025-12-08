# 🎟️ Voucher System - Migration Steps (BEST SOLUTION)

## ✅ Solution: Update Existing Table

Kita upgrade table `vouchers` yang sudah ada dengan menambah kolom baru, sambil tetap support kolom lama untuk backward compatibility.

---

## 🚀 Quick Start (5 Steps)

### **Step 1: Run Migration SQL** ⚡

**File:** `Backend/migrations/update_vouchers_table.sql`

**Di phpMyAdmin:**

1. Open phpMyAdmin
2. Select database: `toco_clone`
3. Go to SQL tab
4. Copy-paste semua isi file `update_vouchers_table.sql`
5. Click Execute

✅ **This will:**

- Add new columns (voucher_type, target_type, apply_to, status, etc.)
- Keep all existing data safe
- Add indexes for performance
- Update status based on dates
- Rename voucher_usages → voucher_usage

---

### **Step 2: Verify Migration** ⚡

Run this in phpMyAdmin:

```sql
USE toco_clone;

-- Check new columns
DESCRIBE vouchers;

-- Check existing data
SELECT
  voucher_id,
  code,
  COALESCE(title, name) as title,
  voucher_type,
  target_type,
  status,
  started_at,
  expired_at
FROM vouchers
LIMIT 5;

-- Should show your existing vouchers with new columns
```

---

### **Step 3: Restart Backend** ⚡

Backend controller sudah di-update untuk support kedua format!

```bash
cd Backend
npm run dev
```

✅ **Backend will work with both:**

- Old data (using `code`, `name`, `type`, `started_at`)
- New data (using `voucher_code`, `title`, `discount_type`, `start_date`)

---

### **Step 4: Test API** ⚡

Test dengan Postman/Thunder Client:

#### Get Existing Vouchers

```http
GET http://localhost:5000/api/vouchers
Authorization: Bearer YOUR_TOKEN
```

Expected: List existing vouchers dengan format baru

#### Create New Voucher

```http
POST http://localhost:5000/api/vouchers
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "voucher_type": "discount",
  "target_type": "public",
  "title": "Test Diskon 15%",
  "start_date": "2024-12-01T00:00:00",
  "end_date": "2024-12-31T23:59:59",
  "quota": 50,
  "apply_to": "all_products",
  "discount_type": "percentage",
  "discount_value": 15,
  "max_discount": 30000,
  "min_transaction": 75000
}
```

---

### **Step 5: Build Frontend** ⚡

Sekarang backend ready, tinggal buat frontend!

```
Frontend/src/views/seller/vouchers/
├── index.tsx    # List page
├── add.tsx      # Create form
└── edit/[id].tsx # Edit form
```

---

## 📊 What Changed?

### **New Columns Added:**

| Column           | Type         | Description                           |
| ---------------- | ------------ | ------------------------------------- |
| `voucher_type`   | ENUM         | discount / free_shipping              |
| `target_type`    | ENUM         | public / private                      |
| `title`          | VARCHAR(255) | Title (alias for name)                |
| `apply_to`       | ENUM         | all_products / specific_products      |
| `status`         | ENUM         | upcoming / active / ended / cancelled |
| `estimated_cost` | DECIMAL      | Estimated budget                      |
| `quota`          | INT          | Alias for usage_limit                 |
| `quota_used`     | INT          | Alias for usage_count                 |
| `limit_per_user` | INT          | Alias for user_usage_limit            |
| `deleted_at`     | TIMESTAMP    | Soft delete                           |

### **Backward Compatibility:**

| Old Column         | New Column       | Controller Mapping       |
| ------------------ | ---------------- | ------------------------ |
| `code`             | `voucher_code`   | ✅ Both supported        |
| `name`             | `title`          | ✅ COALESCE(title, name) |
| `type`             | `discount_type`  | ✅ Both supported        |
| `started_at`       | `start_date`     | ✅ Both supported        |
| `expired_at`       | `end_date`       | ✅ Both supported        |
| `usage_limit`      | `quota`          | ✅ Both supported        |
| `usage_count`      | `quota_used`     | ✅ Both supported        |
| `user_usage_limit` | `limit_per_user` | ✅ Both supported        |

### **Benefits:**

- ✅ **Old data tetap work** - Controller auto-map ke format baru
- ✅ **New features available** - Voucher type, target, status tracking
- ✅ **Zero downtime** - Migration seamless
- ✅ **Future-proof** - Easy to add more features

---

## 🎯 Feature Matrix

| Feature                     | Old Table | After Migration |
| --------------------------- | --------- | --------------- |
| Discount voucher            | ✅        | ✅              |
| Free shipping               | ❌        | ✅              |
| Public voucher              | ✅        | ✅              |
| Private voucher (with code) | ❌        | ✅              |
| Apply to all products       | ✅        | ✅              |
| Apply to specific products  | ✅        | ✅              |
| Status tracking             | Manual    | ✅ Auto         |
| Usage limit                 | ✅        | ✅              |
| Soft delete                 | ❌        | ✅              |
| Estimated cost              | ❌        | ✅              |

---

## 🔍 Verification Queries

### Check Migration Success

```sql
-- Should show all new columns
DESCRIBE vouchers;

-- Should return existing vouchers count
SELECT COUNT(*) as total_vouchers FROM vouchers;

-- Check status auto-update
SELECT
  voucher_id,
  COALESCE(title, name) as title,
  status,
  started_at,
  expired_at,
  CASE
    WHEN NOW() < started_at THEN 'should be upcoming'
    WHEN NOW() BETWEEN started_at AND expired_at THEN 'should be active'
    WHEN NOW() > expired_at THEN 'should be ended'
  END as expected_status
FROM vouchers
LIMIT 10;
```

### Test Backward Compatibility

```sql
-- Old format query should still work
SELECT
  voucher_id,
  code,
  name,
  type,
  value,
  usage_limit,
  usage_count
FROM vouchers;

-- New format query also works
SELECT
  voucher_id,
  COALESCE(code, voucher_code) as voucher_code,
  COALESCE(title, name) as title,
  voucher_type,
  target_type,
  quota,
  quota_used,
  status
FROM vouchers;
```

---

## 📝 API Response Example

### Old Data (existing vouchers):

```json
{
  "voucher_id": 1,
  "voucher_code": "DISC20",
  "title": "Diskon 20%",
  "voucher_type": "discount",
  "target_type": "public",
  "discount_type": "percentage",
  "discount_value": 20,
  "quota": 100,
  "quota_used": 15,
  "remaining_quota": 85,
  "status": "active",
  "start_date": "2024-11-01T00:00:00Z",
  "end_date": "2024-12-31T23:59:59Z"
}
```

### New Data (after migration):

Same format! Controller handles both seamlessly.

---

## 🚨 Troubleshooting

### Error: Column already exists

```
Skip - column already added in previous run
```

### Error: Duplicate key

```sql
-- Check for duplicate indexes
SHOW INDEX FROM vouchers;

-- Drop if needed
ALTER TABLE vouchers DROP INDEX idx_voucher_code;
```

### Old data tidak muncul

```sql
-- Check if deleted_at is set
SELECT * FROM vouchers WHERE deleted_at IS NOT NULL;

-- Clear if needed
UPDATE vouchers SET deleted_at = NULL WHERE deleted_at IS NOT NULL;
```

### Status tidak update otomatis

```sql
-- Manually trigger status update
UPDATE vouchers
SET status = CASE
  WHEN NOW() < started_at THEN 'upcoming'
  WHEN NOW() BETWEEN started_at AND expired_at THEN 'active'
  WHEN NOW() > expired_at THEN 'ended'
END;
```

---

## ✅ Success Checklist

After migration:

- [ ] All existing vouchers visible in API
- [ ] Can create new vouchers with new features
- [ ] Can edit existing vouchers
- [ ] Status auto-updates based on dates
- [ ] Filters work (status, search, period, sort)
- [ ] Duplicate voucher works
- [ ] End voucher works
- [ ] Soft delete works

---

## 📦 Files Modified

1. ✅ `Backend/migrations/update_vouchers_table.sql` - Migration script
2. ✅ `Backend/controllers/voucherController.js` - Updated with backward compatibility
3. ✅ `Backend/routes/voucherSellerRoutes.js` - Already updated
4. ✅ `VOUCHER_MIGRATION_STEPS.md` - This guide

---

**Status:** Migration Ready ✅  
**Risk Level:** Low (backward compatible)  
**Downtime:** Zero  
**Data Loss Risk:** None (existing data preserved)

**Next:** Run Step 1-4, then build frontend! 🚀
