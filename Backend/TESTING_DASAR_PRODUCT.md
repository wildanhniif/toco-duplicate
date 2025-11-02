# Panduan Testing - Endpoint Daftar Product Seller

## Endpoint

**GET** `/api/products/my`

**Authentication:** Required (Bearer Token)

## Deskripsi

Endpoint untuk mengambil daftar produk seller di dashboard. Mendukung filtering, sorting, dan pagination.

---

## Query Parameters

| Parameter     | Type   | Required | Default           | Deskripsi                                                         |
| ------------- | ------ | -------- | ----------------- | ----------------------------------------------------------------- |
| `status`      | string | No       | `all`             | Filter status: `all`, `active`, `inactive`, `classified`, `draft` |
| `q`           | string | No       | -                 | Search produk by nama atau SKU                                    |
| `category_id` | number | No       | -                 | Filter by kategori                                                |
| `condition`   | string | No       | -                 | Filter kondisi: `new` atau `used`                                 |
| `stock_min`   | number | No       | -                 | Stock minimum                                                     |
| `stock_max`   | number | No       | -                 | Stock maksimum                                                    |
| `price_min`   | number | No       | -                 | Harga minimum                                                     |
| `price_max`   | number | No       | -                 | Harga maksimum                                                    |
| `sort`        | string | No       | `created_at_desc` | Sorting: `created_at_desc`, `popular`, `price_asc`, `price_desc`  |
| `page`        | number | No       | `1`               | Halaman                                                           |
| `limit`       | number | No       | `20`              | Jumlah item per halaman                                           |

---

## Response Success

**Status Code:** `200 OK`

```json
{
  "products": [
    {
      "product_id": 1,
      "store_id": 2,
      "category_id": 2,
      "name": "Sepatu Lari Pria GO-FAST XTreme",
      "slug": "sepatu-lari-pria-go-fast-xtreme",
      "description": "...",
      "product_classification": "marketplace",
      "price": "799000.00",
      "stock": 150,
      "sku": "GF-XT-NAVY-42",
      "condition": "new",
      "brand": "GO-FAST",
      "weight_gram": 950,
      "dimensions": "{\"length\":32,\"width\":24,\"height\":12}",
      "is_preorder": 0,
      "use_store_courier": 0,
      "insurance": "opsional",
      "status": "inactive",
      "average_rating": "0.00",
      "review_count": 0,
      "created_at": "2025-10-30T15:48:58.000Z",
      "updated_at": "2025-10-30T15:48:58.000Z",
      "image_url": "/uploads/products/image-1.jpg",
      "category_name": "Jasa Perawatan Pribadi",
      "is_promoted": 0
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20
}
```

---

## Response Error

### 1. Unauthorized (403)

```json
{
  "message": "User does not have a store"
}
```

### 2. Unauthorized (401)

```json
{
  "message": "Not authorized, token failed"
}
```

### 3. Server Error (500)

```json
{
  "message": "Server Error"
}
```

---

## Contoh Testing dengan cURL

### 1. Ambil semua produk (tanpa filter)

```bash
curl -X GET "http://localhost:5000/api/products/my" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### 2. Filter by status = active

```bash
curl -X GET "http://localhost:5000/api/products/my?status=active" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### 3. Search produk

```bash
curl -X GET "http://localhost:5000/api/products/my?q=sepatu" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### 4. Filter + Sort

```bash
curl -X GET "http://localhost:5000/api/products/my?status=active&sort=price_asc" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### 5. Filter by kategori dan kondisi

```bash
curl -X GET "http://localhost:5000/api/products/my?category_id=2&condition=new" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### 6. Filter by stock range

```bash
curl -X GET "http://localhost:5000/api/products/my?stock_min=10&stock_max=100" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### 7. Filter by price range

```bash
curl -X GET "http://localhost:5000/api/products/my?price_min=50000&price_max=500000" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### 8. Pagination

```bash
curl -X GET "http://localhost:5000/api/products/my?page=2&limit=10" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### 9. Kombinasi semua filter

```bash
curl -X GET "http://localhost:5000/api/products/my?status=active&q=sepatu&category_id=2&condition=new&stock_min=10&price_min=100000&sort=price_desc&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

---

## Contoh Testing dengan Postman

### Setup:

1. **Method:** GET
2. **URL:** `http://localhost:5000/api/products/my`
3. **Headers:**
   - `Authorization: Bearer YOUR_AUTH_TOKEN`
4. **Params (Query Params):**
   - `status`: `active`
   - `q`: `sepatu`
   - `sort`: `price_desc`
   - `page`: `1`
   - `limit`: `20`

---

## Testing Checklist

- [ ] Test tanpa filter (ambil semua produk)
- [ ] Test filter status: `all`, `active`, `inactive`, `classified`, `draft`
- [ ] Test search by nama produk
- [ ] Test search by SKU
- [ ] Test filter by kategori
- [ ] Test filter by kondisi (`new`, `used`)
- [ ] Test filter stock range (min & max)
- [ ] Test filter price range (min & max)
- [ ] Test sorting: `created_at_desc`, `popular`, `price_asc`, `price_desc`
- [ ] Test pagination (page & limit)
- [ ] Test kombinasi semua filter
- [ ] Test tanpa token (harus error 401)
- [ ] Test dengan user yang tidak punya store (harus error 403)
- [ ] Verify response field `is_promoted` (0 atau 1)
- [ ] Verify response field `image_url` (first image)
- [ ] Verify response field `category_name`
- [ ] Verify total count sesuai dengan filter

---

## Catatan Penting

1. **Authentication wajib:** Semua request harus menyertakan Bearer token
2. **User harus punya store:** Jika user tidak punya store, akan return 403
3. **Total count:** Menunjukkan total produk setelah filter (bukan hanya yang ditampilkan)
4. **is_promoted:** Menunjukkan apakah produk sedang diiklankan (1) atau tidak (0)
5. **SQL Injection Protection:** Semua input sudah di-protect dengan prepared statements

---

## Cara Mendapatkan Auth Token

1. **Login dulu:**

```bash
curl -X POST "http://localhost:5000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "dannif@example.com",
    "password": "password123"
  }'
```

2. **Copy token dari response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

3. **Gunakan token di header Authorization:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
