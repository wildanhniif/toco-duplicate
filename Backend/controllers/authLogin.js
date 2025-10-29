const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const login = async (req, res) => {
    // ... (validasi error masih sama)
    
    const { identifier, password } = req.body;

    try {
        const [users] = await pool.query(
            "SELECT * FROM users WHERE email = ? OR phone_number = ?",
            [identifier, identifier]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "User tidak ditemukan." });
        }

        const user = users[0];

        // ... (pengecekan is_verified dan password masih sama)
        if (!user.is_verified) {
            return res.status(403).json({ message: "Akun belum diverifikasi." });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Password salah." });
        }
        
        // --- INI BAGIAN YANG DIPERBAIKI ---
        const payload = { user_id: user.user_id };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ message: "Login berhasil!", token });
            }
        );

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};

module.exports = {
    login
    // nanti bisa ditambahkan fungsi lain seperti forgotPassword, resetPassword, dll.
};