const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createOrder,
  getOrderStats,
  getMyOrders,
  getOrderDetail,
  getSellerOrderStats,
  getSellerOrders,
} = require("../controllers/orderController");

// Create order dari checkout (selected cart)
router.post("/", protect, createOrder);

// User: stats, list & detail
router.get("/my/stats", protect, getOrderStats);
router.get("/my", protect, getMyOrders);
router.get("/my/:id", protect, getOrderDetail);

// Seller: stats & list
router.get("/seller/stats", protect, getSellerOrderStats);
router.get("/seller", protect, getSellerOrders);

module.exports = router;
