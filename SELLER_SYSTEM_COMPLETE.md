# Dokumentasi Lengkap Sistem Toco Seller

## Overview

Sistem Toco Seller memungkinkan user yang sudah terdaftar sebagai customer untuk upgrade menjadi seller dan mulai berjualan. Sistem ini mengimplementasikan alur lengkap dari registrasi seller hingga setup toko.

---

## 1. Alur Pendaftaran Seller

### A. Persyaratan

- User harus sudah **login** sebagai customer
- User harus sudah **verifikasi email** (untuk manual registration)

### B. Cara Akses Seller Registration

#### Opsi 1: User Belum Login

```
User → Klik "Mulai Jualan" di Navbar
     → Redirect ke /login?redirect_to_seller=true
     → User login (manual atau Google OAuth)
     → Setelah login sukses → Redirect ke /seller/login
     → User masuk credentials → Backend proses seller registration
     → Redirect ke /seller/dashboard
```

#### Opsi 2: User Sudah Login sebagai Customer

```
User → Klik "Mulai Jualan" di Navbar
     → Langsung ke /seller/login
     → User masuk credentials → Backend proses seller registration
     → Redirect ke /seller/dashboard
```

### C. Proses Backend Seller Registration

**Endpoint:** `POST /api/sellers/register`

**Headers:**

```
Authorization: Bearer <JWT_TOKEN>
```

**Backend Logic:**

1. Ambil `user_id` dari JWT token
2. Cek apakah user sudah menjadi seller (cek `users.role`)
3. Jika sudah seller → return 409 (sudah terdaftar)
4. Jika belum seller:
   - Update `users.role = 'seller'`
   - Create entry di tabel `stores`:
     ```sql
     INSERT INTO stores (user_id, name, slug, is_active)
     VALUES (user_id, 'Toko Baru #123', 'toko-baru-123-timestamp', false)
     ```
   - Generate JWT token baru:
     ```json
     {
       "user_id": 123,
       "name": "Nama User",
       "role": "seller",
       "store_id": 456
     }
     ```
5. Return token baru ke frontend

---

## 2. Setup Informasi Toko (WAJIB)

### A. Kapan Setup Toko Dilakukan?

Setelah seller berhasil registrasi dan masuk ke dashboard, **sistem akan memaksa seller untuk lengkapi informasi toko** sebelum bisa akses fitur lain.

**Mekanisme:**

- Dashboard seller cek `stores.is_active`
- Jika `is_active = false` (toko belum setup) → Tampilkan **modal wajib**
- Modal tidak bisa ditutup (onInteractOutside disabled)
- Seller harus klik "Lengkapi Sekarang" → Redirect ke `/seller/store/setup`

### B. Form Informasi Toko

**Route:** `/seller/store/setup`  
**Endpoint:** `PUT /api/sellers/stores/me`

#### Data yang Harus Diisi:

##### 1. Profil Toko

- **Upload Gambar Profil Toko**
  - Format: image/\*
  - Preview sebelum upload
  - Disimpan di `stores.profile_image_url`

##### 2. Background Toko

- **Pilihan 1:** Upload gambar sendiri
  - Format: image/\*
  - Disimpan di `stores.background_image_url`
- **Pilihan 2:** Pilih dari template yang disediakan
  - 4 template default
  - Tampilkan preview saat dipilih

##### 3. Nama Toko ✨

- **Input:** Nama toko (required)
- **Auto-generate Slug:**
  ```typescript
  slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  ```
- Disimpan di `stores.name` dan `stores.slug`

##### 4. Link URL Toko (Auto-Generated, Read-Only) ✨

- **Format:** `https://toco.id/store/{slug}`
- **Tampilan:**
  ```
  ┌─────────────────────────────────────────┐
  │ https://toco.id/store/nama-toko-anda    │
  │ • URL ini otomatis dibuat dari nama     │
  │   toko dan tidak dapat diubah           │
  └─────────────────────────────────────────┘
  ```
- Background abu-abu dengan border
- Slug tampil dengan warna biru
- Cannot be edited

##### 5. Nomor Telepon Usaha

