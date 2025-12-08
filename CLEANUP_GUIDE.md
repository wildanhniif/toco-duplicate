# 🧹 Complete Cleanup Guide - Cloudinary Migration

## ⚠️ PENTING: Baca Dulu Sebelum Eksekusi!

Panduan ini akan membersihkan SEMUA file dan data gambar lama yang pakai localhost. Setelah cleanup, semua upload baru akan otomatis ke Cloudinary.

---

## 📋 Checklist Persiapan

- [ ] Cloudinary credentials sudah di `.env`
- [ ] Backend code sudah updated (Cloudinary integration)
- [ ] Backup database (optional tapi recommended)
- [ ] Backend server di-stop dulu

---

## 🚀 Step-by-Step Cleanup

### **Step 1: Stop All Servers**

Stop backend dan frontend:

```bash
# Tekan Ctrl+C di terminal backend
# Tekan Ctrl+C di terminal frontend
```

---

### **Step 2: Clean Database (SQL)**

Buka MySQL/phpMyAdmin dan jalankan:

```bash
# Windows Command Prompt / PowerShell
cd Backend/migrations
mysql -u root -p blibli < cleanup_local_images.sql
```

Atau manual di phpMyAdmin:

1. Buka file `Backend/migrations/cleanup_local_images.sql`
2. Copy seluruh isi
3. Paste di phpMyAdmin SQL tab
4. Klik Execute
5. Review hasilnya
6. Jika benar, jalankan `COMMIT;`
7. Jika salah, jalankan `ROLLBACK;`

**Apa yang dilakukan?**

- ✅ Hapus semua gambar produk dengan URL localhost
- ✅ Clear profile & background image toko
- ✅ Clear thumbnail halaman about
- ✅ Database bersih dari URL localhost

---

### **Step 3: Delete Old Upload Folders**

```bash
cd Backend
node cleanup.js
```

**Apa yang dilakukan?**

- ✅ Hapus folder `uploads/products/`
- ✅ Hapus folder `uploads/stores/`
- ✅ Hapus folder `uploads/about_thumbnails/`
- ✅ Hapus folder `uploads/` (jika kosong)

---

### **Step 4: Update .gitignore**

Buka `Backend/.gitignore` dan pastikan ada:

```
# Uploads folder (not needed anymore - using Cloudinary)
uploads/
*.log
node_modules/
.env
```

---

### **Step 5: Restart Backend**

```bash
cd Backend
npm run dev
```

Check console output - pastikan Cloudinary config loaded:

```
✓ Cloudinary configured
✓ Server running on port 5000
```

---

### **Step 6: Test Upload**

**Test via Postman/Thunder Client:**

#### Upload Product Image:

```http
POST http://localhost:5000/api/products/12/images
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

Body:
- images: [select image file(s)]
```

**Expected Response:**

```json
{
  "message": "Images uploaded to Cloudinary successfully",
  "images": [
    {
      "url": "https://res.cloudinary.com/deiczrlb7/image/upload/...",
      "public_id": "toco-seller/products/...",
      "width": 1920,
      "height": 1080,
      "format": "jpg"
    }
  ]
}
```

✅ **Check:** URL harus `res.cloudinary.com`, BUKAN `localhost:5000`

---

### **Step 7: Restart Frontend**

```bash
cd Frontend
npm run dev
```

Buka browser: `http://localhost:3000/seller/products`

✅ **Error "upstream image resolved to private ip" HARUS HILANG!**

---

## 🎯 Verification Checklist

Setelah cleanup, verify:

### Database:

- [ ] Tidak ada URL `http://localhost:5000/uploads` di `product_images`
- [ ] Tidak ada URL `/uploads/` di `stores.profile_image_url`
- [ ] Tidak ada URL `/uploads/` di `stores.background_image_url`
- [ ] Tidak ada URL `/uploads/` di `store_about_pages.thumbnail_url`

### Backend Files:

- [ ] Folder `uploads/` sudah terhapus atau kosong
- [ ] Code tidak ada reference ke `uploads/` untuk save
- [ ] Semua controller pakai `uploadBufferToCloudinary`

