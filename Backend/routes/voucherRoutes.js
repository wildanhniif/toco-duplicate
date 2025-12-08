// routes/voucherRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
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

// All routes require authentication
router.use(protect);

// Stats
router.get("/stats", getVoucherStats);

// CRUD operations
router.get("/", getVouchers);
router.get("/:id", getVoucherById);
router.post("/", createVoucher);
router.put("/:id", updateVoucher);
router.delete("/:id", deleteVoucher);

// Special actions
router.post("/:id/duplicate", duplicateVoucher);
router.put("/:id/end", endVoucher);

module.exports = router;
