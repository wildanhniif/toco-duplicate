const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");
const productVariantController = require("../controllers/productVariantController");

// Public route - Get variants for a product
router.get(
  "/products/:product_id/variants",
  productVariantController.getProductVariants
);

// Seller routes - Manage variants
router.post(
  "/products/:product_id/variants",
  authenticate,
  productVariantController.createVariant
);

router.put(
  "/products/variants/:variant_id",
  authenticate,
  productVariantController.updateVariant
);

router.delete(
  "/products/variants/:variant_id",
  authenticate,
  productVariantController.deleteVariant
);

module.exports = router;
