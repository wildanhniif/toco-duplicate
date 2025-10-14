const express = require('express');
const router = express.Router();
const { getUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware'); // <-- Impor middleware

// @route   GET api/users/profile
// @desc    Mendapatkan profil user yang sedang login
// @access  Private (membutuhkan token)
router.get('/profile', protect, getUserProfile); // <-- Terapkan middleware di sini

module.exports = router;