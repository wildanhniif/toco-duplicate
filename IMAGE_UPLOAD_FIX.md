# Fix Image Upload - Tidak Hilang Setelah Restart

## 🔴 Masalah Sebelumnya

1. **Image disimpan sebagai blob/base64** di database
2. **URL temporary** (`URL.createObjectURL`) yang hilang setelah restart
3. **Tidak efisien** - database jadi berat dengan blob data

## ✅ Solusi Baru - Proper File Upload

### Backend Changes

#### 1. Upload Endpoint (`/api/upload`)

**File:** `Backend/routes/uploadRoutes.js`

```javascript
POST /api/upload/image?type=products
POST /api/upload/images?type=products
```

**Features:**

- Upload file fisik ke folder `uploads/products/`
- Generate unique filename: `timestamp-random.ext`
- File filter: hanya accept image (jpg, png, gif, webp)
- Max size: 5MB per file
- Return full URL: `http://localhost:5000/uploads/products/filename.jpg`

#### 2. Static File Serving

**File:** `Backend/index.js` line 113

```javascript
app.use("/uploads", express.static("uploads"));
```

Folder `uploads/` di-serve sebagai static files, jadi gambar bisa diakses via URL.

### Frontend Changes

#### 1. Upload Function

**File:** `Frontend/src/views/seller/products/sections/BasicInfoSection.tsx`

**Before:**

```typescript
// Temporary - hilang setelah restart
const newImages = Array.from(files).map((file) => URL.createObjectURL(file));
```

**After:**

```typescript
// Upload ke backend - permanent URL
const formData = new FormData();
formData.append("image", file);

const response = await fetch(`${API_BASE_URL}/api/upload/image?type=products`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});

const data = await response.json();
uploadedUrls.push(data.url); // Permanent URL dari backend
```

#### 2. Loading State

- Spinner saat upload: `<Loader2 className="animate-spin" />`
- Button disabled saat upload
- Visual feedback: "Uploading..."

### Database

**Table:** `product_images`

```sql
CREATE TABLE product_images (
  image_id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT,
  url VARCHAR(500), -- BUKAN BLOB!
  alt_text VARCHAR(255),
  sort_order INT
);
```

- Kolom `url` simpan **path/URL**, bukan blob
- Contoh: `http://localhost:5000/uploads/products/1732943210-123456789.jpg`

## 🎯 Flow Upload yang Benar

### 1. User Upload Gambar

```
User → Select file → Frontend
```

### 2. Frontend Upload ke Backend

```
Frontend → FormData → POST /api/upload/image?type=products → Backend
```

### 3. Backend Simpan File

```
Backend → multer → Save to uploads/products/unique-filename.jpg
```

### 4. Backend Return URL

```
Backend → { url: "http://localhost:5000/uploads/products/..." } → Frontend
```

### 5. Frontend Simpan URL di State

```
Frontend → setFormData({ images: [..., url] })
```

### 6. Saat Submit Form

```
Frontend → POST /api/products → { images: ["url1", "url2"] } → Backend
```

### 7. Backend Simpan URL ke Database

```
Backend → INSERT INTO product_images (url) VALUES ("url1"), ("url2")
```

### 8. Saat Tampil Produk

```
Backend → SELECT url FROM product_images → Frontend → <img src={url} />
```

## 🚀 Cara Pakai

### Create/Edit Product

1. Buka form tambah/edit produk
2. Klik "Upload Foto"
3. Pilih gambar (max 10, max 5MB each)
4. **Gambar langsung diupload ke server** ✅
5. Loading spinner muncul saat upload
6. Setelah sukses, preview muncul dengan URL permanent
7. Klik "Simpan Produk"
8. URL tersimpan di database

### Akses Gambar

**Direct URL:**

```
http://localhost:5000/uploads/products/1732943210-123456789.jpg
```

**Di Frontend:**

```jsx
<img src={product.image_url} alt={product.name} />
```

## ✅ Keuntungan Solusi Baru

1. **Permanent URLs** - tidak hilang setelah restart
2. **Efficient** - database cuma simpan path, bukan blob
3. **Fast** - static file serving lebih cepat dari blob query
4. **Scalable** - gampang migrate ke CDN/Cloud Storage nanti
5. **Better UX** - loading state, error handling

## 🔄 Migration untuk Produk Lama

Jika ada produk lama dengan blob di database:

```sql
-- Cek produk dengan blob
SELECT product_id, name
FROM products
WHERE image_blob IS NOT NULL;

-- Untuk produk baru, pastikan pakai URL
UPDATE products SET image_blob = NULL WHERE product_id = ?;
```

**Recommended:** Re-upload gambar via form edit produk.

## 📁 Struktur Folder

```
Backend/
├── uploads/
│   ├── products/       ← Product images
│   ├── stores/         ← Store images
│   └── about_thumbnails/
├── routes/
│   └── uploadRoutes.js ← Upload endpoint
└── index.js            ← Static file serving
```

## 🐛 Troubleshooting

### Gambar tidak muncul

- Cek folder `Backend/uploads/products/` - file ada?
- Cek URL: `http://localhost:5000/uploads/products/filename.jpg` bisa diakses?
- Cek backend console: ada error upload?

### Upload gagal

- Cek ukuran file: max 5MB
- Cek format: hanya jpg, png, gif, webp
- Cek auth token: pastikan login valid
- Cek folder permission: `uploads/products/` writable?

### Upload lambat

- Resize image di frontend sebelum upload (recommended max 1920px)
- Compress image quality (80-90% cukup)
- Consider lazy loading untuk multiple images

## 🚀 Future Improvements

1. **Image Optimization**

   - Auto resize/compress di backend
   - Generate thumbnails
   - WebP conversion

2. **Cloud Storage**

   - Migrate to AWS S3 / Cloudinary
   - CDN for faster delivery
   - Better scalability

3. **Better UX**
   - Drag & drop upload
   - Crop/edit before upload
   - Bulk upload progress bar

## 📝 Summary

✅ **Problem Fixed:** Image tidak hilang lagi setelah restart  
✅ **Solution:** Upload file fisik → simpan URL di database  
✅ **Benefits:** Permanent, efficient, scalable

**Backend sudah running di port 5000** ✅  
**Test sekarang:** Create/edit produk dan upload gambar!
