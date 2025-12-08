// routes/sellerRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const sellerController = require("../controllers/sellerController");
const { protect } = require("../middleware/authMiddleware");

// === IMPORT ROUTE BARU ===
const storeSettingsRoutes = require("./storeSettings");
const templateRoutes = require("./templateRoutes");
const shippingController = require("../controllers/shippingController");

// === KONFIGURASI MULTER (Memory Storage for Cloudinary) ===
const uploadStoreImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

// === ROUTES ===
router.post("/register", protect, sellerController.registerSeller);

// Get current user's store
router.get("/stores/me", protect, sellerController.getMyStore);

// Get dashboard stats
router.get("/dashboard/stats", protect, sellerController.getDashboardStats);

// Update store details with images
router.put(
  "/stores/me",
  protect,
  uploadStoreImages.fields([
    { name: "profile_image", maxCount: 1 },
    { name: "background_image", maxCount: 1 },
  ]),
  sellerController.updateStoreDetails
);

// === SHIPPING/COURIER ROUTES ===
// Store courier configuration (kurir toko)
router.get(
  "/shipping/store-courier",
  protect,
  shippingController.getStoreCourierConfig
);
router.post(
  "/shipping/store-courier",
  protect,
  shippingController.saveStoreCourierConfig
);

// Alias route untuk store courier config (match frontend path)
router.get(
  "/store-courier-config",
  protect,
  shippingController.getStoreCourierConfig
);
router.post(
  "/store-courier-config",
  protect,
  shippingController.saveStoreCourierConfig
);

// Courier services (jasa pengiriman)
router.get(
  "/shipping/courier-services",
  protect,
  shippingController.getAllCourierServices
);
router.get(
  "/shipping/store-services",
  protect,
  shippingController.getStoreSelectedServices
);
router.post(
  "/shipping/store-services",
  protect,
  shippingController.updateStoreSelectedServices
);

// === SUB-ROUTES ===
router.use("/stores/me", protect, storeSettingsRoutes);
router.use("/stores/me/templates", protect, templateRoutes);

module.exports = router;
