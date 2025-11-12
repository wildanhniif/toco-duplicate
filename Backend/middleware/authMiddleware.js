const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware untuk memverifikasi token JWT.
 * Jika token valid, data user akan ditambahkan ke `req.user`.
 * Jika tidak, akan mengirim respon error.
 */
const protect = (req, res, next) => {
    let token;

    // Cek apakah ada header 'Authorization' dan dimulai dengan 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Ambil token dari header
            token = req.headers.authorization.split(' ')[1];

            // Verifikasi token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Tambahkan payload ke req.user
            req.user = decoded;

            // Lanjutkan ke controller berikutnya
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        // Jika tidak ada token
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };