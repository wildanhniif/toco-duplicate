# 🔄 Restart Backend Server

## Routes sudah ditambahkan! ✅

File updated: `Backend/routes/sellerRoutes.js`

**New routes added:**

```
GET  /api/seller/store-courier-config
POST /api/seller/store-courier-config
```

---

## 🚀 Cara Restart Backend

### Option 1: Via Terminal (Ctrl+C kemudian start lagi)

```bash
cd Backend
# Stop server: Ctrl+C
# Start again:
node server.js
# atau
npm start
```

### Option 2: Jika pakai nodemon (auto-restart)

```bash
# Save file sudah cukup, nodemon auto restart
# Cek terminal backend untuk message:
# "Server restarted..."
```

### Option 3: Kill & Restart

```bash
# Windows PowerShell:
Get-Process -Name node | Stop-Process -Force
cd Backend
node server.js
```

---

## ✅ Verification

Setelah backend restart, check di browser console:

**Before (Error):**

```
❌ CORS error
❌ Failed to fetch
```

**After (Success):**

```
✅ Request to http://localhost:5000/api/seller/store-courier-config
✅ Response 200 OK atau 404 (berarti endpoint jalan, tinggal ada data atau tidak)
```

---

## 🔍 Debug Checklist

If still error:

### 1. Check Backend Running

```bash
# Terminal backend harus show:
Server running on port 5000
Connected to MySQL database
```

### 2. Check Routes Loaded

Di terminal backend saat start, cari:

```
✅ Seller routes loaded
atau
✅ Routes registered
```

### 3. Test Endpoint via Postman/cURL

```bash
curl -X GET http://localhost:5000/api/seller/store-courier-config \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:**

- 200 OK with data
- atau 404 if no config yet
- atau 401 if no token

❌ **NOT:**

- CORS error
- Connection refused
- 404 route not found

---

## 📋 Backend Files Modified

```
✅ Backend/routes/sellerRoutes.js
   - Added route alias /store-courier-config
   - Points to existing shippingController functions

✅ Backend/controllers/shippingController.js (already exists)
   - exports.getStoreCourierConfig
   - exports.saveStoreCourierConfig
```

---

## 🎯 Next Steps

1. **Restart backend** (Ctrl+C then node server.js)
2. **Refresh frontend** (F5 atau Ctrl+R)
3. **Check browser console** - CORS error should be gone
4. **Test the page** - /seller/settings/courier-config

---

**Status:** Route ready, need backend restart! 🔄
