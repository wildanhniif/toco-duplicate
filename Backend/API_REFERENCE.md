# API Reference - Backend Blibli/Toco Clone

Base URL: `/api`
Auth: Bearer JWT on protected endpoints (`Authorization: Bearer <token>`)

## Health Check

- GET `/health` (public) → server status and database connection
  - 200:
    {
    "status": "OK",
    "timestamp": "2025-11-12T15:30:00.000Z",
    "database": "connected",
    "uptime": 3600.5
    }

## Auth (/api/auth)

- POST `/register`

  - Body:
    {
    "fullName": "Budi Santoso",
    "phoneNumber": "081234567890",
    "email": "budi@example.com",
    "password": "secret123"
    }
  - 201:
    {
    "message": "Registrasi berhasil. Cek email untuk verifikasi.",
    "user_id": 123
    }

- POST `/verify-email`

  - Body:
    {
    "email": "budi@example.com",
    "otp": "123456"
    }
  - 200: { "message": "Email terverifikasi" }

- POST `/login`

  - Body:
    {
    "identifier": "budi@example.com",
    "password": "secret123"
    }
  - 200:
    {
    "token": "<JWT>",
    "user": { "user_id": 8, "name": "Budi Santoso", "role": "seller", "store_id": 5 }
    }

- GET `/google`
  - Redirect to Google OAuth (no body)
- GET `/google/callback`
  - 200 on success with token or 409 if user not registered

## Users (/api/users)

- GET `/profile` (auth)
  - 200:
    {
    "user_id": 8,
    "full_name": "Budi Santoso",
    "email": "budi@example.com",
    "phone_number": "081234567890",
    "created_at": "2025-10-31T07:33:14Z"
    }

## Addresses (/api/addresses)

- POST `/` (auth)

  - Body:
    {
    "label": "Rumah",
    "recipient_name": "Budi Santoso",
    "phone_number": "081234567890",
    "latitude": -6.175392,
    "longitude": 106.827153,
    "map_address": "Monas...",
    "address_detail": "Lantai 2, dekat patung kuda",
    "postal_code": "10110",
    "province": "DKI JAKARTA",
    "city": "KOTA JAKARTA PUSAT",
    "district": "Gambir",
    "sub_district": "Gambir",
    "is_default": 1
    }
  - 201: { "userAddress_id": 2 }

- GET `/user/:userId` (auth) → list addresses
- PUT `/:addressId` (auth) → update
- DELETE `/:addressId` (auth) → delete

## Wilayah (/api/wilayah)

- GET `/provinces`
- GET `/cities?id_provinsi=32`
- GET `/districts?id_kabupaten=32.73`
- GET `/subdistricts?id_kecamatan=32.73.16`

## Seller (/api/sellers)

- POST `/register` (auth) → jadikan user sebagai seller dan buat toko
- GET `/stores/me` (auth) → detail toko milik user saat ini
  - 200:
    {
    "store": {
      "store_id": 5,
      "name": "Toko Saya",
      "slug": "toko-saya",
      "description": "Deskripsi toko",
      "is_active": true,
      "created_at": "2025-11-12T10:00:00Z"
    }
    }
- PUT `/stores/me` (auth, multipart)
  - Fields: profile_image, background_image, plus form fields store
  - 200: { "message": "Store updated" }
- Sub-routes mounted under `/stores/me` (auth): see Store Settings & Templates

## Store Settings (mounted under /api/sellers/stores/me)

- GET `/settings` (auth) → detail pengaturan toko + about page
- PUT `/settings` (auth)
  - Body:
    {
    "is_on_holiday": true,
    "holiday_start_date": "2025-12-20",
    "holiday_end_date": "2025-12-27",
    "show_phone_number": 1
    }
- PUT `/about` (auth, multipart)

  - Fields: `thumbnail` (file), `title`, `content`

- GET `/courier` (auth) → { is_active, max_delivery_km, distance_rates, weight_rates }
- PUT `/courier` (auth)

  - Body:
    {
    "is_active": true,
    "max_delivery_km": 999,
    "distance_rates": [{ "from_km": 0, "to_km": 5, "price": 10000 }],
    "weight_rates": [{ "above_weight_gr": 1000, "additional_price": 3000 }]
    }

- GET `/logistics` (auth) → list couriers and services with isSelected
- PUT `/logistics` (auth)
  - Body: { "selected_service_ids": [10,11,14,15,16] }

## Reply Templates (mounted under /api/sellers/stores/me/templates)

- GET `/` (auth) → list templates
- POST `/` (auth)
  - Body: { "content": "Siap, kak!" }
- PUT `/order` (auth)
  - Body:
    {
    "templates": [ { "reply_id": 1, "order": 0 }, { "reply_id": 2, "order": 1 } ]
    }
- PUT `/:templateId` (auth)
  - Body: { "content": "Ada yang bisa dibantu?" }
- DELETE `/:templateId` (auth)

## Categories (/api/categories)

- POST `/` → create
  - Body: { "name": "Pakaian Pria", "parent_id": null }
- GET `/tree` → hierarchical list
- GET `/` → flat list
- GET `/:id` → detail
- PUT `/:id` → update
- DELETE `/:id` → delete

## Products (/api/products)

- GET `/` → search/browse products (public)
  - Query examples: `?q=kaos&category_id=3&page=1&limit=20&sort=created_desc`
