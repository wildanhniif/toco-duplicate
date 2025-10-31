const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const cart = require("../controllers/cartController");

// Semua endpoint cart butuh auth
router.get("/", protect, cart.getCart);
router.post("/items", protect, cart.addItem);
router.put("/items/:cart_item_id", protect, cart.updateItem);
router.delete("/items/:cart_item_id", protect, cart.deleteItem);
router.patch("/select", protect, cart.selectAll);
router.put("/address", protect, cart.setAddress);
router.put("/shipping/:store_id", protect, cart.setShipping);
router.put("/voucher", protect, cart.setVoucher);
router.post("/validate-voucher", protect, cart.validateVoucher);

module.exports = router;
