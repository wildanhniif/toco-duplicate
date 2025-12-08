# Cloudinary Setup Guide

## 🎉 Setup Berhasil!

Integrasi Cloudinary sudah selesai. Sekarang semua upload gambar produk akan otomatis ke Cloudinary dan mendapatkan CDN optimization.

---

## 📋 Langkah Setup

### 1. Get Cloudinary Credentials

Dari dashboard Cloudinary yang sudah kamu buka:

1. **Cloud Name**: Terletak di bagian atas dashboard (contoh: `deiczrlb7`)
2. **API Key**: Klik "Go to API Keys" atau cek di bagian "Account Details"
3. **API Secret**: Ada di halaman yang sama dengan API Key

### 2. Add to Backend `.env`

Buka file `Backend/.env` dan tambahkan:

```env
CLOUDINARY_CLOUD_NAME=deiczrlb7
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**⚠️ PENTING**: Ganti dengan credentials asli dari dashboard Cloudinary kamu!

### 3. Restart Backend Server

```bash
cd Backend
npm run dev
```

### 4. Restart Frontend (Next.js)

Frontend sudah dikonfigurasi untuk menerima gambar dari Cloudinary.

```bash
cd Frontend
npm run dev
```

---

## ✅ Apa yang Sudah Dikonfigurasi?

### Backend Changes:

- ✅ Installed `cloudinary` package
- ✅ Created `/config/cloudinary.js` - Cloudinary configuration
- ✅ Created `/utils/uploadToCloudinary.js` - Upload utilities
- ✅ Updated `productController.js` - Auto upload ke Cloudinary
- ✅ Created `.env.example` - Environment template

### Frontend Changes:

- ✅ Updated `next.config.ts` - Allow Cloudinary domain

### Features:

- ✅ **Auto Upload**: Gambar langsung upload ke Cloudinary
- ✅ **Auto Cleanup**: File lokal dihapus setelah upload
- ✅ **CDN Optimization**: Gambar served via Cloudinary CDN
- ✅ **Auto Format**: WebP untuk browser yang support
- ✅ **Quality Optimization**: Auto quality adjustment
- ✅ **Organized Storage**: Files stored in `toco-seller/products/` folder

---

## 🧪 Testing

### Upload Product Image:

```bash
POST http://localhost:5000/api/products/:product_id/images
Content-Type: multipart/form-data

Body:
- images: [file1, file2, file3] (max 10 files)
```

**Response:**

```json
{
  "message": "Images uploaded to Cloudinary successfully",
  "images": [
    {
      "url": "https://res.cloudinary.com/deiczrlb7/image/upload/v1234567890/toco-seller/products/abc123.jpg",
      "public_id": "toco-seller/products/abc123",
      "width": 1920,
      "height": 1080,
      "format": "jpg"
    }
  ]
}
```

---

## 📁 File Structure

```
Backend/
├── config/
│   └── cloudinary.js          # Cloudinary config
├── utils/
│   └── uploadToCloudinary.js  # Upload utilities
├── controllers/
│   └── productController.js   # Updated with Cloudinary
└── .env.example               # Environment template

Frontend/
└── next.config.ts             # Updated for Cloudinary
```

---

## 🔧 Available Utility Functions

```javascript
const {
  uploadToCloudinary, // Single file upload
  uploadMultipleToCloudinary, // Multiple files upload
  deleteFromCloudinary, // Delete single file
  deleteMultipleFromCloudinary, // Delete multiple files
} = require("./utils/uploadToCloudinary");
```

### Example Usage:

```javascript
// Single upload
const result = await uploadToCloudinary(
  "/path/to/file.jpg",
  "products", // folder name
  { width: 800, crop: "scale" } // options
);

// Multiple upload
const results = await uploadMultipleToCloudinary(
  req.files, // multer files array
  "products"
);

// Delete
await deleteFromCloudinary("toco-seller/products/abc123");
```

---

## 💰 Pricing Info

**Cloudinary Free Tier:**

- ✅ 25 GB Storage
- ✅ 25 GB Monthly Bandwidth
- ✅ 25,000 Transformations/month
- ✅ Unlimited images

**Estimasi untuk 1000 produk:**

- 1000 products × 3 images × 500KB = ~1.5GB
- Sangat cukup untuk free tier!

---

## 🐛 Troubleshooting

### Error: "Must supply cloud_name"

- Pastikan `.env` file sudah ada dan benar
- Restart backend server setelah update `.env`

### Error: "Invalid API Key"

- Check credentials di Cloudinary dashboard
- Pastikan tidak ada typo atau spasi

### Next.js Image Error (localhost blocked)

- Sudah fixed dengan Cloudinary
- Gambar sekarang load dari `res.cloudinary.com`

---

## 🚀 Next Steps

1. **Add credentials** ke `.env`
2. **Restart servers** (backend + frontend)
3. **Test upload** product image
4. **Monitor** di Cloudinary dashboard: https://console.cloudinary.com/

---

## 📚 Documentation

- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Upload API](https://cloudinary.com/documentation/image_upload_api_reference)
- [Transformation Reference](https://cloudinary.com/documentation/image_transformations)

---

**Setup by:** Cascade AI
**Date:** November 30, 2024
