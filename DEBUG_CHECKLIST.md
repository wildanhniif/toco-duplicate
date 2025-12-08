# Debug Checklist - Product List Not Showing

## Masalah

Produk ada di database (product_id=1, store_id=32) tapi tidak muncul di halaman daftar produk seller.

## Langkah Debug (LAKUKAN BERURUTAN)

### 1. Fix Database Status NULL ✅

```sql
-- Jalankan ini di MySQL
UPDATE products SET status = 'draft' WHERE status IS NULL;

-- Verifikasi
SELECT product_id, name, status, store_id FROM products WHERE store_id = 32;
```

### 2. Test Query Manual di Database

```sql
-- Jalankan query ini untuk memastikan produk bisa diambil
SELECT p.*,
    (SELECT url FROM product_images WHERE product_id = p.product_id ORDER BY sort_order ASC LIMIT 1) AS image_url,
    (SELECT name FROM categories WHERE category_id = p.category_id) AS category_name
FROM products p
WHERE p.store_id = 32
ORDER BY p.created_at DESC
LIMIT 20;
```

**Expected:** Harusnya return minimal 1 row produk

### 3. Restart Backend dengan Benar

```bash
cd Backend
# Tekan Ctrl+C untuk stop server yang lama
node index.js
```

**Pastikan:** Terminal menunjukkan "Server running on port 5000"

### 4. Test API Endpoint Manual

Buka browser/Postman dan test:

```
GET http://localhost:5000/api/products/my?status=all&page=1&limit=20&sort=created_at_desc
Headers:
  Authorization: Bearer <your_token>
```

**Expected Response:**

```json
{
  "products": [...],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

### 5. Cek Backend Terminal Log

Saat request ke `/api/products/my`, terminal harusnya menunjukkan:

```
=== getMyProducts Debug ===
User ID: 10
User object: { user_id: 10, store_id: 32, ... }
Query params: { status: 'all', page: '1', limit: '20', ... }
Store query result: [ { store_id: 32 } ]
Store ID from query: 32
Store ID from token: 32
SQL Query: SELECT p.*, ...
WHERE conditions: [ 'p.store_id = ?' ]
Params: [ 32, ... ]
Total found: 1
Products count: 1
Products: [ { product_id: 1, name: 'iphone 16', ... } ]
```

**Jika muncul error atau empty, catat pesannya!**

### 6. Cek Browser Console

Buka `/seller/products` dan buka DevTools (F12):

**Console Tab** - harusnya ada:

```
Products data: { products: [...], total: 1, ... }
Total products: 1
```

**Network Tab** - cek request:

- Request: `GET /api/products/my?status=all&page=1&limit=20&sort=created_at_desc`
- Status: 200 OK
- Response: JSON dengan products array

**Jika 401/403:** Token salah atau expired
**Jika 500:** Ada error di backend (cek terminal)
**Jika 200 tapi products empty:** Ada masalah di query

### 7. Cek useAuth Hook

Pastikan token valid:

```typescript
// Di frontend, cek apakah token ada
const { token, user } = useAuth();
console.log("Token:", token);
console.log("User:", user);
```

**Expected:**

- token: string JWT (eyJhbGc...)
- user: { user_id: 10, store_id: 32, role: 'seller', ... }

## Kemungkinan Masalah

### A. Status NULL di Database

**Gejala:** Query tidak return produk
**Fix:** Jalankan UPDATE status di step 1

### B. store_id Tidak Match

**Gejala:** Total found: 0
**Fix:** Cek store_id di token vs store_id di produk

### C. Token Expired/Invalid

**Gejala:** 401 Unauthorized
**Fix:** Logout lalu login ulang

### D. Frontend Tidak Kirim Token

**Gejala:** 401 Unauthorized
**Fix:** Cek useAuth hook return token

### E. Query Condition Salah

**Gejala:** Total found: 0 padahal produk ada
**Fix:** Cek WHERE conditions di backend log

## Yang Sudah Diperbaiki

✅ Unique slug generation (fix ER_DUP_ENTRY)
✅ Handle status NULL di query
✅ Debug logging di backend getMyProducts
✅ Debug logging di frontend fetchProducts
✅ Fix useAuth integration

## Hasil Akhir yang Diharapkan

Setelah semua fix:

1. Buka `/seller/products`
2. Tab "Semua Produk" aktif
3. Produk "iphone 16" muncul di list
4. Bisa klik edit, delete, dll
