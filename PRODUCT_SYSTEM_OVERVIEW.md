# Product Management System - Toco

## 📋 Overview

Sistem product management dengan support untuk:

- **Toco Marketplace** - Transaksi via platform
- **Toco Classified** - Media promosi, transaksi di luar platform

### Product Types

1. **Regular (Marketplace)** - Electronics, Fashion, F&B, dll
2. **Motor** - Classified dengan specs motor
3. **Mobil** - Classified dengan specs mobil
4. **Property** - Rumah, Kost, Apartemen

---

## 🗄️ Database Schema

### Tables Created

1. `product_categories` - Kategori produk
2. `products` - Main product table
3. `product_images` - Multiple images per product
4. `product_variants` - Size, Color, Custom variants
5. `product_motor_specs` - Motor specifications
6. `product_car_specs` - Car specifications
7. `product_property_specs` - Property specifications

### Key Fields

#### Products Table

```sql
- product_id (PK)
- store_id (FK)
- category_id (FK)
- name, slug, description
- product_type: marketplace | classified
- price, discount_percentage, final_price (computed)

-- Marketplace specific
- stock, sku, condition_type, brand
- weight, dimensions (l,w,h)
- is_pre_order, use_store_courier
- insurance_type

-- Status
- is_active
```

#### Motor Specs

```sql
- brand, year, model, transmission
- mileage, engine_capacity, color, fuel_type
- tax_expiry_date, completeness
- location (lat, lng)
```

#### Car Specs

```sql
- brand, model, year, transmission
- mileage, license_plate, color, fuel_type
- engine_capacity, seat_capacity
- tax_expiry_date, completeness
- location (lat, lng)
```

#### Property Specs

```sql
- listing_type: sale | rent
- property_type
- building_area, land_area
- bedrooms, bathrooms, floors
- certificate_type, facilities
- location (lat, lng)
```

---

## 🔄 Form Flow (Dynamic)

### Step 1: Informasi Dasar

- ✅ Upload foto produk (multiple)
- ✅ Nama produk
- ✅ Deskripsi
- ✅ Kategori (TRIGGER form change)

### Step 2: Informasi Penjualan

#### Default (Kategori Regular)

```
[x] Pasarkan produk: Marketplace / Classified
[ ] Varian produk (expandable)
    - Tipe varian: Size, Color, Custom
    - Values: S, M, L (or custom)
[x] Harga produk
[x] Diskon (%)
[x] Stok
[x] SKU
[x] Kondisi: Baru / Bekas
[x] Brand
```

#### Motor (Classified)

```
[x] Harga
[Spesifikasi]
  - Merek
  - Tahun
  - Model motor
[x] Transmisi: Manual / Otomatis
[Detail Lainnya]
  - Jarak tempuh (km)
  - Kapasitas mesin (cc)
  - Warna
  - Bahan bakar
[Pajak & Kelengkapan]
  - Tanggal kadaluarsa pajak
  - Kelengkapan (STNK, BPKB)
[x] Lokasi (Google Maps pin)
```

#### Mobil (Classified)

```
[x] Harga
[Spesifikasi]
  - Merek
  - Model
  - Tahun
[x] Transmisi: Manual / Otomatis
[Detail Lainnya]
  - Jarak tempuh (km)
  - Plat nomor
  - Warna
  - Bahan bakar
  - Kapasitas mesin (cc)
  - Jumlah tempat duduk
[Pajak & Kelengkapan]
  - Tanggal kadaluarsa pajak
  - Kelengkapan
[x] Lokasi (Google Maps pin)
```

#### Property (Rumah, Kost, dll)

```
[x] Dijual / Disewakan
[x] Harga
[Spesifikasi]
  - Luas bangunan (m²)
  - Luas tanah (m²)
  - Kamar tidur
  - Kamar mandi
[x] Jumlah lantai
[Sertifikat & Fasilitas]
  - Sertifikat (SHM, SHGB, dll)
  - Fasilitas lingkungan
[x] Lokasi (Google Maps pin)
```

### Step 3: Informasi Pengiriman

(Only for Marketplace products)

```
[x] Berat produk (gram)
[x] Ukuran produk
    - Panjang (cm)
    - Lebar (cm)
    - Tinggi (cm)
[x] Pre-order: Ya / Tidak
[x] Pengiriman kurir toko: Ya / Tidak
    (Check if store has courier config)
[x] Asuransi: Wajib / Opsional
```

### Step 4: Status Produk

```
[x] Aktif: Ya / Tidak
    (Product visible to buyers if active)
```

### Action Buttons

```
[Batalkan]  [Simpan & Tambah Baru]  [Simpan]
```

---

## 🔌 Backend API Endpoints

```
POST   /api/sellers/products              - Create product
GET    /api/sellers/products              - List seller's products
GET    /api/sellers/products/:id          - Get product detail
PUT    /api/sellers/products/:id          - Update product
DELETE /api/sellers/products/:id          - Delete product

POST   /api/sellers/products/:id/images   - Upload product images
DELETE /api/sellers/products/:id/images/:image_id - Delete image

GET    /api/categories                    - Get all categories
GET    /api/categories/:slug              - Get category detail
```

