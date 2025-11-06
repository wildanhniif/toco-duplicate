# Panduan Testing - Voucher Promosi Dashboard Seller

## Deskripsi

Dokumentasi lengkap untuk testing endpoint voucher promosi di dashboard seller. Fitur mencakup create voucher, list voucher dengan filter/sort, duplicate voucher, dan end voucher.

---

## Daftar Endpoint

1. **POST** `/api/vouchers` - Create voucher baru
2. **GET** `/api/vouchers/my` - List voucher seller dengan filter/sort
3. **GET** `/api/vouchers/:id` - Detail voucher
4. **POST** `/api/vouchers/:id/duplicate` - Duplikasi voucher
5. **PUT** `/api/vouchers/:id/end` - Akhiri voucher

**Authentication:** Semua endpoint memerlukan Bearer Token (Seller)

---

## 1. CREATE VOUCHER

### Endpoint

**POST** `/api/vouchers`

### Request Body (Voucher Diskon - Persentase)

```json
{
  "voucher_type": "discount",
  "target": "public",
  "title": "Diskon Spesial Hari Raya",
  "description": "Dapatkan diskon hingga 50% untuk semua produk",
  "type": "percent",
  "value": 50,
  "max_discount": 100000,
  "min_discount": 10000,
  "min_order_amount": 50000,
  "start_at": "2025-11-01 00:00:00",
  "end_at": "2025-11-30 23:59:59",
  "usage_limit_total": 100,
  "usage_limit_per_user": 2,
  "code": "HARI_RAYA_50",
  "applicable_to": "all_products",
  "product_ids": []
}
```

### Request Body (Voucher Diskon - Potongan)

```json
{
  "voucher_type": "discount",
  "target": "private",
  "title": "Cashback 20rb",
  "description": "Potongan langsung Rp 20.000",
  "type": "fixed",
  "value": 20000,
  "min_order_amount": 100000,
  "start_at": "2025-11-01 00:00:00",
  "end_at": "2025-11-30 23:59:59",
  "usage_limit_total": 200,
  "usage_limit_per_user": null,
  "code": "CASHBACK20",
  "applicable_to": "specific_products",
  "product_ids": [1, 2, 3]
}
```

### Request Body (Voucher Gratis Ongkir)

```json
{
  "voucher_type": "free_shipping",
  "target": "public",
  "title": "Gratis Ongkir",
  "description": "Gratis ongkir untuk semua pembelian",
  "min_order_amount": 75000,
  "start_at": "2025-11-01 00:00:00",
  "end_at": "2025-11-30 23:59:59",
  "usage_limit_total": 500,
  "usage_limit_per_user": 1,
  "code": "GRATISONGKIR",
  "applicable_to": "all_products",
  "product_ids": []
}
```

### Response Success (201 Created)

```json
{
  "message": "Voucher berhasil dibuat",
  "voucher": {
    "voucher_id": 1,
    "store_id": 2,
    "code": "HARI_RAYA_50",
    "voucher_type": "discount",
    "type": "percent",
    "value": "50.00",
    "max_discount": "100000.00",
    "min_discount": "10000.00",
    "min_order_amount": "50000.00",
    "title": "Diskon Spesial Hari Raya",
    "description": "Dapatkan diskon hingga 50% untuk semua produk",
    "target": "public",
    "applicable_to": "all_products",
    "start_at": "2025-11-01 00:00:00",
    "end_at": "2025-11-30 23:59:59",
    "usage_limit_total": 100,
    "usage_limit_per_user": 2,
    "is_active": 1,
    "created_at": "2025-10-31T10:00:00.000Z",
    "updated_at": "2025-10-31T10:00:00.000Z",
    "product_count": 0,
    "estimated_expenditure": 10000000,
    "products": []
  }
}
```

### Response Error

- **400 Bad Request:** Validasi gagal
- **403 Forbidden:** User tidak punya store
- **500 Server Error:** Server error

---

## 2. GET MY VOUCHERS (List dengan Filter/Sort)

### Endpoint

**GET** `/api/vouchers/my`

### Query Parameters

| Parameter       | Type     | Required | Default           | Deskripsi                                                                                       |
| --------------- | -------- | -------- | ----------------- | ----------------------------------------------------------------------------------------------- |
| `status`        | string   | No       | `all`             | Filter: `all`, `upcoming`, `ongoing`, `ended`                                                   |
| `type`          | string   | No       | -                 | Filter: `discount`, `free_shipping`                                                             |
| `target`        | string   | No       | -                 | Filter: `public`, `private`                                                                     |
| `q`             | string   | No       | -                 | Search by title/description                                                                     |
| `period_preset` | string   | No       | -                 | Preset: `today`, `yesterday`, `last_7_days`, `last_30_days`, `this_month`                       |
| `period_type`   | string   | No       | -                 | Type: `custom` (butuh `period_start` & `period_end`)                                            |
| `period_start`  | datetime | No       | -                 | Start date untuk custom period                                                                  |
| `period_end`    | datetime | No       | -                 | End date untuk custom period                                                                    |
| `sort`          | string   | No       | `created_at_desc` | Sort: `created_at_desc`, `created_at_asc`, `usage_desc`, `usage_asc`, `title_asc`, `title_desc` |
| `page`          | number   | No       | `1`               | Halaman                                                                                         |
| `limit`         | number   | No       | `20`              | Jumlah item per halaman                                                                         |

