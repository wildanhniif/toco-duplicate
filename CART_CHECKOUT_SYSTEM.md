# 🛒 CART & CHECKOUT SYSTEM - Complete Guide

## Overview

Comprehensive cart and checkout system with address management, shipping selection, voucher application, and payment processing.

---

## 📊 DATABASE SCHEMA

### Existing Tables:

#### **carts**

```sql
- cart_id (PK)
- user_id (FK -> users)
- shipping_address_id (FK -> user_addresses)
- created_at
- updated_at
```

#### **cart_items**

```sql
- cart_item_id (PK)
- cart_id (FK -> carts)
- product_id (FK -> products)
- sku_id (FK -> product_skus, nullable for variation)
- quantity
- unit_price
- is_selected (untuk checkbox select)
- created_at
- updated_at
```

#### **cart_shipping_selections**

```sql
- shipping_selection_id (PK)
- cart_id (FK -> carts)
- store_id (FK -> stores)
- courier_code (JNE, AnterAja, dll)
- service_code (REG, YES, dll)
- service_name
- etd_min_days
- etd_max_days
- shipping_cost
- created_at
- updated_at
```

#### **cart_vouchers**

```sql
- cart_voucher_id (PK)
- cart_id (FK -> carts)
- voucher_id (FK -> vouchers)
- discount_amount
- created_at
```

#### **user_addresses**

```sql
- address_id (PK)
- user_id (FK -> users)
- label (Rumah, Kantor, dll)
- recipient_name
- phone_number
- address_line
- province
- city
- district
- subdistrict
- postal_code
- latitude
- longitude
- is_default
- deleted_at (soft delete)
- created_at
- updated_at
```

#### **orders**

```sql
- order_id (PK)
- order_number (unique)
- user_id (FK -> users)
- store_id (FK -> stores)
- shipping_address_id (FK -> user_addresses)
- status (pending, paid, processing, shipped, delivered, cancelled, returned)
- payment_status (unpaid, paid, refunded)
- subtotal_amount
- shipping_cost
- voucher_discount
- total_amount
- currency (IDR)
- notes
- paid_at
- shipped_at
- delivered_at
- cancelled_at
- cancellation_reason
- created_at
- updated_at
```

#### **order_items**

```sql
- order_item_id (PK)
- order_id (FK -> orders)
- product_id (FK -> products)
- sku_id (FK -> product_skus, nullable)
- quantity
- unit_price
- total_price (computed: quantity * unit_price)
- created_at
```

#### **order_shipments**

```sql
- shipment_id (PK)
- order_id (FK -> orders)
- courier_code
- service_code
- service_name
- tracking_number
- etd_min_days
- etd_max_days
- shipping_cost
- shipped_at
- delivered_at
- created_at
- updated_at
```

---

## 🔌 BACKEND API ENDPOINTS

### **Cart APIs** (`/api/cart`)

#### 1. GET `/api/cart`

**Get user's cart with items**

```json
Response:
{
  "success": true,
  "cart": {
    "cart_id": 1,
    "user_id": 1,
    "shipping_address_id": 5,
    "shipping_address": {...},
    "items": [
      {
        "cart_item_id": 1,
        "product_id": 10,
        "product_name": "Case HP",
        "product_image": "url",
        "sku_id": 20,
        "variation": "Biru, Infinix Hot 50",
        "stock": 50,
        "quantity": 1,
        "unit_price": 15000,
        "original_price": 55000,
        "discount_percent": 73,
        "is_selected": true,
        "store_id": 3,
        "store_name": "Toko Case",
        "weight": 100
      }
    ],
    "selected_count": 1,
    "total_price": 15000,
    "total_weight": 100
  }
}
```

#### 2. POST `/api/cart/items`

**Add product to cart**

```json
Request:
{
  "product_id": 10,
  "sku_id": 20,  // optional
  "quantity": 1
}

Response:
{
  "success": true,
  "message": "Product added to cart",
  "cart_item_id": 1
}
```

#### 3. PUT `/api/cart/items/:cart_item_id`

**Update cart item quantity**

```json
Request:
{
  "quantity": 2
}

Response:
{
  "success": true,
  "message": "Cart updated"
}
```

#### 4. DELETE `/api/cart/items/:cart_item_id`

**Delete single cart item**

```json
Response:
{
  "success": true,
  "message": "Item removed from cart"
}
```

#### 5. DELETE `/api/cart/items`

**Delete multiple cart items**