---

## 📦 Request Body Examples

### Create Marketplace Product

```json
{
  "name": "Kaos Polos Premium",
  "description": "Kaos polos cotton combed 30s",
  "category_id": 2,
  "product_type": "marketplace",
  "price": 50000,
  "discount_percentage": 10,
  "stock": 100,
  "sku": "KPS-001",
  "condition_type": "new",
  "brand": "BrandKu",
  "weight": 200,
  "length": 30,
  "width": 25,
  "height": 2,
  "is_pre_order": false,
  "use_store_courier": false,
  "insurance_type": "optional",
  "is_active": true,
  "variants": [
    { "variant_name": "Size", "variant_value": "M", "stock": 30 },
    { "variant_name": "Size", "variant_value": "L", "stock": 40 },
    { "variant_name": "Color", "variant_value": "Black", "stock": 50 }
  ]
}
```

### Create Motor (Classified)

```json
{
  "name": "Honda Beat 2020",
  "description": "Motor matic terawat",
  "category_id": 6,
  "product_type": "classified",
  "price": 12000000,
  "is_active": true,
  "motor_specs": {
    "brand": "Honda",
    "year": 2020,
    "model": "Beat Street",
    "transmission": "automatic",
    "mileage": 15000,
    "engine_capacity": 110,
    "color": "Hitam",
    "fuel_type": "Bensin",
    "tax_expiry_date": "2025-12-31",
    "completeness": "STNK, BPKB, Kunci Serep",
    "location_name": "Jakarta Selatan",
    "latitude": -6.2608,
    "longitude": 106.7817
  }
}
```

### Create Property

```json
{
  "name": "Rumah 2 Lantai Strategis",
  "description": "Rumah ready stock siap huni",
  "category_id": 9,
  "product_type": "classified",
  "price": 850000000,
  "is_active": true,
  "property_specs": {
    "listing_type": "sale",
    "property_type": "Rumah",
    "building_area": 120,
    "land_area": 150,
    "bedrooms": 3,
    "bathrooms": 2,
    "floors": 2,
    "certificate_type": "SHM",
    "facilities": "Dekat sekolah, mall, transportasi",
    "location_name": "Bekasi Timur",
    "latitude": -6.2376,
    "longitude": 107.0042
  }
}
```

---

## 🎨 Frontend Components Structure

```
/seller/products                  - List products
/seller/products/add              - Add new product

Components:
- ProductForm.tsx                 - Main form container
  - BasicInfoSection.tsx          - Step 1: Photos, name, desc, category
  - SalesInfoSection.tsx          - Step 2: Dynamic based on category
    - MarketplaceFields.tsx       - Regular marketplace fields
    - MotorFields.tsx             - Motor specific fields
    - CarFields.tsx               - Car specific fields
    - PropertyFields.tsx          - Property specific fields
  - ShippingInfoSection.tsx       - Step 3: Shipping (marketplace only)
  - ProductStatusSection.tsx      - Step 4: Active/Inactive
  - VariantManager.tsx            - Variant add/remove (modal/expandable)
```

---

## ✅ Validation Rules

### All Products

- ✅ Name: required, max 255 chars
- ✅ Description: required
- ✅ Category: required
- ✅ Price: required, > 0
- ✅ At least 1 image

### Marketplace

- ✅ Stock: required, >= 0
- ✅ Weight: required (for shipping)

### Classified

- ✅ Location: required
- ✅ Category-specific specs: all required fields

### Variants (if enabled)

- ✅ At least 1 variant
- ✅ Each variant: name + value
- ✅ Stock per variant

---

## 🔍 Category Detection Logic

```typescript
const isMotor = category.slug === "motor";
const isMobil = category.slug === "mobil";
const isProperty = ["rumah", "kost", "apartemen"].includes(category.slug);
const isClassified = category.category_type === "classified";

if (isMotor) {
  return <MotorFields />;
} else if (isMobil) {
  return <CarFields />;
} else if (isProperty) {
  return <PropertyFields />;
} else {
  return <MarketplaceFields />;
}
```

---

## 🚀 Implementation Steps

1. ✅ **Database** - Run migration
2. **Backend** - Create controller & routes
3. **Frontend** - Create product form with dynamic sections
4. **Image Upload** - Multer configuration
5. **Variant Manager** - Dynamic add/remove
6. **Google Maps** - Location picker for classified
7. **Testing** - All product types

---

## 📝 Notes

- **Kurir Toko**: Check `store_courier_config` table sebelum enable
- **Google Maps**: Reuse LocationPicker dari shipping settings
- **Images**: Support multiple upload, set primary
- **Variants**: Optional feature, marketplace only
- **Classified**: No shipping info needed

---

**Status:** Database Ready ✅  
**Next:** Backend controller implementation
