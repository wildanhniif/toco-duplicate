const express = require('express');
const router = express.Router();
const { check } = require('express-validator');

// Impor controller yang sudah kita pisah
const { login } = require('../controllers/authLogin');

// Definisikan route untuk login
// Method: POST, Endpoint: /login
router.post('/login', [
    check('identifier', 'Email atau Nomor HP tidak boleh kosong').not().isEmpty(),
    check('password', 'Password tidak boleh kosong').exists()
], login);


// Export router
module.exports = router;