- **Input:** Nomor telepon (required)
- **Format:** Indonesian phone number
- Disimpan di `stores.business_phone`

##### 6. Tampilkan Nomor Telepon (Checkbox) ✨

- **Label:** "Tampilkan nomor telepon usaha"
- **Keterangan:**
  > "Jika diaktifkan, pengguna dapat mengakses nomor teleponmu melalui halaman detail produk (Khusus produk classified)"
- Disimpan di `stores.show_phone_number` (boolean)

##### 7. Deskripsi Toko

- **Input:** Textarea (optional)
- **Placeholder:** "Ceritakan tentang toko Anda..."
- Disimpan di `stores.description`

##### 8. Lokasi Toko (Pin Point Google Maps) ✨

**Tombol:** "Pilih Lokasi" (dengan icon MapPin)

**Modal Lokasi:**

```
┌────────────────────────────────────────────┐
│  📍 Pilih Lokasi Toko                      │
├────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐  │
│  │                                      │  │
│  │      Google Maps (Placeholder)       │  │
│  │         Klik untuk pin lokasi        │  │
│  │                                      │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  Detail Lokasi: [____________] (auto)      │
│  Detail Alamat: [____________]             │
│  Kode Pos:      [______]                   │
│                                            │
│  Provinsi:      [Dropdown ▼]               │
│  Kota/Kabupaten: [Dropdown ▼]              │
│  Kecamatan:     [Dropdown ▼]               │
│  Kelurahan:     [Dropdown ▼]               │
│                                            │
│         [Batal]  [Simpan Lokasi]           │
└────────────────────────────────────────────┘
```

**Fitur:**

- Google Maps placeholder (ready for integration)
- Cascading dropdown: Provinsi → Kota → Kecamatan → Kelurahan
- Data dari API wilayah: `/api/wilayah/provinces`, `/api/wilayah/cities`, dll
- Koordinat (latitude, longitude) untuk future Google Maps integration
- Auto-populate detail lokasi dari pin Google Maps

**Data Disimpan:**

- `stores.address_line` - Detail alamat
- `stores.postal_code` - Kode pos
- `stores.province` - Nama provinsi
- `stores.city` - Nama kota
- `stores.district` - Nama kecamatan
- `stores.subdistrict` - Nama kelurahan
- `stores.province_id` - ID provinsi
- `stores.city_id` - ID kota
- `stores.district_id` - ID kecamatan
- `stores.subdistrict_id` - ID kelurahan
- `stores.latitude` - Koordinat latitude
- `stores.longitude` - Koordinat longitude

##### 9. Pengaturan Cloudflare (Checkbox)

- **Label:** "Gunakan Cloudflare untuk optimasi gambar"
- Disimpan di `stores.use_cloudflare` (boolean)

##### 10. Tombol Submit

- **Text:** "Simpan Perubahan"
- **Loading State:** "Menyimpan..."
- **Setelah sukses:**
  - Tampilkan pesan sukses
  - Set `stores.is_active = true`
  - Redirect ke `/seller/dashboard` setelah 2 detik

---

## 3. Struktur Database

### Table: `users`

```sql
user_id         INT PRIMARY KEY AUTO_INCREMENT
full_name       VARCHAR(100)
phone_number    VARCHAR(20)
email           VARCHAR(100) UNIQUE
password_hash   VARCHAR(255)
role            ENUM('customer', 'seller', 'admin') DEFAULT 'customer'
is_verified     BOOLEAN DEFAULT 0
is_active       BOOLEAN DEFAULT 1
google_id       VARCHAR(255)
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### Table: `stores`

```sql
store_id              INT PRIMARY KEY AUTO_INCREMENT
user_id               INT UNIQUE (FK → users.user_id)
name                  VARCHAR(100)
slug                  VARCHAR(100) UNIQUE
description           TEXT
business_phone        VARCHAR(20)
show_phone_number     BOOLEAN DEFAULT 0
profile_image_url     VARCHAR(255)
background_image_url  VARCHAR(255)
address_line          TEXT
postal_code           VARCHAR(10)
province              VARCHAR(50)
city                  VARCHAR(50)
district              VARCHAR(50)
subdistrict           VARCHAR(50)
province_id           VARCHAR(10)
city_id               VARCHAR(10)
district_id           VARCHAR(10)
subdistrict_id        VARCHAR(10)
latitude              DECIMAL(10, 8)
longitude             DECIMAL(11, 8)
use_cloudflare        BOOLEAN DEFAULT 0
is_active             BOOLEAN DEFAULT 0
created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

