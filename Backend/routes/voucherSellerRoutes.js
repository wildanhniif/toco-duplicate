// routes/voucherSellerRoutes.js

const express = require("express");
const router = express.Router();
const {
  createVoucher,
  getMyVouchers,
  getVoucherById,
  duplicateVoucher,
  endVoucher,
} = require("../controllers/voucherSellerController");

// Impor middleware proteksi
const { protect } = require("../middleware/authMiddleware");

// Routes
// POST /api/vouchers - Create voucher (harus sebelum /:id)
router.post("/", protect, createVoucher);

// GET /api/vouchers/my - List voucher seller dengan filter/sort
router.get("/my", protect, getMyVouchers);

// POST /api/vouchers/:id/duplicate - Duplicate voucher (harus sebelum /:id)
router.post("/:id/duplicate", protect, duplicateVoucher);

// PUT /api/vouchers/:id/end - End voucher (harus sebelum /:id)
router.put("/:id/end", protect, endVoucher);

// GET /api/vouchers/:id - Get voucher detail
router.get("/:id", protect, getVoucherById);

module.exports = router;

