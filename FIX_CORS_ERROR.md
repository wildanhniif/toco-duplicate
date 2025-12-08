# ✅ Fix CORS Error - Store Courier Config

## 🔍 Root Cause

- ✅ Route sudah ditambahkan di `Backend/routes/sellerRoutes.js`
- ✅ CORS sudah properly configured di `Backend/index.js`
- ❌ **Backend belum di-restart** → Server masih pakai kode lama

---

## 🚀 SOLUTION: Restart Backend Server

### **Step 1: Check Backend Terminal**

Cari terminal yang running backend (biasanya ada message "Server running on port 5000")

### **Step 2: Stop Backend**

Di terminal backend, tekan:

```
Ctrl + C
```

Tunggu sampai server berhenti (biasanya 1-2 detik)

### **Step 3: Start Backend Lagi**

Di terminal yang sama:

```bash
cd Backend
node index.js
```

Atau jika pakai npm:

```bash
npm start
```

### **Step 4: Verify Server Running**

Terminal harus show:

```
✓ Connected to MySQL database
Server is running on port 5000
```

---

## 🔄 Alternative: Restart via PowerShell

Jika Anda tidak tahu terminal backend mana:

### Kill All Node Process

```powershell
# Buka PowerShell baru
Get-Process -Name node | Stop-Process -Force

# Start backend lagi
cd "c:\Users\WILDAN HANIF\Desktop\Blibli\Backend"
node index.js
```

---

## ✅ Verify Fix

### **1. Check Backend Terminal**

Harus show:

```
✓ Connected to MySQL database
Server is running on port 5000
```

### **2. Check Frontend Browser Console**

Sebelum restart:

```
❌ CORS policy error
❌ Failed to fetch
```

Setelah restart backend + refresh browser (F5):

```
✅ No CORS error
✅ Request sent to http://localhost:5000/api/seller/store-courier-config
✅ Response: 200 OK atau 404 (keduanya OK, berarti endpoint jalan)
```

### **3. Test Endpoint**

Buka browser baru, paste:

```
http://localhost:5000/api/seller/store-courier-config
```

Expected:

- ❌ TIDAK: "This site can't be reached" atau CORS error
- ✅ OK: JSON response (bisa error "No token" atau "Unauthorized" - ini normal)

---

## 🔍 Debug Checklist

If masih error setelah restart:

### ❓ Error: "Cannot GET /api/seller/store-courier-config"

**Problem:** Route tidak loaded
**Solution:**

```bash
# Check file sellerRoutes.js ada route ini:
router.get("/store-courier-config", protect, shippingController.getStoreCourierConfig);

# Re-save file dan restart backend
```

### ❓ Error: "CORS error" (masih ada)

**Problem:** Backend tidak di-restart dengan benar
**Solution:**

```bash
# Kill semua node process
Get-Process -Name node | Stop-Process -Force

# Start fresh
cd Backend
node index.js
```

### ❓ Error: "getStoreCourierConfig is not a function"

**Problem:** shippingController belum punya function ini
**Solution:** Check file `Backend/controllers/shippingController.js` harus ada:

```javascript
exports.getStoreCourierConfig = async (req, res) => { ... }
exports.saveStoreCourierConfig = async (req, res) => { ... }
```

---

## 📋 Files Modified

```
✅ Backend/routes/sellerRoutes.js (Line 57-67)
   - Added GET /store-courier-config
   - Added POST /store-courier-config

✅ Backend/controllers/shippingController.js (Already exists)
   - exports.getStoreCourierConfig (Line 342)
   - exports.saveStoreCourierConfig (Line 389)

✅ Backend/index.js (CORS already configured)
   - cors({ origin: "http://localhost:3000", credentials: true })
```

---

## 🎯 Quick Test

After backend restart:

### Terminal Test (Optional)

```bash
# Test with curl (if installed)
curl http://localhost:5000/api/seller/store-courier-config

# Expected: 401 Unauthorized (OK) atau 404 (OK)
# NOT Expected: Connection refused, CORS error
```

### Browser Test

1. Open **http://localhost:3000/seller/settings/courier-config**
2. Open **DevTools** (F12) → **Console** tab
3. **Refresh** page (F5)
4. Check console:
   - ✅ No CORS error
   - ✅ Request to localhost:5000 sent
   - ✅ Response received (200, 404, atau 401 semua OK)

---

## 📊 Expected Behavior After Fix

### Frontend Console (Success):

```javascript
// Request sent
GET http://localhost:5000/api/seller/store-courier-config

// Response received (one of these):
Status: 200 OK - Config data returned
Status: 404 Not Found - No config yet (first time)
Status: 401 Unauthorized - No token (need login)
```

### Frontend UI:

- ✅ Page loads (no infinite loading)
- ✅ No red error alert
- ✅ Form displays (if logged in)
- ✅ Can toggle "Aktifkan Kurir Toko"

---

## 🆘 Still Error?

Send me:

1. **Backend terminal output** (last 20 lines)
2. **Browser console** screenshot (DevTools → Console)
3. **Error message** exact text

---

## ⚡ TL;DR (Too Long Didn't Read)

```bash
# Terminal backend:
Ctrl + C
node index.js

# Browser:
F5 (refresh)

# Done! ✅
```

---

**Status:** Route added ✅ | Need backend restart 🔄 | CORS config OK ✅

**Action:** Restart backend sekarang!
