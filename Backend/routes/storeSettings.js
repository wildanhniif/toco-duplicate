// routes/storeSettings.js
const express = require('express');
// Gunakan { mergeParams: true } agar router ini bisa 'mewarisi' parameter dari router induknya
const router = express.Router({ mergeParams: true });
const multer = require('multer');
const path = require('path');
const storeSettingsController = require('../controllers/storeSettings');
const { protect } = require('../middleware/authMiddleware');

// === KONFIGURASI MULTER (PINDAHKAN DARI sellerRoutes.js) ===
const aboutPageStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/about_thumbnails/'), // Folder terpisah
    filename: (req, file, cb) => {
        // req.user.id didapat dari middleware 'protect' yang dipasang di route
        const uniqueSuffix = req.user.id + '-' + Date.now();
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const uploadAboutThumbnail = multer({ storage: aboutPageStorage });

// === ROUTES BARU (path relatif) ===
// Catatan: 'protect' sudah dijalankan di sellerRoutes.js sebelum router ini,
// tapi kita pasang lagi di sini untuk keamanan berlapis (best practice).

// Path menjadi: /stores/me/settings
router.get(
    '/settings', 
    protect, 
    storeSettingsController.getStoreSettings
);

// Path menjadi: /stores/me/settings
router.put(
    '/settings', 
    protect, 
    storeSettingsController.updateStoreSettings
);

// Path menjadi: /stores/me/about
router.put(
    '/about', 
    protect, 
    uploadAboutThumbnail.single('thumbnail'), // Handle satu file 'thumbnail'
    storeSettingsController.createOrUpdateAboutPage
);

// =====================================
// === ROUTE BARU UNTUK KURIR TOKO ===
// =====================================

// Path akan menjadi: GET /stores/me/courier
router.get(
    '/courier',
    protect,
    storeSettingsController.getStoreCourierSettings
);

// Path akan menjadi: PUT /stores/me/courier
router.put(
    '/courier',
    protect,
    storeSettingsController.updateStoreCourierSettings
);

// =====================================================
// === ROUTE BARU UNTUK JASA PENGIRIMAN PIHAK KETIGA ===
// =====================================================

// Path akan menjadi: GET /stores/me/logistics
// (Mengambil daftar semua kurir dan status centangnya)
router.get(
    '/logistics',
    protect,
    storeSettingsController.getAvailableCouriers
);

// Path akan menjadi: PUT /stores/me/logistics
// (Menyimpan perubahan centang)
router.put(
    '/logistics',
    protect,
    storeSettingsController.updateSelectedCouriers
);

module.exports = router;