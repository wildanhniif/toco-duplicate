const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware untuk memverifikasi token JWT.
 * Jika token valid, data user akan ditambahkan ke `req.user`.
 * Jika tidak, akan mengirim respon error.
 */
const protect = (req, res, next) => {
    let token;

    // 1. Cek apakah ada header 'Authorization' dan dimulai dengan 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 2. Ambil token dari header (Contoh: "Bearer eyJhbGci...")
            token = req.headers.authorization.split(' ')[1];

            // 3. Verifikasi token menggunakan secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 4. Tambahkan payload (data user) dari token ke objek `req`
            // Ini akan membuat data user tersedia di semua rute yang diproteksi
            req.user = decoded;

            // 5. Lanjutkan ke controller berikutnya
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };