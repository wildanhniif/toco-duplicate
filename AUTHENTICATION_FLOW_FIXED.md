# Dokumentasi Alur Autentikasi yang Telah Diperbaiki

## Overview

Sistem autentikasi telah diperbaiki untuk memastikan alur yang jelas dan konsisten antara user biasa dan seller. Berikut adalah alur lengkap yang sudah diperbaiki.

---

## 1. Alur Registrasi User

### Manual Registration

1. **User mengakses** `/register`
2. **Mengisi form** dengan data: Nama Lengkap, Nomor Telepon, Email, Password
3. **Submit form** → Frontend kirim request ke `POST /api/auth/register`
4. **Backend proses:**
   - Validasi data
   - Hash password dengan bcrypt
   - Insert ke database dengan `role='customer'`, `is_verified=0`
   - Generate JWT token untuk verifikasi email (berlaku 1 jam)
   - Kirim email verifikasi ke user
5. **Frontend:**
   - Tampilkan pesan sukses
   - **Redirect ke home page** setelah 2 detik

### Google OAuth Registration (Otomatis)

1. **User klik tombol** "Login dengan Google" di `/login`
2. **Backend Google OAuth:**
   - User authorize dengan Google
   - Backend cek apakah user sudah ada di database
   - Jika baru, create user otomatis dengan `is_verified=1`, `role='customer'`
   - Generate JWT token (berlaku 1 hari)
3. **Frontend:**
   - Terima token dari callback
   - Simpan token ke localStorage
   - **Redirect ke home page**

---

## 2. Alur Verifikasi Email

1. **User menerima email** dengan link verifikasi
2. **Klik link** → Menuju `/verify-email?token=xxx`
3. **Frontend:**
   - Ambil token dari URL
   - Kirim request ke `POST /api/auth/verify-email` dengan token
4. **Backend:**
   - Verifikasi JWT token
   - Set `is_verified=1` dan `email_verified_at=NOW()`
5. **Frontend:**
   - Tampilkan status verifikasi (success/error)
   - Tombol untuk login atau kembali ke home

---

## 3. Alur Login User

### Manual Login

1. **User mengakses** `/login`
2. **Masukkan** email/nomor HP dan password
3. **Submit** → Frontend kirim ke `POST /api/auth/login`
4. **Backend:**
   - Cari user berdasarkan identifier
   - Cek `is_verified` (harus 1)
   - Verifikasi password dengan bcrypt
   - Generate JWT token dengan payload:
     ```json
     {
       "user_id": 123,
       "name": "Nama User",
       "role": "customer",
       "store_id": null
     }
     ```
   - Token berlaku 1 hari
5. **Frontend:**
   - Simpan token ke localStorage
   - Cek parameter `redirect_to_seller`:
     - Jika `true` → redirect ke `/seller/login`
     - Jika tidak → redirect ke `/` (home)

### Google OAuth Login

1. **User klik** "Login dengan Google"
2. **OAuth flow** sama seperti registration
3. **Backend:**
   - Jika user sudah ada, ambil role dan store_id
   - Generate token dengan data lengkap
4. **Frontend:**
   - Simpan token
   - Redirect ke home page

---

## 4. Alur "Mulai Jualan" (Seller Registration)

### Jika User BELUM Login

1. **User klik** tombol "Mulai Jualan" di navbar
2. **Frontend redirect** ke `/login?redirect_to_seller=true`
3. **User login** (manual atau Google)
4. **Setelah login berhasil:**
   - Frontend deteksi parameter `redirect_to_seller=true`
   - **Redirect ke** `/seller/login`

### Jika User SUDAH Login sebagai Customer

1. **User klik** tombol "Mulai Jualan" di navbar
2. **Frontend redirect langsung** ke `/seller/login`

---

## 5. Alur Login Seller (Registrasi Seller)

### Akses Seller Login Page

1. **User akses** `/seller/login`
2. **SellerAuthLayout cek:**
   - Jika NOT authenticated → redirect ke `/login?redirect_to_seller=true`
   - Jika authenticated → tampilkan form seller login

### Manual Seller Registration

1. **User yang sudah login** mengisi form di `/seller/login`
2. **Submit form:**
   - Frontend kirim ke `POST /api/auth/login` (login ulang untuk validasi)
   - Setelah dapat token, cek role di token:
     - Jika sudah `seller` → langsung ke dashboard
     - Jika masih `customer` → lanjut ke step 3
3. **Daftarkan sebagai seller:**
   - Frontend kirim ke `POST /api/sellers/register` dengan token
4. **Backend:**
   - Cek apakah user sudah seller (return 409 jika sudah)
   - Update `users.role = 'seller'`
   - Create entry di tabel `stores` dengan default name
   - Generate JWT token baru dengan:
     ```json
     {
       "user_id": 123,
       "name": "Nama User",
       "role": "seller",
       "store_id": 456
     }
     ```
5. **Frontend:**
   - Simpan token baru
   - **Redirect ke** `/seller/dashboard`

### Google OAuth Seller Registration

