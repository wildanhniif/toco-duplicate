const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { register, verifyEmail } = require('../controllers/authRegister');

router.post('/register', [
    // ... validasi yang sudah ada (fullName, phoneNumber, email, password)
    check('fullName', 'Nama lengkap tidak boleh kosong').not().isEmpty(),
    check('phoneNumber', 'Nomor telepon tidak valid').isMobilePhone('id-ID'),
    check('email', 'Masukkan email yang valid').isEmail(),
    check('password', 'Password minimal 6 karakter').isLength({ min: 6 }),

    // Validasi baru ditambahkan di sini
    check('jenisKelamin', 'Jenis kelamin tidak valid').optional().isIn(['Laki-laki', 'Perempuan']),
    check('tanggalLahir', 'Format tanggal lahir tidak valid (YYYY-MM-DD)').optional().isISO8601().toDate(),

], register);

router.post('/verify-email', verifyEmail);

// Export router
module.exports = router;