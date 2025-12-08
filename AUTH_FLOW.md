# Dokumentasi Alur Register & Login

Project ini menggunakan:

- **Frontend**: Next.js (komponen `RegisterForm.tsx` dan `LoginForm.tsx`)
- **Backend**: Express.js (`Backend/index.js` + route & controller auth)
- **Database**: MySQL (tabel `users`, `stores`, dll.)
- **Format komunikasi**: HTTP + JSON

Secara default, base URL yang dipakai frontend:

- `API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"`
- Semua endpoint auth backend diprefiks dengan `/api/auth` (lihat `Backend/index.js`).

---

## 1. Alur Register (Manual)

### 1.1. Frontend: mengirim request

File utama: `Frontend/src/components/fragments/RegisterForm.tsx`

1. **User mengisi form register**
   - Field yang diisi:
     - `fullName`
     - `phoneNumber`
     - `email`
     - `password`
2. Saat tombol submit diklik, fungsi `handleSubmit` dijalankan:
   - Mencegah reload halaman (`event.preventDefault()`).
   - Reset state `error` dan `success`.
   - Set `loading = true`.
3. Frontend mengirim request ke backend:

   - **Method**: `POST`
   - **URL**: `${API_BASE_URL}/api/auth/register`
     - Jika ENV tidak di-set: `http://localhost:5000/api/auth/register`
   - **Headers**:
     - `Content-Type: application/json`
   - **Body (JSON)**:

     ```json
     {
       "fullName": "Nama Lengkap",
       "phoneNumber": "08123456789",
       "email": "user@example.com",
       "password": "passwordKuat"
     }
     ```

4. Frontend menunggu respon, lalu mem-`parse` ke JSON: `const data = await response.json();`
5. Jika **`!response.ok`**:
   - Frontend mencoba mengambil pesan error:
     - `data.message`, atau
     - `data.errors[0].msg` (jika ada array `errors` dari `express-validator`), atau
     - fallback: `"Registrasi gagal. Silakan periksa kembali data Anda."`
   - Pesan ini ditampilkan ke user lewat state `error`.
6. Jika **`response.ok`**:
   - Frontend mengambil `data.message` (jika ada) atau gunakan default:
     - `"Registrasi berhasil. Silakan cek email Anda untuk verifikasi."`
   - Pesan sukses disimpan di state `success` dan ditampilkan di UI.
   - (Opsional, di-comment): bisa redirect ke `/login` setelah beberapa detik.

### 1.2. Backend: route & validasi

File-file utama:

- `Backend/index.js`
- `Backend/routes/authRegister.js`
- `Backend/controllers/authRegister.js`
- `Backend/utils/mailer.js`

1. Di `Backend/index.js`:

   - Route auth register di-mount dengan prefix:

     ```js
     app.use("/api/auth", authLimiter, authRegisterRoutes);
     ```

2. Di `Backend/routes/authRegister.js` didefinisikan endpoint:

   - **Method**: `POST`
   - **Path**: `/register`
   - **Endpoint lengkap**: `/api/auth/register`
   - Menggunakan `express-validator` untuk memvalidasi field:
     - `fullName` tidak boleh kosong.
     - `phoneNumber` harus valid nomor HP Indonesia.
     - `email` harus format email.
     - `password` minimal 6 karakter.
   - Jika validasi lolos, request diteruskan ke controller `register` di `controllers/authRegister.js`.

### 1.3. Backend: proses register di controller

File: `Backend/controllers/authRegister.js`

Langkah-langkah di fungsi `register`:

1. **Cek hasil validasi**:
   - Mengambil `errors` dari `express-validator`.
   - Jika ada error:
     - Response: **HTTP 400**
     - Body: `{ errors: [ { msg: "pesan error" }, ... ] }`
2. **Ambil data dari body**:
   - `fullName`, `phoneNumber`, `email`, `password`, `googleId` (opsional).
3. **Cek apakah user sudah terdaftar**:
   - Query:
     - `SELECT * FROM users WHERE email = ? OR phone_number = ?`
   - Jika hasil query **tidak kosong**:
     - Response: **HTTP 409** (Conflict)
     - Body: `{ message: "Email atau Nomor Telepon sudah terdaftar." }`
4. **Hash password**:
   - Generate `salt` dengan `bcrypt.genSalt(10)`.
   - Hash password: `bcrypt.hash(password, salt)`.
5. **Insert user baru ke database**:
   - Query `INSERT INTO users` dengan kolom:
     - `full_name`
     - `phone_number`
     - `email`
     - `password_hash`
     - `role` di-set ke `'customer'`
     - `is_verified` di-set ke `0` (belum diverifikasi)
     - `is_active` di-set ke `1`
     - `google_id` (boleh `NULL`)
   - Menyimpan `insertId` sebagai `userId`.
6. **Generate token verifikasi email (JWT)**:

   - Menggunakan `jwt.sign` dengan payload:

     ```js
     {
       user_id: userId;
     }
     ```

   - Secret: `process.env.JWT_SECRET`
   - Expired: `1h` (token berlaku 1 jam).

