const express = require("express");
const router = express.Router();
const { register, verifyEmail } = require("../controllers/authRegister");
const { validateRegister, handleValidationErrors } = require("../middleware/validationMiddleware");

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user with comprehensive validation
 * @access  Public
 */
router.post("/register", validateRegister, handleValidationErrors, register);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify user email with token
 * @access  Public
 */
router.post("/verify-email", verifyEmail);

module.exports = router;