### Contoh Request

**1. Ambil semua voucher:**

```bash
GET /api/vouchers/my
Authorization: Bearer YOUR_TOKEN
```

**2. Filter by status = ongoing:**

```bash
GET /api/vouchers/my?status=ongoing
Authorization: Bearer YOUR_TOKEN
```

**3. Filter by type = discount:**

```bash
GET /api/vouchers/my?type=discount
Authorization: Bearer YOUR_TOKEN
```

**4. Search voucher:**

```bash
GET /api/vouchers/my?q=hari%20raya
Authorization: Bearer YOUR_TOKEN
```

**5. Filter periode hari ini:**

```bash
GET /api/vouchers/my?period_preset=today
Authorization: Bearer YOUR_TOKEN
```

**6. Filter periode custom:**

```bash
GET /api/vouchers/my?period_type=custom&period_start=2025-11-01%2000:00:00&period_end=2025-11-30%2023:59:59
Authorization: Bearer YOUR_TOKEN
```

**7. Sort by kuota terbanyak:**

```bash
GET /api/vouchers/my?sort=usage_desc
Authorization: Bearer YOUR_TOKEN
```

**8. Kombinasi filter + sort + pagination:**

```bash
GET /api/vouchers/my?status=ongoing&type=discount&target=public&q=diskon&sort=created_at_desc&page=1&limit=20
Authorization: Bearer YOUR_TOKEN
```

### Response Success (200 OK)

```json
{
  "vouchers": [
    {
      "voucher_id": 1,
      "store_id": 2,
      "code": "HARI_RAYA_50",
      "voucher_type": "discount",
      "type": "percent",
      "value": "50.00",
      "max_discount": "100000.00",
      "min_discount": "10000.00",
      "min_order_amount": "50000.00",
      "title": "Diskon Spesial Hari Raya",
      "description": "Dapatkan diskon hingga 50% untuk semua produk",
      "target": "public",
      "applicable_to": "all_products",
      "start_at": "2025-11-01T00:00:00.000Z",
      "end_at": "2025-11-30T23:59:59.000Z",
      "usage_limit_total": 100,
      "usage_limit_per_user": 2,
      "is_active": 1,
      "created_at": "2025-10-31T10:00:00.000Z",
      "updated_at": "2025-10-31T10:00:00.000Z",
      "usage_count": 25,
      "product_count": 0,
      "status": "ongoing",
      "nominal": "50% (maks 100,000)"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20
}
```

---

## 3. GET VOUCHER BY ID

### Endpoint

**GET** `/api/vouchers/:id`

### Response Success (200 OK)

```json
{
  "voucher": {
    "voucher_id": 1,
    "store_id": 2,
    "code": "HARI_RAYA_50",
    "voucher_type": "discount",
    "type": "percent",
    "value": "50.00",
    "max_discount": "100000.00",
    "min_discount": "10000.00",
    "min_order_amount": "50000.00",
    "title": "Diskon Spesial Hari Raya",
    "description": "Dapatkan diskon hingga 50% untuk semua produk",
    "target": "public",
    "applicable_to": "all_products",
    "start_at": "2025-11-01T00:00:00.000Z",
    "end_at": "2025-11-30T23:59:59.000Z",
    "usage_limit_total": 100,
    "usage_limit_per_user": 2,
    "is_active": 1,
    "created_at": "2025-10-31T10:00:00.000Z",
    "updated_at": "2025-10-31T10:00:00.000Z",
    "usage_count": 25,
    "status": "ongoing",
    "products": []
  }
}
```

### Response Error

- **404 Not Found:** Voucher tidak ditemukan atau bukan milik store seller
- **403 Forbidden:** User tidak punya store

---

## 4. DUPLICATE VOUCHER

### Endpoint

**POST** `/api/vouchers/:id/duplicate`

### Response Success (201 Created)

```json
{
  "message": "Voucher berhasil diduplikasi",
  "voucher": {
    "voucher_id": 2,
    "store_id": 2,
    "code": "VCHR-A1B2C3D4",
    "title": "Diskon Spesial Hari Raya (Copy)",
    ...
  }
}
```

### Response Error

- **404 Not Found:** Voucher tidak ditemukan
- **403 Forbidden:** User tidak punya store

---

## 5. END VOUCHER

### Endpoint

**PUT** `/api/vouchers/:id/end`

### Response Success (200 OK)

