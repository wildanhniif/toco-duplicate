// routes/sellerRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const sellerController = require('../controllers/sellerController');
const { protect } = require('../middleware/authMiddleware');

// === IMPORT ROUTE BARU ===
const storeSettingsRoutes = require('./storeSettings'); // <-- TAMBAHKAN INI

// === KONFIGURASI MULTER LAMA (UNTUK PROFIL & BACKGROUND TOKO) ===
// (Ini TETAP di sini)
const storeImageStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/stores/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = req.user.id + '-' + Date.now();
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const uploadStoreImages = multer({ storage: storeImageStorage });


// === KONFIGURASI MULTER BARU (UNTUK THUMBNAIL) ===
// (Kode multer 'aboutPageStorage' dan 'uploadAboutThumbnail' DIHAPUS dari sini)


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

// (SEMUA route di bawah ini: GET /stores/me/settings, PUT /stores/me/settings,
//  dan PUT /stores/me/about DIHAPUS dari sini)

// === SAMBUNGKAN SUB-ROUTER PENGATURAN ===
// Ini akan memberitahu Express untuk menggunakan 'storeSettingsRoutes'
// untuk path apapun yang dimulai dengan '/stores/me'
// Ini harus dipasang SETELAH route '/stores/me' di atas.
router.use('/stores/me', protect, storeSettingsRoutes); // <-- TAMBAHKAN INI

module.exports = router;