const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { protect } = require("../middleware/authMiddleware");
const { 
  validateCartItem, 
  validateUpdateCartItem, 
  validateVoucherCode,
  handleValidationErrors 
} = require("../middleware/validationMiddleware");

// All routes require authentication
router.use(protect);

// GET /api/cart
router.get("/", cartController.getCart);

// POST /api/cart/items - Add item dengan validation
router.post("/items", validateCartItem, handleValidationErrors, cartController.addItem);

// PUT /api/cart/items/:cart_item_id - Update item dengan validation
router.put("/items/:cart_item_id", validateUpdateCartItem, handleValidationErrors, cartController.updateItem);

// DELETE /api/cart/items/:cart_item_id
router.delete("/items/:cart_item_id", cartController.deleteItem);

// DELETE /api/cart/items (bulk)
router.delete("/items", cartController.deleteMultipleItems);

// DELETE /api/cart/items/selected
router.delete("/items/selected", cartController.deleteSelectedItems);

// PATCH /api/cart/select
router.patch("/select", cartController.selectAll);

// PUT /api/cart/address
router.put("/address", cartController.setAddress);

// PUT /api/cart/shipping/:store_id
router.put("/shipping/:store_id", cartController.setShipping);

// POST /api/cart/voucher - Apply voucher dengan validation
router.post("/voucher", validateVoucherCode, handleValidationErrors, cartController.applyVoucher);

// DELETE /api/cart/voucher
router.delete("/voucher", cartController.removeVoucher);

module.exports = router;
