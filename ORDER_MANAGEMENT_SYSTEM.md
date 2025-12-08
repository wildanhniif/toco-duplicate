# 📦 ORDER MANAGEMENT SYSTEM - Complete Specification

## Overview

Comprehensive order management system dengan user & seller views, RajaOngkir shipping integration, dan Midtrans payment gateway.

---

## 🗄️ Database Schema (Already Exists)

### `orders` Table:

```sql
- order_id (PK)
- order_number (unique)
- user_id (FK)
- store_id (FK)
- shipping_address_id (FK)
- status (pending, payment_pending, paid, processing, shipped, delivered, cancelled, returned)
- payment_status (unpaid, paid, refunded)
- subtotal_amount
- shipping_cost
- voucher_discount
- total_amount
- notes
- paid_at
- shipped_at
- delivered_at
- cancelled_at
- created_at
- updated_at
```

### `order_items` Table:

```sql
- order_item_id (PK)
- order_id (FK)
- product_id (FK)
- product_sku_id (FK, nullable)
- quantity
- unit_price
- total_price (computed)
```

### `order_shipments` Table:

```sql
- shipment_id (PK)
- order_id (FK)
- courier_code (JNE, ANTERAJA, SICEPAT, dll)
- service_code
- service_name
- tracking_number
- etd_min_days
- etd_max_days
- shipping_cost
- shipped_at
- delivered_at
```

---

## 📊 Status Mapping

### User Side Status:

- **Belum Dibayar:** payment_status = 'unpaid'
- **Berlangsung:** status IN ('paid', 'processing', 'shipped')
- **Selesai:** status = 'delivered'
- **Dibatalkan:** status = 'cancelled'

### Seller Side Status:

- **Pesanan Baru:** status = 'paid' AND shipped_at IS NULL
- **Belum Dikirim:** status = 'processing'
- **Dikirim:** status = 'shipped'
- **Selesai:** status = 'delivered'
- **Dibatalkan:** status = 'cancelled'

---

## 🔌 Backend API Endpoints

### User APIs (`/api/orders/my`)

#### 1. GET `/api/orders/my/stats`

**Get order counts by status for user dropdown**

```json
Response:
{
  "unpaid": 2,
  "ongoing": 5,
  "delivered": 10,
  "cancelled": 1,
  "total": 18
}
```

#### 2. GET `/api/orders/my`

**Get user's orders with filtering**

```
Query params:
- status: all|unpaid|ongoing|delivered|cancelled
- q: search query (order_number, product_name)
- page: 1
- limit: 20
- sort: created_desc|created_asc

Response:
{
  "orders": [{
    "order_id": 1,
    "order_number": "TRX-20241130-ABC",
    "store_name": "Toko Case",
    "total_amount": 25000,
    "status": "shipped",
    "payment_status": "paid",
    "items_count": 2,
    "product_image": "url",
    "created_at": "2024-11-30T10:00:00Z"
  }],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

#### 3. GET `/api/orders/my/:id`

**Get order detail**

```json
Response:
{
  "order": {...},
  "items": [{...}],
  "shipping": {...},
  "logs": [{...}]
}
```

---

### Seller APIs (`/api/orders/seller`)

#### 1. GET `/api/orders/seller/stats`

**Get order counts by status for seller dashboard**

```json
Response:
{
  "new_orders": 5,
  "to_ship": 3,
  "shipped": 10,
  "delivered": 50,
  "cancelled": 2,
  "total": 70
}
```

#### 2. GET `/api/orders/seller`

**Get seller's orders with advanced filtering**

```
Query params:
- status: all|new|to_ship|shipped|delivered|cancelled
- q: search query
- period: today|yesterday|7days|30days|this_month|custom
- start_date: YYYY-MM-DD (if period=custom)
- end_date: YYYY-MM-DD (if period=custom)
- courier: all|sicepat|anteraja|gosend|paxel|pos|jnt|jne
- sort: newest|oldest
- page: 1
- limit: 20