---

## 4. API Endpoints

### Seller Registration

```http
POST /api/sellers/register
Authorization: Bearer <JWT_TOKEN>

Response 201:
{
  "message": "Selamat! Anda berhasil terdaftar sebagai seller...",
  "token": "<NEW_JWT_TOKEN>",
  "store_id": 456,
  "store": {
    "name": "Toko Baru #123",
    "slug": "toko-baru-123-1234567890",
    "is_active": false
  }
}

Response 409 (Already Seller):
{
  "message": "Anda sudah terdaftar sebagai seller.",
  "store_id": 456
}
```

### Get Store Info

```http
GET /api/sellers/stores/me
Authorization: Bearer <JWT_TOKEN>

Response 200:
{
  "store": {
    "store_id": 456,
    "name": "Toko Baru #123",
    "slug": "toko-baru-123-1234567890",
    "is_active": false,
    "profile_image_url": null,
    "description": null,
    ...
  }
}
```

### Update Store Details

```http
PUT /api/sellers/stores/me
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data

Body (FormData):
- profile_image: File
- background_image: File
- name: string
- slug: string (auto-generated)
- description: string
- business_phone: string
- show_phone_number: boolean
- address_line: string
- postal_code: string
- province: string
- city: string
- district: string
- subdistrict: string
- province_id: string
- city_id: string
- district_id: string
- subdistrict_id: string
- latitude: string
- longitude: string
- use_cloudflare: boolean

Response 200:
{
  "message": "Informasi toko berhasil diperbarui.",
  "store": {
    "name": "Toko Saya",
    "slug": "toko-saya",
    "is_active": true
  }
}
```

### Wilayah API

```http
GET /api/wilayah/provinces
GET /api/wilayah/cities?id_provinsi={id}
GET /api/wilayah/districts?id_kabupaten={id}
GET /api/wilayah/subdistricts?id_kecamatan={id}

Response:
{
  "value": [
    { "id": "11", "name": "ACEH" },
    { "id": "12", "name": "SUMATERA UTARA" },
    ...
  ]
}
```

---

## 5. Frontend Components

### Component Structure

```
/src/app/seller/
  ├── dashboard/page.tsx
  ├── login/page.tsx
  └── store/setup/page.tsx

/src/views/seller/
  ├── dashboard/index.tsx  (✨ Enhanced)
  ├── login/index.tsx
  └── store-setup/index.tsx  (✨ Enhanced)

/src/components/
  ├── layouts/
  │   ├── SellerSidebar.tsx
  │   └── SellerAuthLayout.tsx
  ├── composites/
  │   ├── Navbar/AuthButton.tsx  (✨ Updated)
  │   ├── Auth/SellerLoginForm.tsx
  │   ├── Auth/SellerOauthLoginButton.tsx
  │   └── LocationPicker/
  │       └── LocationPickerModal.tsx
  └── ui/
      ├── dialog.tsx
      ├── button.tsx
      └── ...
```

### Key Components

#### 1. SellerDashboardView (Enhanced) ✨

**File:** `/src/views/seller/dashboard/index.tsx`

**Features:**

- Fetch store info on mount
- Check `is_active` status
- Show **mandatory setup modal** if `is_active = false`
- Modal cannot be closed without completing setup
- Display dashboard stats and verification banner

```typescript
// Key Logic
useEffect(() => {
  fetchStoreInfo();
  if (!store.is_active) {
    setShowSetupModal(true);
  }
}, []);
```

#### 2. SellerStoreSetupView (Enhanced) ✨

**File:** `/src/views/seller/store-setup/index.tsx`

**Features:**

- Complete form with all required fields
- Auto-generate slug from store name
- Image upload with preview (profile & background)
- Template selection for background
- LocationPickerModal integration
- Form validation
- Success/error messages
- Auto-redirect to dashboard after success

