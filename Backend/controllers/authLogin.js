const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// controllers/authLogin.js

const login = async (req, res) => {
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
        let store_Id = null; // Default storeId adalah null

        // Cek jika user adalah seller, dan HANYA JIKA seller, cari storeId-nya.
        if (user.role === 'seller') {
            const [stores] = await pool.query('SELECT store_id FROM stores WHERE user_id = ?', [user.user_id]);
            if (stores.length > 0) {
                store_Id = stores[0].store_id;
            }
        }
        
        // Cek jika akun sudah diverifikasi
        if (!user.is_verified) {
            return res.status(403).json({ message: "Akun belum diverifikasi." });
        }

        // Cek kecocokan password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Password salah." });
        }

        // --- INI BAGIAN PAYLOAD YANG DISEMPURNAKAN ---
        // Payload ini sekarang secara universal benar untuk semua role.
        // Jika user adalah admin, storeId akan menjadi 'null'.
        // Jika user adalah seller, storeId akan terisi.
// controllers/authLogin.js - SETELAH DIPERBAIKI
        const payload = { 
            user_id: user.user_id,
            name: user.name,
            role: user.role,
            storeId: store_Id // <-- 'i' kecil, sekarang konsisten!
        };

        // Buat dan kirim token
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1d' } // Saya sarankan untuk waktu yang lebih lama
        );

        res.json({ message: "Login berhasil!", token });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};

module.exports = {
    login
    // nanti bisa ditambahkan fungsi lain seperti forgotPassword, resetPassword, dll.
};