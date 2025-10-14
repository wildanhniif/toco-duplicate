const nodemailer = require('nodemailer');
require('dotenv').config();

// Konfigurasi transporter menggunakan kredensial dari .env
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVICE_HOST,
    port: process.env.EMAIL_SERVICE_PORT,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Mengirim email verifikasi
 * @param {string} to - Alamat email tujuan
 * @param {string} token - Token verifikasi
 */
const sendVerificationEmail = async (to, token) => {
    // URL ini harus mengarah ke halaman verifikasi di frontend Anda
    // Frontend kemudian akan mengirim token ke backend
    const verificationUrl = `http://localhost:3000/verify-email?token=${token}`;

    const mailOptions = {
        from: `"Digi Store" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: "Verifikasi Akun Digi Store Anda",
        html: `
            <h1>Selamat Datang di Digi Store!</h1>
            <p>Terima kasih telah mendaftar. Silakan klik link di bawah ini untuk memverifikasi akun Anda:</p>
            <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 14px 25px; text-align: center; text-decoration: none; display: inline-block;">Verifikasi Email Saya</a>
            <p>Link ini akan kedaluwarsa dalam 1 jam.</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email verifikasi terkirim ke: ${to}`);
    } catch (error) {
        console.error(`Gagal mengirim email verifikasi ke ${to}:`, error);
    }
};

module.exports = { sendVerificationEmail };