```typescript
// Slug Auto-generation
const handleNameChange = (value: string) => {
  setStoreData((prev) => ({
    ...prev,
    name: value,
    slug: value
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, ""),
  }));
};
```

#### 3. LocationPickerModal ✨

**File:** `/src/components/composites/LocationPicker/LocationPickerModal.tsx`

**Features:**

- Dialog modal with Google Maps placeholder
- Cascading dropdowns (Provinsi → Kota → Kecamatan → Kelurahan)
- Integration with wilayah API
- Form fields for address details
- Save button to populate parent form
- Future-ready for Google Maps API integration

---

## 6. User Journey Flow

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER CUSTOMER                            │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
         Klik "Mulai Jualan"
                  │
                  ├──── Not Logged In ────┐
                  │                        ▼
                  │               Login /register
                  │                        │
                  │                        └──────┐
                  │                               │
                  └──── Logged In ────────────────┤
                                                  ▼
                                        /seller/login
                                                  │
                                                  ▼
                                    Masuk Credentials
                                                  │
                                                  ▼
                              Backend: POST /api/sellers/register
                                    - Update role='seller'
                                    - Create store (is_active=false)
                                    - Return new JWT token
                                                  │
                                                  ▼
                                      /seller/dashboard
                                                  │
                                                  ▼
                                    Cek is_active === false?
                                                  │
                         ┌────────────────────────┴────────────────────┐
                         │ YES                                         │ NO
                         ▼                                             ▼
                 Show Modal Wajib                              Dashboard Normal
                 "Lengkapi Informasi"                          (sudah setup)
                         │
                         ▼
                 Klik "Lengkapi Sekarang"
                         │
                         ▼
                /seller/store/setup
                         │
                         ▼
            ┌────────────────────────────┐
            │  FORM INFORMASI TOKO       │
            ├────────────────────────────┤
            │ • Profile Image            │
            │ • Background Image/        │
            │   Template                 │
            │ • Nama Toko                │
            │ • URL Toko (auto)          │
            │ • No. Telepon Usaha        │
            │ • Toggle Show Phone        │
            │ • Deskripsi Toko           │
            │ • Lokasi (Google Maps)     │
            │   - Provinsi               │
            │   - Kota                   │
            │   - Kecamatan              │
            │   - Kelurahan              │
            │   - Detail Alamat          │
            │   - Kode Pos               │
            │ • Cloudflare Toggle        │
            └────────────────────────────┘
                         │
                         ▼
                 Klik "Simpan"
                         │
                         ▼
              Backend: PUT /api/sellers/stores/me
                - Upload images
                - Save all data
                - Set is_active = true
                         │
                         ▼
                 Tampil Success Message
                         │
                         ▼
                Redirect to /seller/dashboard
                         │
                         ▼
            ┌────────────────────────────┐
            │   DASHBOARD SELLER AKTIF   │
            ├────────────────────────────┤
            │ • Stats (Orders, Products) │
            │ • Total Transaksi          │
            │ • Verification Banner      │
            │   (jika belum verified)    │
            │ • Full Access ke Fitur     │
            └────────────────────────────┘