```json
{
  "message": "Voucher berhasil diakhiri"
}
```

### Response Error

- **404 Not Found:** Voucher tidak ditemukan
- **403 Forbidden:** User tidak punya store

---

## Testing Checklist

### Create Voucher

- [ ] Create voucher diskon persentase (public, all products)
- [ ] Create voucher diskon persentase (private, specific products)
- [ ] Create voucher diskon potongan (public, all products)
- [ ] Create voucher diskon potongan (private, specific products)
- [ ] Create voucher gratis ongkir (public, all products)
- [ ] Create voucher gratis ongkir (private, specific products)
- [ ] Test validasi: voucher_type harus 'discount' atau 'free_shipping'
- [ ] Test validasi: target harus 'public' atau 'private'
- [ ] Test validasi: title wajib diisi
- [ ] Test validasi: periode berakhir harus setelah periode dimulai
- [ ] Test validasi: kuota harus > 0
- [ ] Test validasi: persentase harus 0-100
- [ ] Test validasi: max_discount wajib untuk persentase
- [ ] Test validasi: min_order_amount wajib untuk potongan
- [ ] Test validasi: product_ids wajib jika applicable_to = 'specific_products'
- [ ] Test validasi: product_ids harus milik store seller
- [ ] Test code otomatis generate jika tidak diisi
- [ ] Test code unique (tidak boleh duplikat)

### Get My Vouchers

- [ ] Test tanpa filter (ambil semua)
- [ ] Test filter status: `all`, `upcoming`, `ongoing`, `ended`
- [ ] Test filter type: `discount`, `free_shipping`
- [ ] Test filter target: `public`, `private`
- [ ] Test search by title
- [ ] Test search by description
- [ ] Test period_preset: `today`, `yesterday`, `last_7_days`, `last_30_days`, `this_month`
- [ ] Test period custom dengan period_start & period_end
- [ ] Test sort: `created_at_desc`, `created_at_asc`, `usage_desc`, `usage_asc`, `title_asc`, `title_desc`
- [ ] Test pagination (page & limit)
- [ ] Test kombinasi semua filter
- [ ] Verify response field `status` (upcoming/ongoing/ended)
- [ ] Verify response field `nominal` (format yang benar)
- [ ] Verify response field `usage_count`
- [ ] Verify response field `product_count`

### Get Voucher By ID

- [ ] Test ambil detail voucher
- [ ] Test voucher dengan applicable_to = 'all_products'
- [ ] Test voucher dengan applicable_to = 'specific_products' (ada products array)
- [ ] Test voucher tidak ditemukan (404)
- [ ] Test voucher bukan milik store seller (404)

### Duplicate Voucher

- [ ] Test duplicate voucher dengan applicable_to = 'all_products'
- [ ] Test duplicate voucher dengan applicable_to = 'specific_products'
- [ ] Verify code baru ter-generate
- [ ] Verify title ditambah "(Copy)"
- [ ] Verify semua field ter-copy kecuali code
- [ ] Verify voucher_products ter-copy jika applicable_to = 'specific_products'

### End Voucher

- [ ] Test end voucher
- [ ] Verify end_at di-update ke sekarang
- [ ] Verify is_active di-set ke 0
- [ ] Test end voucher yang sudah ended

---

## Catatan Penting

1. **Authentication wajib:** Semua endpoint memerlukan Bearer token dari user yang punya store
2. **Store ownership:** Seller hanya bisa manage voucher milik store-nya
3. **Estimasi pengeluaran:** Dihitung otomatis:
   - Persentase: `kuota × max_discount`
   - Potongan: `kuota × nominal`
   - Gratis ongkir: `0` (estimasi sulit karena tergantung shipping cost)
4. **Status voucher:** Determined secara otomatis:
   - `upcoming`: sekarang < start_at
   - `ongoing`: start_at <= sekarang <= end_at
   - `ended`: sekarang > end_at
5. **Code generation:** Otomatis generate dengan format `VCHR-XXXX` jika tidak diisi
6. **Transaction:** Create voucher menggunakan transaction untuk konsistensi data

---

## Cara Mendapatkan Auth Token

1. **Login sebagai seller:**

```bash
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "seller@example.com",
  "password": "password123"
}
```

2. **Copy token dari response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

3. **Gunakan token di header:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Database Schema Updates

**Tabel `vouchers`** telah di-update dengan field:

- `store_id` - Voucher milik store
- `voucher_type` - 'discount' | 'free_shipping'
- `title` - Judul promosi
- `description` - Deskripsi promosi
- `target` - 'public' | 'private'
- `applicable_to` - 'all_products' | 'specific_products'
- `min_discount` - Minimum diskon untuk persentase

**Tabel `voucher_products`** (baru):

- Relasi voucher dengan produk tertentu
- Digunakan jika `applicable_to = 'specific_products'`

**Perlu dijalankan:** Update database dengan script SQL di `toco_clone (2).sql`
