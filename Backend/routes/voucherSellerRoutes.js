// routes/voucherSellerRoutes.js

const express = require("express");
const router = express.Router();
const {
  getVouchers,
  getVoucherById,
  createVoucher,
  updateVoucher,
  duplicateVoucher,
  endVoucher,
  deleteVoucher,
  getVoucherStats,
} = require("../controllers/voucherController");

// Impor middleware proteksi
const { protect } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(protect);

// Stats (must be before /:id routes)
router.get("/stats", getVoucherStats);

// CRUD operations
router.get("/", getVouchers); // Supports filters: status, search, period, sort, type, target
router.get("/:id", getVoucherById);
router.post("/", createVoucher);
router.put("/:id", updateVoucher);
router.delete("/:id", deleteVoucher);

// Special actions
router.post("/:id/duplicate", duplicateVoucher);
router.put("/:id/end", endVoucher);

module.exports = router;
