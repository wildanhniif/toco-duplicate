const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

// Fungsi helper untuk membuat OTP bisa ditaruh di sini atau di file /utils
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Fungsi Register
const register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, phoneNumber, email, password } = req.body;

    try {
        const [existingUser] = await pool.query(
            "SELECT email, phone_number FROM users WHERE email = ? OR phone_number = ?",
            [email, phoneNumber]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({ message: "Email atau Nomor Telepon sudah terdaftar." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP berlaku 10 menit

        const [result] = await pool.query(
            "INSERT INTO users (full_name, phone_number, email, password, otp_code, otp_expires_at) VALUES (?, ?, ?, ?, ?, ?)",
            [fullName, phoneNumber, email, hashedPassword, otp, otpExpires]
        );

        // TODO: Kirim OTP ke WhatsApp di sini
        console.log(`(REGISTER) OTP untuk ${phoneNumber} adalah: ${otp}`);

        res.status(201).json({
            message: "Registrasi berhasil. Silakan verifikasi OTP Anda.",
            userId: result.insertId
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};

// Jangan lupa export agar bisa digunakan di file router
module.exports = {
    register
    // nanti bisa ditambahkan fungsi lain seperti verifyOtp, resendOtp, dll.
};