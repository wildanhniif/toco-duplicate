// routes/storeSettings.js
const express = require("express");
// Gunakan { mergeParams: true } agar router ini bisa 'mewarisi' parameter dari router induknya
const router = express.Router({ mergeParams: true });
const multer = require("multer");
const path = require("path");
const storeSettingsController = require("../controllers/storeSettings");
const { protect } = require("../middleware/authMiddleware");

// === KONFIGURASI MULTER (Memory Storage for Cloudinary) ===
const uploadAboutThumbnail = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

// === ROUTES BARU (path relatif) ===
// Catatan: 'protect' sudah dijalankan di sellerRoutes.js sebelum router ini,
// tapi kita pasang lagi di sini untuk keamanan berlapis (best practice).

// Path menjadi: /stores/me/settings
router.get("/settings", protect, storeSettingsController.getStoreSettings);

// Path menjadi: /stores/me/settings
router.put("/settings", protect, storeSettingsController.updateStoreSettings);

// Path menjadi: /stores/me/about
router.put(
  "/about",
  protect,
  uploadAboutThumbnail.single("thumbnail"), // Handle satu file 'thumbnail'
  storeSettingsController.createOrUpdateAboutPage
);

// =====================================
// === ROUTE BARU UNTUK KURIR TOKO ===
// =====================================

// Path akan menjadi: GET /stores/me/courier
router.get(
  "/courier",
  protect,
  storeSettingsController.getStoreCourierSettings
);

// Path akan menjadi: PUT /stores/me/courier
router.put(
  "/courier",
  protect,
  storeSettingsController.updateStoreCourierSettings
);

// =====================================================
// === ROUTE BARU UNTUK JASA PENGIRIMAN PIHAK KETIGA ===
// =====================================================

// Path akan menjadi: GET /stores/me/logistics
// (Mengambil daftar semua kurir dan status centangnya)
router.get("/logistics", protect, storeSettingsController.getAvailableCouriers);

// Path akan menjadi: PUT /stores/me/logistics
// (Menyimpan perubahan centang)
router.put(
  "/logistics",
  protect,
  storeSettingsController.updateSelectedCouriers
);

module.exports = router;
