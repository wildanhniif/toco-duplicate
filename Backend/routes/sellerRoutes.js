// routes/sellerRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const sellerController = require('../controllers/sellerController');
const { protect, isSeller } = require('../middleware/authMiddleware'); // Middleware otentikasi & otorisasi

// Konfigurasi Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/stores/'); // Pastikan folder ini sudah dibuat
    },
    filename: function (req, file, cb) {
        // Buat nama file unik: fieldname-userid-timestamp.ext
        const uniqueSuffix = req.user.id + '-' + Date.now();
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Route untuk registrasi seller
router.post('/register', protect, sellerController.registerSeller);

// Route untuk update informasi toko
router.put(
    '/stores/me', 
    protect, // Pastikan user login
    // isSeller, // Opsional: Middleware tambahan untuk cek role 'seller'
    upload.fields([ // Middleware multer untuk handle 2 field gambar
        { name: 'profile_image', maxCount: 1 },
        { name: 'background_image', maxCount: 1 }
    ]), 
    sellerController.updateStoreDetails
);

module.exports = router;