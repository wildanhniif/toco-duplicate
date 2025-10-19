// routes/sellerRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const sellerController = require('../controllers/sellerController');
const { protect } = require('../middleware/authMiddleware');

// === KONFIGURASI MULTER LAMA (UNTUK PROFIL & BACKGROUND TOKO) ===
const storeImageStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/stores/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = req.user.id + '-' + Date.now();
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const uploadStoreImages = multer({ storage: storeImageStorage });


// === KONFIGURASI MULTER BARU (UNTUK THUMBNAIL HALAMAN 'TENTANG') ===
const aboutPageStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/about_thumbnails/'), // Folder terpisah
    filename: (req, file, cb) => {
        const uniqueSuffix = req.user.id + '-' + Date.now();
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const uploadAboutThumbnail = multer({ storage: aboutPageStorage });

// === ROUTES YANG SUDAH ADA ===
router.post('/register', protect, sellerController.registerSeller);

router.put(
    '/stores/me', 
    protect, 
    uploadStoreImages.fields([
        { name: 'profile_image', maxCount: 1 },
        { name: 'background_image', maxCount: 1 }
    ]), 
    sellerController.updateStoreDetails
);

// === ROUTES BARU UNTUK PENGATURAN TOKO ===

// 1. GET - Mendapatkan semua informasi & pengaturan toko saat ini
// Berguna untuk mengisi form di halaman pengaturan
router.get('/stores/me/settings', protect, sellerController.getStoreSettings);

// 2. PUT - Mengupdate pengaturan umum (Mode Libur & Tampilkan No. Telp)
// Endpoint ini khusus untuk data non-file agar lebih ringan
router.put('/stores/me/settings', protect, sellerController.updateStoreSettings);

// 3. PUT - Membuat atau Mengupdate Halaman "Tentang Toko"
// Menggunakan PUT karena sifatnya "create or update" (idempotent)
router.put(
    '/stores/me/about', 
    protect, 
    uploadAboutThumbnail.single('thumbnail'), // Handle satu file 'thumbnail'
    sellerController.createOrUpdateAboutPage
);

module.exports = router;