```json
Request:
{
  "cart_item_ids": [1, 2, 3]
}

Response:
{
  "success": true,
  "message": "3 items removed from cart"
}
```

#### 6. PUT `/api/cart/items/select`

**Update item selection (checkbox)**

```json
Request:
{
  "cart_item_id": 1,
  "is_selected": true
}

// OR select all:
{
  "select_all": true,
  "is_selected": true
}

Response:
{
  "success": true,
  "message": "Selection updated"
}
```

#### 7. PUT `/api/cart/address`

**Update shipping address**

```json
Request:
{
  "shipping_address_id": 5
}

Response:
{
  "success": true,
  "message": "Shipping address updated"
}
```

---

### **Checkout APIs** (`/api/checkout`)

#### 1. GET `/api/checkout/calculate`

**Calculate shipping cost & total**

```json
Request Query:
?address_id=5

Response:
{
  "success": true,
  "checkout_data": {
    "items": [...],
    "subtotal": 15000,
    "shipping_options": [
      {
        "courier_code": "anteraja",
        "courier_name": "AnterAja",
        "services": [
          {
            "service_code": "reg",
            "service_name": "Reguler",
            "etd": "1-2 hari",
            "cost": 10000
          }
        ]
      }
    ],
    "voucher_discount": 0,
    "additional_costs": [],
    "total": 25000
  }
}
```

#### 2. POST `/api/checkout/apply-voucher`

**Apply voucher code**

```json
Request:
{
  "voucher_code": "DISC50"
}

Response:
{
  "success": true,
  "voucher": {
    "voucher_id": 1,
    "code": "DISC50",
    "discount_amount": 5000
  },
  "new_total": 20000
}
```

#### 3. POST `/api/checkout/create-order`

**Create order from cart**

```json
Request:
{
  "shipping_address_id": 5,
  "courier_code": "anteraja",
  "service_code": "reg",
  "voucher_id": 1,  // optional
  "notes": "Hati-hati barang pecah belah"
}

Response:
{
  "success": true,
  "order": {
    "order_id": 100,
    "order_number": "TRX-20241130-001",
    "total_amount": 20000,
    "payment_url": "midtrans_snap_url"
  }
}
```

---

### **Address APIs** (`/api/user/addresses`)

#### 1. GET `/api/user/addresses`

**Get all user addresses**

```json
Response:
{
  "success": true,
  "addresses": [
    {
      "address_id": 5,
      "label": "Rumah",
      "recipient_name": "John Doe",
      "phone_number": "081234567890",
      "address_line": "Jl. Sudirman No. 123",
      "province": "DKI Jakarta",
      "city": "Jakarta Selatan",
      "district": "Kebayoran Baru",
      "subdistrict": "Melawai",
      "postal_code": "12345",
      "is_default": true
    }
  ]
}
```

#### 2. POST `/api/user/addresses`

**Create new address**

#### 3. PUT `/api/user/addresses/:address_id`

**Update address**

#### 4. DELETE `/api/user/addresses/:address_id`

**Delete address (soft delete)**

#### 5. PUT `/api/user/addresses/:address_id/default`

**Set default address**

---

## 🎨 FRONTEND PAGES

### **1. Cart Page** (`/cart`)

#### Layout:

```
+---------------------------------------------------+
| [✓ Pilih Semua]                        [Hapus]   |
+---------------------------------------------------+
|                                                    |
| +-----------------------------------------------+ |
| | 🏪 Toko Case                                  | |
| +-----------------------------------------------+ |
| | [✓] [IMG] Case HP                             | |
| |           Biru, Infinix Hot 50                | |
| |           Stock: 10                           | |
| |           Rp 15.000 (73% off from 55.000)     | |
| |           [-] 1 [+]                    [🗑️]   | |
| +-----------------------------------------------+ |
|                                                    |
+---------------------------------------------------+
|                                                    |
| SIDEBAR (Sticky):                                 |
| +---------------------+                           |
| | Dikirim ke:         |                           |
| | [Dropdown Address]  |                           |
| +---------------------+                           |
| | Ringkasan Belanja   |                           |
| | Total: Rp 15.000    |                           |
| | [Pakai Voucher] ⚡  |                           |
| | [Beli (1)]          |                           |
| +---------------------+                           |
+---------------------------------------------------+
```

#### Components Needed:

