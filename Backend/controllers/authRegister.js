const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Kita gunakan JWT untuk token verifikasi
const { validationResult } = require('express-validator');
const { sendVerificationEmail } = require('../utils/mailer'); // <-- Impor service email kita

// ... fungsi register yang sudah ada, kita modifikasi isinya

const register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, phoneNumber, email, password, jenisKelamin, tanggalLahir } = req.body;

    try {
        // ... (Cek existingUser masih sama)
        const [existingUser] = await pool.query("SELECT * FROM users WHERE email = ? OR phone_number = ?", [email, phoneNumber]);
        if (existingUser.length > 0) {
            return res.status(409).json({ message: "Email atau Nomor Telepon sudah terdaftar." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const sqlQuery = `
            INSERT INTO users 
                (full_name, phone_number, email, password, gender, birth_date) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const values = [fullName, phoneNumber, email, hashedPassword, jenisKelamin, tanggalLahir];

        const [result] = await pool.query(sqlQuery, values);
        const userId = result.insertId;

        // Buat token verifikasi menggunakan JWT
        const verificationToken = jwt.sign(
            { id: userId },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Token berlaku 1 jam
        );

        // Kirim email verifikasi
        await sendVerificationEmail(email, verificationToken);

        res.status(201).json({
            message: "Registrasi berhasil. Silakan cek email Anda untuk verifikasi."
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};

// Buat fungsi baru untuk handle verifikasi
const verifyEmail = async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ message: "Token tidak disediakan." });
    }

    try {
        // Verifikasi token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        // Update status verifikasi user di database
        await pool.query(
            "UPDATE users SET is_verified = 1 WHERE id = ?",
            [userId]
        );

        res.status(200).json({ message: "Akun berhasil diverifikasi! Silakan login." });

    } catch (error) {
        // Tangani jika token tidak valid atau kedaluwarsa
        res.status(401).json({ message: "Token tidak valid atau sudah kedaluwarsa." });
    }
};


module.exports = {
    register,
    verifyEmail // <-- Ekspor fungsi baru
};