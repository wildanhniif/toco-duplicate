# Panduan Testing - Orders API

## Endpoints

- POST /api/orders -> Create order dari checkout (selected cart)
- GET /api/orders/my -> List pesanan saya (user)
- GET /api/orders/my/:id -> Detail pesanan saya (user)
- GET /api/orders/seller -> Daftar pesanan (seller)

Authentication: Bearer token (wajib)

---

## 1) Create Order

Request:

```
POST /api/orders
Authorization: Bearer <TOKEN>
```

Response 201:

```json
{
  "message": "Order created",
  "orders": [
    {
      "order_id": 10,
      "order_code": "TC2511XX-ABCD",
      "store_id": 2,
      "total_amount": 250000
    }
  ]
}
```

Error umum:

- 400 Cart is empty
- 400 Alamat pengiriman belum dipilih
- 400 Stok tidak cukup untuk product_id X

---

## 2) Pesanan Saya (User)

```
GET /api/orders/my?status=all&q=&sort=created_desc&page=1&limit=20
Authorization: Bearer <TOKEN>
```

Respon:

```json
{ "orders": [...], "total": 5, "page": 1, "limit": 20 }
```

Detail:

```
GET /api/orders/my/10
Authorization: Bearer <TOKEN>
```

Respon:

```json
{ "order": {...}, "items": [...], "shipping": {...}, "logs": [...] }
```

---

## 3) Daftar Pesanan (Seller)

```
GET /api/orders/seller?status=all&q=&sort=created_desc&page=1&limit=20
Authorization: Bearer <TOKEN>
```

Respon:

```json
{ "orders": [...], "total": 8, "page": 1, "limit": 20 }
```

---

## Checklist

- [ ] Create order dengan beberapa store (harus menghasilkan beberapa order)
- [ ] Validasi stok berkurang sesuai quantity
- [ ] Voucher & ongkir terpindah ke order secara benar
- [ ] Cart selected dibersihkan setelah order
- [ ] User dapat melihat list & detail order miliknya
- [ ] Seller dapat melihat list order tokonya
- [ ] Status awal = pending_unpaid, payment_status = unpaid
- [ ] Riwayat status pertama tercatat (Order created)
