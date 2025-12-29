const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const bannerController = require('../controllers/bannerController');

// Public
router.get('/', bannerController.getBanners);

// Admin
router.get('/admin', protect, isAdmin, bannerController.getAllBannersAdmin);
router.post('/', protect, isAdmin, bannerController.createBanner);
router.put('/:id', protect, isAdmin, bannerController.updateBanner);
router.delete('/:id', protect, isAdmin, bannerController.deleteBanner);

module.exports = router;
