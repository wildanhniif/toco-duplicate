const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createOrder,
  getMyOrders,
  getOrderDetail,
  getSellerOrders,
} = require("../controllers/orderController");

// Create order dari checkout (selected cart)
router.post("/", protect, createOrder);

// User: list & detail
router.get("/my", protect, getMyOrders);
router.get("/my/:id", protect, getOrderDetail);

// Seller: list
router.get("/seller", protect, getSellerOrders);

module.exports = router;