7. **Kirim email verifikasi** (file `Backend/utils/mailer.js`):

   - Fungsi `sendVerificationEmail(email, verificationToken)` membentuk URL:

     ```txt
     http://localhost:3000/verify-email?token=<JWT_VERIFIKASI>
     ```

   - URL ini akan diklik user di frontend untuk mem-verifikasi akun.
   - Email dikirim menggunakan `nodemailer` (via `transporter` di file yang sama).

8. **Kirim respon ke frontend**:

   - Response: **HTTP 201**
   - Body kira-kira:

     ```json
     {
       "message": "Registrasi berhasil. Silakan cek email Anda untuk verifikasi.",
       "user_id": <ID user baru>
     }
     ```

9. Jika terjadi error tak terduga:
   - Response: **HTTP 500**
   - Body: `{ message: "Terjadi kesalahan pada server." }`

---

## 2. Alur Verifikasi Email

Setelah register sukses, user akan menerima email berisi link verifikasi:

```txt
http://localhost:3000/verify-email?token=<JWT_VERIFIKASI>
```

Komentar di `mailer.js` menjelaskan bahwa **frontend yang menerima token ini** kemudian akan mengirim token tersebut ke backend.

### 2.1. (Rencana) Frontend: kirim token verifikasi ke backend

Implementasi halaman `/verify-email` di frontend dapat (dan sebaiknya) melakukan langkah berikut:

1. Baca query `token` dari URL (`window.location.search` / router Next.js).
2. Kirim request ke backend:
   - **Method**: `POST`
   - **URL**: `${API_BASE_URL}/api/auth/verify-email`
   - **Body (JSON)**: `{ "token": "<JWT_VERIFIKASI>" }`

> Catatan: Flow ini sesuai dengan yang diharapkan oleh controller `verifyEmail` di backend.

### 2.2. Backend: endpoint & controller verifikasi

File:

- `Backend/routes/authRegister.js`
- `Backend/controllers/authRegister.js` (fungsi `verifyEmail`)

1. Di route:

   - Endpoint: **POST** `/api/auth/verify-email`
   - Handler: `verifyEmail`.

2. Fungsi `verifyEmail` melakukan:
   - Ambil `token` dari `req.body.token`.
   - Jika token tidak ada:
     - Response: **HTTP 400**
     - `{ message: "Token tidak disediakan." }`
   - Jika token ada:
     1. Verifikasi token dengan `jwt.verify(token, JWT_SECRET)`.
     2. Ambil `user_id` dari payload token.
     3. Update user di database:
        - Set `is_verified = 1`.
        - Set `email_verified_at = NOW()`.
     4. Response sukses:
        - **HTTP 200**
        - `{ message: "Akun berhasil diverifikasi! Silakan login." }`
   - Jika token invalid / expired:
     - Ditangkap di `catch`.
     - Response: **HTTP 401**
     - `{ message: "Token tidak valid atau sudah kedaluwarsa." }`

---

## 3. Alur Login (Manual: Email / Nomor HP + Password)

### 3.1. Frontend: mengirim request login

File: `Frontend/src/components/fragments/LoginForm.tsx`

1. User mengisi:
   - `identifier` → bisa berupa **email** atau **nomor HP**.
   - `password`.
2. Saat submit, `handleSubmit` dijalankan:
   - `event.preventDefault()`.
   - Reset `error`, set `loading = true`.
3. Frontend mengirim request ke backend:

   - **Method**: `POST`
   - **URL**: `${API_BASE_URL}/api/auth/login`
     - Default: `http://localhost:5000/api/auth/login`
   - **Headers**:
     - `Content-Type: application/json`
   - **Body (JSON)**:

     ```json
     {
       "identifier": "user@example.com", // atau "08123456789"
       "password": "passwordKuat"
     }
     ```

4. Response dari backend di-`parse` ke JSON (`data = await response.json()`).
5. Jika **`!response.ok`**:
   - Frontend mengambil `data.message` jika ada.
   - Jika tidak ada, fallback ke: `"Login gagal. Silakan periksa kembali data Anda."`.
   - Pesan ini ditempatkan di state `error` dan ditampilkan di bawah field.
6. Jika **`response.ok`**:
   - Frontend mengambil `data.token`.
   - Jika `token` ada dan sedang berjalan di browser (`typeof window !== "undefined"`):
     - Simpan ke `localStorage` dengan key: `"auth_token"`.
   - Setelah itu, redirect ke halaman utama: `router.push("/")`.
7. Jika terjadi error jaringan / exception lain:
   - Ditangkap di `catch`.
   - Pesan yang ditampilkan: `"Terjadi kesalahan pada server."`.

### 3.2. Backend: route login

File: `Backend/routes/authLogin.js`

1. Route didefinisikan sebagai:
   - **Method**: `POST`
   - **Path**: `/login`
   - Prefix dari `index.js`: `/api/auth`
   - Endpoint lengkap: `/api/auth/login`
