// routes/sellerRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const sellerController = require('../controllers/sellerController');
const { protect } = require('../middleware/authMiddleware');

// === IMPORT ROUTE BARU ===
const storeSettingsRoutes = require('./storeSettings'); 
const templateRoutes = require('./templateRoutes');

// === KONFIGURASI MULTER ===
const storeImageStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/stores/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = req.user.user_id + '-' + Date.now();
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const uploadStoreImages = multer({ storage: storeImageStorage });

// === ROUTES ===
router.post('/register', protect, sellerController.registerSeller);

// Get current user's store
router.get('/stores/me', protect, sellerController.getMyStore);

// Update store details with images
router.put(
    '/stores/me', 
    protect, 
    uploadStoreImages.fields([
        { name: 'profile_image', maxCount: 1 },
        { name: 'background_image', maxCount: 1 }
    ]), 
    sellerController.updateStoreDetails
);

// === SUB-ROUTES ===
router.use('/stores/me', protect, storeSettingsRoutes);
router.use('/stores/me/templates', protect, templateRoutes);

module.exports = router;