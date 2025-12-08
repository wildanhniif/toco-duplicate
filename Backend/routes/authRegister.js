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

], register);

router.post('/verify-email', verifyEmail);

// Export router
module.exports = router;