2. Middleware `express-validator` yang dipasang:
   - `identifier` tidak boleh kosong.
   - `password` tidak boleh kosong.
3. Jika validasi terpenuhi, request diteruskan ke controller `login`.

### 3.3. Backend: proses login di controller

File: `Backend/controllers/authLogin.js`

Langkah-langkah di dalam fungsi `login`:

1. Ambil `identifier` dan `password` dari `req.body`.
2. Cari user di database berdasarkan `email` atau `phone_number`:

   ```sql
   SELECT * FROM users WHERE email = ? OR phone_number = ?
   ```

   - Parameter: `[identifier, identifier]`.
   - Jika **tidak ada user**:
     - Response: **HTTP 404**
     - `{ message: "User tidak ditemukan." }`

3. Jika user ditemukan, simpan ke variabel `user`.
4. Jika role user adalah `seller`, backend akan mencari `store_id` terkait di tabel `stores`:
   - Query: `SELECT store_id FROM stores WHERE user_id = ?`.
   - Jika ada store, `store_id` diisi dengan nilai tersebut; jika tidak, tetap `null`.
5. Cek status verifikasi akun:
   - Jika `user.is_verified` **false / 0**:
     - Response: **HTTP 403**
     - `{ message: "Akun belum diverifikasi." }`
6. Verifikasi password:
   - Menggunakan `bcrypt.compare(password, user.password_hash)`.
   - Jika hasilnya **false** (password salah):
     - Response: **HTTP 401**
     - `{ message: "Password salah." }`
7. Jika password benar, backend membentuk **payload JWT**:

   ```js
   const payload = {
     user_id: user.user_id,
     name: user.full_name,
     role: user.role,
     store_id: store_id, // null untuk non-seller
   };
   ```

8. Generate token JWT:
   - Menggunakan `jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" })`.
   - Token berlaku selama 1 hari.
9. Kirim respon sukses ke frontend:

   - Status: (default) **HTTP 200**.
   - Body:

     ```json
     {
       "message": "Login berhasil!",
       "token": "<JWT_TOKEN>"
     }
     ```

10. Jika ada error tak terduga:
    - Response: **HTTP 500**
    - `{ message: "Terjadi kesalahan pada server." }`

---

## 4. Alur Login dengan Google (Singkat)

Selain login manual, terdapat alur login dengan Google OAuth.

File terkait:

- `Backend/config/passport.js`
- `Backend/routes/authGoogle.js`
- `Frontend/src/app/(auth)/google/callback/page.tsx`

Ringkasan alur:

1. Frontend mengarahkan user ke backend endpoint:
   - `GET /api/auth/google`
   - Ditangani oleh `passport.authenticate("google", ...)`.
2. Setelah user mengizinkan akses di Google, Google memanggil:
   - `GET /api/auth/google/callback`
3. Di `passport.js` backend akan:
   - Mencari user berdasarkan `google_id` atau `email`.
   - Jika user belum ada → buat akun baru otomatis di tabel `users` dengan role `customer` dan `is_verified = 1`.
4. Di `routes/authGoogle.js`:
   - Jika user **baru pertama kali** login dengan Google:
     - Redirect ke halaman `/register` di frontend, membawa `fullName`, `email`, dan `googleId` di query string.
   - Jika user **sudah ada**:
     - Backend membuat JWT (payload berisi `id` dan `name`).
     - Redirect ke frontend `/google/callback?token=<JWT>`.
5. Frontend `GoogleCallbackPage` (`/google/callback`):
   - Membaca `token` dari query params.
   - Menyimpan `token` ke `localStorage` dengan key `"auth_token"`.
   - Redirect ke `/`.

---

## 5. Penggunaan Token JWT di Request Selanjutnya

Setelah login (manual atau Google), frontend menyimpan token JWT ke `localStorage` dengan key `auth_token`. Untuk mengakses endpoint yang membutuhkan autentikasi di backend, pola umumnya:

1. Ambil token dari `localStorage`.
2. Kirim di header **Authorization** setiap request:

   ```http
   Authorization: Bearer <JWT_TOKEN>
   ```

3. Di backend, middleware `protect` (`Backend/middleware/authMiddleware.js`) akan:
   - Mengecek apakah header `Authorization` ada dan dimulai dengan `Bearer`.
   - Mengambil token dan memverifikasi dengan `jwt.verify(token, JWT_SECRET)`.
   - Jika valid:
     - Menaruh payload JWT ke `req.user`.
     - Melanjutkan ke controller berikutnya (`next()`).
   - Jika tidak valid / tidak ada token:
     - Mengembalikan **HTTP 401** dengan pesan:
       - `"Not authorized, token failed"` atau
       - `"Not authorized, no token"`.

Dengan alur ini:

- **Register**: membuat akun + kirim email verifikasi.
- **Verifikasi email**: mengaktifkan akun (`is_verified = 1`).
- **Login manual / Google**: menghasilkan JWT yang disimpan di frontend.
- **Request terproteksi**: menggunakan token di header `Authorization` dan diverifikasi oleh middleware di backend.