- ✅ `CartPageHeader` - Pilih semua & Hapus
- ✅ `CartItemCard` - Display per item dengan checkbox, quantity, delete
- ✅ `CartSummary` - Sticky sidebar ringkasan belanja
- ✅ `AddressSelector` - Dropdown pilih alamat pengiriman

---

### **2. Checkout Page** (`/checkout`)

#### Layout:

```
+---------------------------------------------------+
| Alamat Pengiriman                        [Ubah]  |
| John Doe | 081234567890                           |
| Jl. Sudirman No. 123, Kebayoran Baru             |
+---------------------------------------------------+
|                                                    |
| +-----------------------------------------------+ |
| | 🏪 Toko Case                                  | |
| +-----------------------------------------------+ |
| | [IMG] Case HP                                 | |
| |       Biru, Infinix Hot 50                    | |
| |       1 product (100g)                        | |
| |       Rp 15.000 x 1                           | |
| |       Diskon 73% (dari Rp 55.000)             | |
| +-----------------------------------------------+ |
| | Pilih Pengiriman: [Reguler (1-2 hari) ▼]     | |
| | Pilih Kurir: [AnterAja ▼]                     | |
| | Biaya Ongkir: Rp 10.000                       | |
| | Catatan: [Text area...]                       | |
| +-----------------------------------------------+ |
|                                                    |
+---------------------------------------------------+
|                                                    |
| SIDEBAR (Sticky):                                 |
| +---------------------+                           |
| | Ringkasan Belanja   |                           |
| | Subtotal (1): 15.000|                           |
| | Ongkir: 10.000      |                           |
| | Voucher: -5.000 ⚡  |                           |
| | Total: Rp 20.000    |                           |
| | [Beli (1)]          |                           |
| +---------------------+                           |
+---------------------------------------------------+
```

#### Components Needed:

- ✅ `CheckoutAddressCard` - Display & edit alamat pengiriman
- ✅ `CheckoutItemCard` - Display product dengan variasi & harga
- ✅ `ShippingSelector` - Select courier & service
- ✅ `VoucherInput` - Apply voucher code
- ✅ `OrderSummary` - Sticky sidebar dengan total & tombol bayar
- ✅ `AddressModal` - CRUD address di checkout

---

## 🚀 IMPLEMENTATION ORDER

### Phase 1: Backend APIs ✅

1. Cart Controller (`/Backend/controllers/cartController.js`)
2. Checkout Controller (`/Backend/controllers/checkoutController.js`)
3. Address Controller (`/Backend/controllers/addressController.js`)
4. Routes setup

### Phase 2: Frontend Cart Page ✅

1. `/cart` page
2. CartItemCard component
3. CartSummary component
4. AddressSelector component

### Phase 3: Frontend Checkout Page ✅

1. `/checkout` page
2. CheckoutAddressCard component
3. ShippingSelector component
4. VoucherInput component
5. OrderSummary component

### Phase 4: Testing ✅

1. Add to cart flow
2. Select items & calculate
3. Apply voucher
4. Create order
5. Payment integration

---

## 📝 NOTES

- **Stock validation**: Check di backend saat add to cart & checkout
- **Price snapshot**: Save current price di cart_items, bukan real-time
- **Shipping calculation**: Integrate dengan Biteship/RajaOngkir API
- **Voucher validation**: Check expired, quota, minimum transaction
- **Payment**: Integrate Midtrans Snap
- **Order grouping**: Per store (1 order = 1 store)

---

## ⚡ FEATURES

### Cart Features:

- [x] Add to cart
- [x] Update quantity
- [x] Delete single/multiple items
- [x] Select/unselect items (checkbox)
- [x] Select all items
- [x] Group by store
- [x] Stock indicator
- [x] Price display with discount
- [x] Address selection
- [x] Voucher application

### Checkout Features:

- [x] Address CRUD
- [x] Shipping cost calculation
- [x] Courier selection
- [x] Service type selection (Reguler, Express, etc)
- [x] Voucher code input
- [x] Order notes
- [x] Payment gateway integration
- [x] Order confirmation

---

## 🎯 SUCCESS CRITERIA

✅ User dapat add product ke cart
✅ User dapat update quantity & delete items
✅ User dapat pilih alamat pengiriman
✅ System calculate shipping cost otomatis
✅ User dapat apply voucher code
✅ User dapat create order & proceed to payment
✅ Order berhasil dibuat dengan status pending
✅ Payment URL generated

---

**Created:** 2024-11-30
**Status:** Ready for Implementation
**Estimated Time:** 4-6 hours
