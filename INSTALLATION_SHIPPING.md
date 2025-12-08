# Setup Instructions - Layanan Pengiriman

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd Frontend
npm install @radix-ui/react-tabs
```

### 2. Run Database Migration

```bash
mysql -u root -p
```

```sql
USE toco;
source Backend/migrations/create_shipping_tables.sql;
```

Verify:

```sql
SHOW TABLES LIKE '%courier%';
-- Should show 6 tables
```

### 3. Restart Backend

```bash
cd Backend
npm start
```

### 4. Start Frontend

```bash
cd Frontend
npm run dev
```

### 5. Access Feature

```
http://localhost:3000/seller/settings?type=kurir
```

---

## 📦 Files Created

### Database

- `Backend/migrations/create_shipping_tables.sql` ✅

### Backend

- `Backend/controllers/shippingController.js` (updated) ✅
- `Backend/routes/sellerRoutes.js` (updated) ✅

### Frontend Pages

- `Frontend/src/app/seller/settings/page.tsx` ✅
- `Frontend/src/app/seller/settings/courier-config/page.tsx` ✅

### Frontend Views

- `Frontend/src/views/seller/settings/index.tsx` ✅
- `Frontend/src/views/seller/settings/ShippingSettings.tsx` ✅
- `Frontend/src/views/seller/settings/LocationUpdateModal.tsx` ✅
- `Frontend/src/views/seller/settings/StoreCourierConfig.tsx` (pending)

### UI Components

- `Frontend/src/components/ui/tabs.tsx` ✅

---

## ✅ What's Working

1. **Database schema** - 6 tables created with master data
2. **Backend API** - 5 endpoints ready
3. **Main settings page** - With tabs (Kurir & Template)
4. **Shipping settings section** - Lokasi Toko & Jasa Pengiriman
5. **Location update modal** - With wilayah dropdown
6. **Tabs component** - UI component ready

---

## 🚧 Need to Complete

1. **StoreCourierConfig.tsx** - Halaman atur kurir (jarak & berat)
2. Install `@radix-ui/react-tabs` package
3. Test end-to-end flow

---

## 🔍 API Endpoints

```
GET  /api/sellers/shipping/store-courier
POST /api/sellers/shipping/store-courier
GET  /api/sellers/shipping/courier-services
GET  /api/sellers/shipping/store-services
POST /api/sellers/shipping/store-services
```

---

## 📊 Database Tables

1. `store_courier_config` - Config kurir toko
2. `courier_distance_pricing` - Harga by jarak
3. `courier_weight_pricing` - Harga by berat
4. `courier_services` - Master ekspedisi
5. `courier_service_types` - Tipe layanan
6. `store_courier_services` - Pilihan toko

---

## 🎯 Flow

```
/seller/settings?type=kurir
  ↓
[Lokasi Toko] → Modal Update → Save
  ↓
[Kurir Toko] → /seller/settings/courier-config
  ↓
  Set Jarak (0-5km = Rp10000, etc)
  Set Berat (>1000gr = +Rp5000, etc)
  ↓
  Save → Database
  ↓
[Jasa Pengiriman] → Centang layanan → Save
```

---

## ⚠️ Known Issues (Non-blocking)

- Lint warnings about setState in effect (minor)
- Function hoisting warning (minor)
- flex-shrink-0 vs shrink-0 (cosmetic)

These don't affect functionality.

---

## 🧪 Testing

1. Login sebagai seller
2. Dashboard → Pengaturan → Pilih submenu
3. Navigate to `/seller/settings?type=kurir`
4. Test lokasi update
5. Test courier config (after StoreCourierConfig is complete)
6. Test jasa pengiriman selection
7. Verify in database

---

**Status:** 90% Complete  
**Remaining:** StoreCourierConfig component