Response:
{
  "orders": [{
    "order_id": 1,
    "order_number": "TRX-20241130-ABC",
    "customer_name": "John Doe",
    "total_amount": 25000,
    "status": "shipped",
    "payment_status": "paid",
    "courier_code": "anteraja",
    "items_count": 2,
    "created_at": "2024-11-30T10:00:00Z"
  }],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

## 🎨 User Interface

### User Side

#### 1. **User Profile Dropdown Enhancement**

```
┌────────────────────────────┐
│ [👤 Photo]                 │
│ John Doe                   │
│ Bergabung sejak Nov 2024   │
├────────────────────────────┤
│ 📦 Belum Dibayar (2)       │
│ 🚚 Berlangsung (5)         │
│ ✅ Tiba di Tujuan (10)     │
├────────────────────────────┤
│ [Lihat Semua Pesanan]     │
├────────────────────────────┤
│ Pengaturan                 │
│ Keluar                     │
└────────────────────────────┘
```

#### 2. **User Orders Page** (`/user/orders`)

```
┌─────────────────────────────────────────────────┐
│ Pesanan Saya                                    │
├─────────────────────────────────────────────────┤
│ [Semua] [Belum Dibayar] [Berlangsung]          │
│ [Selesai] [Dibatalkan]                         │
├─────────────────────────────────────────────────┤
│ 🔍 Cari pesanan...                              │
├─────────────────────────────────────────────────┤
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ 🏪 Toko Case                             │   │
│ │ TRX-20241130-ABC                         │   │
│ │ [IMG] Case HP                            │   │
│ │       Biru, Infinix Hot 50               │   │
│ │       Rp 15.000 x 1                      │   │
│ │ Status: Sedang Dikirim                   │   │
│ │ 30 Nov 2024                              │   │
│ │ [Lihat Detail] [Hubungi Penjual]        │   │
│ └──────────────────────────────────────────┘   │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

### Seller Side

#### **Seller Orders Page** (`/seller/orders`)

```
┌─────────────────────────────────────────────────────────────┐
│ Daftar Pesanan                                              │
├─────────────────────────────────────────────────────────────┤
│ [Daftar Pesanan] [Pesanan Baru (5)] [Belum Dikirim (3)]   │
│ [Dikirim (10)] [Selesai (50)] [Dibatalkan (2)]            │
├─────────────────────────────────────────────────────────────┤
│ 🔍 [Cari pesanan...] [📅 Periode ▼] [⬆️ Urutan ▼]       │
│                      [🚚 Filter Kurir ▼] [↺ Reset]        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ TRX-20241130-ABC          Rp 25.000    [Proses Pesanan│ │
│ │ John Doe | 081234567890                               │ │
│ │ [IMG] Case HP x 1                                     │ │
│ │ AnterAja - Reguler                                    │ │
│ │ Status: Pesanan Baru                                  │ │
│ │ 30 Nov 2024, 10:30                                    │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Period Filter Dropdown:**

```
┌──────────────────────┐
│ 📅 Semua Periode     │
├──────────────────────┤
│ ○ Hari Ini          │
│ ○ Kemarin           │
│ ○ 7 Hari Terakhir   │
│ ○ 30 Hari Terakhir  │
│ ○ Bulan Ini         │
│ ○ Custom Tanggal    │
│   [📅] [📅]        │
└──────────────────────┘
```

**Courier Filter:**

```
┌──────────────────────┐
│ 🚚 Semua Kurir       │
├──────────────────────┤
│ ☐ SiCepat           │
│ ☐ AnterAja          │
│ ☐ GoSend            │
│ ☐ Paxel             │
│ ☐ POS Indonesia     │
│ ☐ J&T               │
│ ☐ JNE               │
└──────────────────────┘
```

---

## 🚀 Integration

### RajaOngkir API (Already Integrated in Cart)

- Endpoint: `https://rajaongkir.komerce.id/api/v1`
- Features: Shipping cost calculation
- Used in: Cart → Shipping selection

### Midtrans Payment Gateway (Sandbox)

- Endpoint: `https://api.sandbox.midtrans.com`
- Features: Payment processing
- Flow:
  1. Create order → Get payment URL
  2. User pays via Midtrans
  3. Webhook updates order status
  4. Order status: unpaid → paid

---

## 📋 Implementation Checklist

### Backend:

- [x] Order creation (existing)
- [ ] Get user order stats
- [ ] Get user orders with filters
- [ ] Get seller order stats
- [ ] Enhanced seller orders with period & courier filter
- [ ] Order status update APIs
- [ ] Midtrans integration

### Frontend:

- [ ] User profile dropdown with order counts
- [ ] User orders page with tabs
- [ ] Seller orders page with advanced filters
- [ ] Order detail pages
- [ ] Payment integration UI

---

**Created:** 2024-11-30
**Status:** In Progress