### Frontend:

- [ ] Next.js config ada Cloudinary domain
- [ ] Tidak ada error "private ip"
- [ ] Gambar load dari Cloudinary CDN

### Upload Test:

- [ ] Upload product image → Cloudinary URL
- [ ] Upload store profile → Cloudinary URL
- [ ] Upload store background → Cloudinary URL
- [ ] Upload about thumbnail → Cloudinary URL

---

## 🔄 Re-Upload Existing Products

Untuk produk yang gambarnya hilang setelah cleanup:

1. **Edit produk di dashboard seller**
2. **Upload gambar baru**
3. **Save** - Otomatis ke Cloudinary

Atau jalankan bulk upload jika banyak:

- Export produk tanpa gambar: `SELECT * FROM products WHERE product_id NOT IN (SELECT product_id FROM product_images)`
- Upload gambar via dashboard satu per satu

---

## 🐛 Troubleshooting

### "Error: Must supply cloud_name"

**Fix:**

1. Check `.env` ada `CLOUDINARY_CLOUD_NAME`
2. Restart backend server

### "Error: Invalid signature"

**Fix:**

1. Check `CLOUDINARY_API_SECRET` benar
2. No typo, no extra spaces
3. Restart backend

### Gambar lama masih muncul

**Fix:**

1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Check database - run cleanup SQL lagi

### Folder uploads tetap muncul

**Fix:**

1. Stop backend server
2. Delete manual via Windows Explorer
3. Add ke `.gitignore`
4. Restart backend

---

## 📊 Before vs After

### BEFORE Cleanup:

```
Backend/
├── uploads/
│   ├── products/
│   │   ├── image-1.jpg      ❌ 2.5MB
│   │   ├── image-2.jpg      ❌ 3.1MB
│   │   └── image-3.jpg      ❌ 1.8MB
│   ├── stores/
│   │   └── profile-1.jpg    ❌ 500KB
│   └── about_thumbnails/
│       └── thumb-1.jpg      ❌ 800KB

Database:
- product_images.url: "http://localhost:5000/uploads/..." ❌
- stores.profile_image_url: "/uploads/stores/..."  ❌
```

### AFTER Cleanup:

```
Backend/
├── config/
│   └── cloudinary.js        ✅
├── utils/
│   └── uploadToCloudinary.js ✅
└── (no uploads folder)      ✅

Database:
- product_images.url: "https://res.cloudinary.com/..." ✅
- stores.profile_image_url: "https://res.cloudinary.com/..." ✅

Cloudinary Dashboard:
- toco-seller/products/      ✅ Auto organized
- toco-seller/stores/        ✅ CDN optimized
```

---

## 💾 Backup Strategy

Jika takut kehilangan data:

### Option 1: Backup Database

```bash
mysqldump -u root -p blibli > backup_before_cleanup.sql
```

### Option 2: Backup Uploads Folder

```bash
# Copy folder ke tempat aman
xcopy /E /I uploads uploads_backup
```

### Restore (jika diperlukan):

```bash
# Restore database
mysql -u root -p blibli < backup_before_cleanup.sql

# Restore uploads
xcopy /E /I uploads_backup uploads
```

---

## ✅ Success Indicators

Kamu berhasil jika:

1. ✅ Backend restart tanpa error
2. ✅ Upload gambar baru return Cloudinary URL
3. ✅ Frontend tidak ada error "private ip"
4. ✅ Gambar load cepat dari CDN
5. ✅ Folder `uploads/` kosong atau tidak ada
6. ✅ Database tidak ada URL localhost

---

## 🎉 Done!

Setelah semua steps selesai:

- All image uploads → Cloudinary ✅
- No more localhost errors ✅
- CDN optimization ✅
- Clean codebase ✅

**Total cleanup time: ~5-10 minutes**

---

**Need help?** Check:

- `CLOUDINARY_SETUP.md` - Initial setup guide
- `CLOUDINARY_MIGRATION_COMPLETE.md` - Technical details

**Created:** November 30, 2024
**Status:** Ready to execute