- POST `/` (auth) → create product

  - Body (marketplace minimal):
    {
    "name": "Kaos Polos Premium",
    "category_id": 3,
    "description": "Kaos bahan premium",
    "price": 75000,
    "stock": 10,
    "weight_gram": 200,
    "images": ["/uploads/products/img1.jpg"],
    "variants": [{"name": "Color", "options": ["Black","White"]}],
    "skus": [{"sku_code":"KAOS-BLACK-M","price":75000,"stock":5,"option_map": {"Color":"Black","Size":"M"}}]
    }
  - 201: { "product_id": 9 }

- GET `/:id` → detail by id/slug (public)
- PUT `/:id` (auth) → full update
- DELETE `/:id` (auth)

- POST `/:id/images` (auth, multipart) → upload images (field `images` up to 10)
- PATCH `/:id/quick-update` (auth)
  - Body: { "price": 70000, "stock": 15 }
- PUT `/:id/status` (auth)
  - Body: { "status": "active" }
- POST `/:id/duplicate` (auth) → duplicate product
- POST `/:id/promote` (auth)
  - Body: { "expires_at": "2025-12-31 23:59:59" }
- DELETE `/:id/promote` (auth)

- GET `/my` (auth seller) → list my products
- PATCH `/bulk/status` (auth)
  - Body: { "product_ids": [5,6,7], "status": "inactive" }
- DELETE `/bulk` (auth)

  - Body: { "product_ids": [5,6,7] }

- GET `/meta/form?category_id=5` → dynamic form meta for create/edit product

## Cart (/api/cart)

- GET `/` (auth) → current cart summary
- POST `/items` (auth)
  - Body:
    {
    "product_id": 5,
    "store_id": 5,
    "product_sku_id": 1,
    "quantity": 2
    }
- PUT `/items/:cart_item_id` (auth)
  - Body: { "quantity": 3, "selected": 1 }
- DELETE `/items/:cart_item_id` (auth)
- PATCH `/select` (auth)
  - Body: { "selected": 1 } // select/deselect all
- PUT `/address` (auth)
  - Body: { "userAddress_id": 1 }
- PUT `/shipping/:store_id` (auth)
  - Body:
    {
    "courier_code": "jne",
    "service_code": "REG",
    "service_name": "JNE Regular",
    "etd_min_days": 2,
    "etd_max_days": 3,
    "delivery_fee": 18000,
    "note": null
    }
- PUT `/voucher` (auth)
  - Body: { "voucher_code": "HARI_RAYA_50" }
- POST `/validate-voucher` (auth)
  - Body: { "voucher_code": "HARI_RAYA_50" }

## Checkout (/api/checkout)

- GET `/` (auth) → checkout summary (items selected, shipping, address, totals)

## Orders (/api/orders)

- POST `/` (auth) → create orders per store from selected cart
  - 201: { "orders": [{ "order_id": 1, "order_code": "TC251110-XXXX" }], ... }
- GET `/my` (auth) → list my orders
  - Query: `?status=all|processing|...&q=...&page=1&limit=20&sort=created_desc|created_asc`
- GET `/my/:id` (auth) → my order detail
- GET `/seller` (auth seller) → list orders for my store

## Payments (/api/payments)

- POST `/init` (auth)

  - Body: { "order_id": 1 }
  - 200:
    {
    "token": "<midtrans_snap_token>",
    "redirect_url": "https://app.midtrans.com/snap/v2/vtweb/...",
    "order": { "order_code": "TC251110-XXXX", "total_amount": 1616000 }
    }

- POST `/notification` (public webhook)

  - Body (Midtrans sample): { "order_id": "TC251110-XXXX", "status_code": "200", ... }
  - 200: { "received": true }

- GET `/status/:order_code` (auth)
  - 200:
    {
    "order_code": "TC251110-XXXX",
    "payment_status": "paid",
    "provider": "midtrans",
    "reference": "A120251110..."
    }

## Shipping (/api/shipping)

- GET `/rates` (auth) → list available courier/services for store selection
- GET `/destination/province` (auth)
- GET `/destination/city/:province_id` (auth)
- GET `/destination/district/:city_id` (auth)
- GET `/destination/sub-district/:district_id` (auth)
- GET `/destination/domestic-destination` (auth) → search by keyword

- POST `/calculate/domestic` (auth)
  - Body:
    {
    "origin": { "lat": -6.92, "lng": 107.62 },
    "destination": { "lat": -6.17, "lng": 106.82 },
    "weight_gram": 1200,
    "courier_code": "jne",
    "service_code": "REG"
    }
- POST `/calculate/international` (auth) → similar body, with country codes
- POST `/track/waybill` (auth)
  - Body: { "courier_code": "jne", "waybill": "1234567890" }

## Vouchers (Seller) (/api/vouchers)

- POST `/` (auth seller)

  - Body (example percent):
    {
    "code": "HARI_RAYA_50",
    "voucher_type": "discount",
    "type": "percent",
    "value": 50,
    "max_discount": 100000,
    "min_discount": 10000,
    "min_order_amount": 50000,
    "title": "Diskon Spesial Hari Raya",
    "description": "Dapatkan diskon hingga 50%",
    "target": "public",
    "applicable_to": "all_products",
    "start_at": "2025-11-01 00:00:00",
    "end_at": "2025-11-30 23:59:59",
    "usage_limit_total": 100,
    "usage_limit_per_user": 2
    }

- GET `/my` (auth) → list vouchers
  - Query: `?status=active|ended&q=&page=1&limit=20&sort=created_desc`
- GET `/:id` (auth) → voucher detail
- POST `/:id/duplicate` (auth)
- PUT `/:id/end` (auth) → end voucher now

## Options and Examples Summary

Headers for protected endpoints:
Authorization: Bearer <JWT>
Content-Type: application/json

Example JWT: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

Static files: `/uploads/...` served publicly.

POST /api/categories/bulk