1. **User klik** "Login dengan Google" di `/seller/login`
2. **Frontend:**
   - Set flag `localStorage.seller_registration_pending = "true"`
   - Redirect ke `/api/auth/google`
3. **Setelah OAuth berhasil:**
   - Redirect ke `/google/callback?token=xxx`
4. **Frontend callback handler:**
   - Deteksi flag `seller_registration_pending`
   - Kirim request ke `POST /api/sellers/register` dengan token
5. **Backend sama seperti manual registration**
6. **Frontend:**
   - Hapus flag `seller_registration_pending`
   - Simpan token baru
   - **Redirect ke** `/seller/dashboard`

---

## 6. Akses Seller Dashboard

1. **User akses** `/seller/dashboard`
2. **Frontend (useEffect di dashboard):**
   - Cek `isAuthenticated` dari useAuth hook
   - Cek `user.role === 'seller'`
   - Jika NOT authenticated → redirect ke `/seller/login`
   - Jika authenticated tapi NOT seller → redirect ke `/`
   - Jika authenticated dan seller → tampilkan dashboard
3. **Dashboard:**
   - Tampilkan stats (pesanan, produk, chat)
   - Jika toko belum diverifikasi → tampilkan banner verifikasi
   - Banner punya tombol ke `/seller/store/setup`

---

## Perubahan yang Telah Dilakukan

### Backend Changes

1. ✅ **authGoogle.js** - Token expiry diubah dari `1h` ke `1d` untuk konsistensi
2. ✅ **authGoogle.js** - Hapus redirect ke /register untuk new Google users, langsung login
3. ✅ **passport.js** - Auto-create dan verify Google OAuth users

### Frontend Changes

1. ✅ **AuthButton.tsx** - Fix redirect logic untuk "Mulai Jualan":

   - Not logged in → `/login?redirect_to_seller=true`
   - Logged in as customer → `/seller/login` langsung
   - Logged in as seller → Tampilkan "Toco Seller" button

2. ✅ **LoginForm.tsx** - Handle parameter `redirect_to_seller`:

   - Jika true → redirect ke `/seller/login` setelah login
   - Jika false → redirect ke home

3. ✅ **RegisterForm.tsx** - Auto redirect ke home setelah registrasi berhasil (2 detik delay)

4. ✅ **SellerAuthLayout.tsx** - Fix redirect untuk unauthenticated users:

   - Redirect ke `/login?redirect_to_seller=true`

5. ✅ **Email Verification Page** - Buat halaman `/verify-email`:
   - Tampilkan loading/success/error state
   - Button untuk login atau home
   - Auto-verify email dengan token dari URL

---

## Flow Chart

```
User Baru
  ├─ Manual Register → Email Verify → Login → Home ✅
  └─ Google OAuth → Auto-login → Home ✅

User Login
  ├─ Manual Login → Home ✅
  ├─ Manual Login (redirect_to_seller) → Seller Login ✅
  └─ Google OAuth → Home ✅

User → Seller
  ├─ Not logged in: Click "Mulai Jualan" → Login → Seller Login → Dashboard ✅
  ├─ Logged in: Click "Mulai Jualan" → Seller Login → Dashboard ✅
  ├─ Manual Seller Login → Register Seller → Dashboard ✅
  └─ Google OAuth Seller Login → Register Seller → Dashboard ✅

Seller
  └─ Access Dashboard → Check auth → Show Dashboard atau Setup Store ✅
```

---

## Testing Checklist

- [ ] User register manual → dapat email → verify email → login berhasil
- [ ] User register via Google → langsung login berhasil
- [ ] User login manual → masuk ke home page
- [ ] User belum login klik "Mulai Jualan" → redirect ke login → redirect ke seller login
- [ ] User sudah login klik "Mulai Jualan" → langsung ke seller login
- [ ] Seller login manual → daftar seller → masuk dashboard
- [ ] Seller login Google → daftar seller → masuk dashboard
- [ ] Seller akses dashboard → cek toko belum setup → tampilkan banner
- [ ] Non-seller akses seller dashboard → redirect ke home

---

## Catatan Penting

1. **Token Expiry:** Semua token sekarang konsisten menggunakan `1d` (1 hari)
2. **Google OAuth:** New users otomatis verified dan langsung login
3. **Seller Registration:** Harus login dulu sebagai customer baru bisa daftar seller
4. **Email Verification:** User baru via manual register wajib verify email
5. **Redirect Logic:** Menggunakan parameter `redirect_to_seller` bukan `redirect`

## File yang Diubah

### Backend

- `Backend/routes/authGoogle.js`
- `Backend/config/passport.js`

### Frontend

- `Frontend/src/components/composites/Navbar/AuthButton.tsx`
- `Frontend/src/components/fragments/LoginForm.tsx`
- `Frontend/src/components/fragments/RegisterForm.tsx`
- `Frontend/src/components/layouts/SellerAuthLayout.tsx`

### Frontend (Baru)

- `Frontend/src/app/(auth)/verify-email/page.tsx`
- `Frontend/src/views/auth/verify-email/index.tsx`
