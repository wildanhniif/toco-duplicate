const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  initPayment,
  notification,
  getStatus,
  syncPaymentStatus,
} = require("../controllers/paymentController");

// Init Snap transaction (user must be authenticated)
router.post("/init", protect, initPayment);

// Midtrans notification (webhook) - public endpoint
router.post("/notification", notification);

// Optional: check status by order_code
router.get("/status/:order_code", protect, getStatus);

// Manual sync status (by order_id)
router.post("/sync/:order_id", protect, syncPaymentStatus);

module.exports = router;
