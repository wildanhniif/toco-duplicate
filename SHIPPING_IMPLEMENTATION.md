# Implementasi Layanan Pengiriman - Toco Seller

## 📋 Overview

Fitur lengkap untuk pengaturan pengiriman toko seller meliputi:

1. **Lokasi Toko** - Update alamat & koordinat
2. **Kurir Toko** - Pengaturan kurir sendiri (jarak & berat)
3. **Jasa Pengiriman** - Pilih ekspedisi pihak ketiga

---

## 🗄️ Database Schema

### Tables Created:

1. `store_courier_config` - Konfigurasi kurir toko
2. `courier_distance_pricing` - Harga berdasarkan jarak
3. `courier_weight_pricing` - Biaya tambahan berat
4. `courier_services` - Master ekspedisi (GoSend, JNE, dll)
5. `courier_service_types` - Tipe layanan per ekspedisi
6. `store_courier_services` - Pilihan ekspedisi per toko

### Master Data:

- GoSend: Sameday, Instant
- J&T: HBO, Nextday, Sameday, Regular
- SiCepat: BEST, GOKIL, SIUNTUNG
- Paxel: Sameday, Big, Instant
- JNE: Trucking, Yes, Regular, OKE
- Anteraja: Regular, Next day, Same Day
- POS Indonesia: Kargo, Sameday, Regular, Express

---

## 🔌 Backend API

### Endpoints:

```
GET  /api/sellers/shipping/store-courier           - Get kurir toko config
POST /api/sellers/shipping/store-courier           - Save kurir toko config
GET  /api/sellers/shipping/courier-services        - Get semua ekspedisi
GET  /api/sellers/shipping/store-services          - Get ekspedisi yang dipilih
POST /api/sellers/shipping/store-services          - Update pilihan ekspedisi
```

---

## 🎨 Frontend Structure

### Routes:

```
/seller/settings?type=kurir                        - Main shipping settings
/seller/settings/courier-config                    - Atur kurir toko
```

### Components:

1. `views/seller/settings/index.tsx` - Main page dengan tabs
2. `views/seller/settings/ShippingSettings.tsx` - Shipping section
3. `views/seller/settings/StoreCourierConfig.tsx` - Kurir toko config
4. `views/seller/settings/LocationUpdateModal.tsx` - Update lokasi

---

## 📦 Files Created

### Migration

- `Backend/migrations/create_shipping_tables.sql`

### Backend

- `Backend/controllers/shippingController.js` (updated)
- `Backend/routes/sellerRoutes.js` (updated)

### Frontend

- `Frontend/src/app/seller/settings/page.tsx`
- `Frontend/src/views/seller/settings/index.tsx`
- `Frontend/src/views/seller/settings/ShippingSettings.tsx`
- `Frontend/src/views/seller/settings/StoreCourierConfig.tsx`
- `Frontend/src/views/seller/settings/LocationUpdateModal.tsx`

---

## 🚀 Setup Instructions

### 1. Run Database Migration

```bash
mysql -u root -p toco < Backend/migrations/create_shipping_tables.sql
```

### 2. Restart Backend

```bash
cd Backend
npm start
```

### 3. Test Frontend

```bash
cd Frontend
npm run dev
```

### 4. Access Page

```
http://localhost:3000/seller/settings?type=kurir
```

---

## ✅ Testing Checklist

### Lokasi Toko

- [ ] Lihat lokasi toko saat ini
- [ ] Klik "Ubah Lokasi"
- [ ] Modal muncul dengan Google Maps
- [ ] Update alamat & koordinat
- [ ] Simpan perubahan

### Kurir Toko

- [ ] Klik "Atur Kurir"
- [ ] Set batas pengiriman (km)
- [ ] Tambah kondisi jarak (0-X km = RpY)
- [ ] Tambah kondisi berat (>X gr = +RpY)
- [ ] Simpan perubahan

### Jasa Pengiriman

- [ ] Lihat semua ekspedisi available
- [ ] Centang/uncentang layanan
- [ ] Simpan pilihan
- [ ] Verify di database

---

## 🔍 Verification

```sql
-- Check courier config
SELECT * FROM store_courier_config WHERE store_id = ?;

-- Check distance pricing
SELECT * FROM courier_distance_pricing
WHERE store_courier_config_id = ?;

-- Check weight pricing
SELECT * FROM courier_weight_pricing
WHERE store_courier_config_id = ?;

-- Check selected services
SELECT
    cs.name AS courier,
    cst.name AS service_type
FROM store_courier_services scs
JOIN courier_service_types cst ON cst.id = scs.courier_service_type_id
JOIN courier_services cs ON cs.id = cst.courier_service_id
WHERE scs.store_id = ?;
```

---

**Status:** ✅ Complete & Ready to Use