```

---

## 7. Testing Checklist

### Authentication Flow

- [x] User tidak login → Klik "Mulai Jualan" → Redirect ke login
- [x] User login → Redirect ke /seller/login
- [x] User daftar seller (manual) → Dapat token baru → Redirect ke dashboard
- [x] User daftar seller (Google OAuth) → Dapat token baru → Redirect ke dashboard

### Store Setup (Required)

- [x] Seller baru masuk dashboard → Modal wajib muncul
- [x] Modal tidak bisa ditutup dengan klik luar
- [x] Klik "Lengkapi Sekarang" → Redirect ke /seller/store/setup
- [x] Form validasi semua field required
- [x] Upload profile image → Preview muncul
- [x] Upload background image → Preview muncul
- [x] Pilih template background → Preview update
- [x] Ketik nama toko → Slug auto-generate
- [x] URL toko tampil auto dan read-only
- [x] Checkbox "Tampilkan No Telepon" berfungsi
- [x] Klik "Pilih Lokasi" → Modal lokasi muncul
- [ ] **Google Maps** pin lokasi → Populate detail lokasi (future)
- [x] Dropdown provinsi → Load kota
- [x] Dropdown kota → Load kecamatan
- [x] Dropdown kecamatan → Load kelurahan
- [x] Simpan lokasi → Form utama ter-update
- [x] Checkbox Cloudflare berfungsi
- [x] Submit form → Upload images + data
- [x] Success → is_active = true → Redirect dashboard
- [x] Dashboard tidak tampilkan modal lagi setelah setup

### Dashboard Access

- [x] Seller dengan is_active=true → Akses penuh dashboard
- [x] Seller dengan is_active=false → Paksa setup dulu
- [x] Non-seller akses /seller/dashboard → Redirect ke home

---

## 8. Future Enhancements

### Google Maps Integration 🗺️

**Status:** Placeholder Ready

**What's Needed:**

1. Google Maps JavaScript API key
2. Update LocationPickerModal component:

   ```typescript
   import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

   // Add map component
   const { isLoaded } = useLoadScript({
     googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY,
   });

   // Handle marker drag
   const handleMarkerDragEnd = (e) => {
     const lat = e.latLng.lat();
     const lng = e.latLng.lng();

     // Reverse geocode to get address
     geocoder.geocode({ location: { lat, lng } }, (results) => {
       setAddressLine(results[0].formatted_address);
       setLatitude(lat);
       setLongitude(lng);
     });
   };
   ```

3. Replace placeholder div with actual GoogleMap component

### Additional Features

- [ ] Store analytics dashboard
- [ ] Product management
- [ ] Order management
- [ ] Chat with customers
- [ ] Store verification system
- [ ] Store rating & reviews
- [ ] Multiple store locations
- [ ] Store banner management
- [ ] Custom store themes

---

## 9. Files Modified/Created

### Backend

- ✅ `Backend/routes/sellerRoutes.js` - Seller routes
- ✅ `Backend/controllers/sellerController.js` - Seller logic
- ✅ `Backend/routes/wilayahRoutes.js` - Location data API

### Frontend (Modified)

- ✅ `Frontend/src/views/seller/dashboard/index.tsx` - Added mandatory setup modal
- ✅ `Frontend/src/views/seller/store-setup/index.tsx` - Enhanced UI for URL display
- ✅ `Frontend/src/components/composites/Navbar/AuthButton.tsx` - Fixed redirect logic
- ✅ `Frontend/src/components/fragments/LoginForm.tsx` - Handle redirect_to_seller
- ✅ `Frontend/src/components/layouts/SellerAuthLayout.tsx` - Auth guard

### Frontend (Already Existed)

- ✅ `Frontend/src/components/composites/LocationPicker/LocationPickerModal.tsx`
- ✅ `Frontend/src/components/fragments/SellerLoginForm.tsx`
- ✅ `Frontend/src/components/composites/Auth/SellerOauthLoginButton.tsx`
- ✅ `Frontend/src/components/layouts/SellerSidebar.tsx`

---

## 10. Summary

### ✅ What's Complete

1. **Seller Registration Flow** - Manual & Google OAuth
2. **Mandatory Store Setup** - Modal forces completion
3. **Complete Store Setup Form** - All fields implemented:
   - Profile & background images
   - Auto-generated URL (read-only)
   - Business phone with visibility toggle
   - Description
   - Location picker with wilayah cascade
   - Cloudflare option
4. **Dashboard Protection** - Can't access without setup
5. **Beautiful UI** - Enhanced form styling

### 🔄 Ready for Enhancement

1. **Google Maps Integration** - Placeholder exists, ready for API
2. **Store Management** - Foundation complete
3. **Advanced Features** - System architecture ready

### 🎯 Key Features

- ✨ **Mandatory Setup** - Sellers must complete info before selling
- ✨ **Auto URL Generation** - Clean, SEO-friendly store URLs
- ✨ **Location Cascade** - Smart address selection
- ✨ **Image Management** - Upload or template selection
- ✨ **Phone Privacy** - Toggle phone number visibility

---

**Sistem seller sudah lengkap dan siap digunakan! 🚀**
