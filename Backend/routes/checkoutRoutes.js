const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const checkout = require("../controllers/checkoutController");

router.get("/", protect, checkout.getCheckoutSummary);

module.exports = router;
