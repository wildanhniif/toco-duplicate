const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const checkout = require("../controllers/checkoutController");

router.get("/", protect, checkout.getCheckout);
router.get("/summary", protect, checkout.getCheckoutSummary);
router.put("/note/:store_id", protect, checkout.setStoreNote);
router.post("/create-order", protect, checkout.createOrder);

module.exports = router;
