const express = require("express");
const router = express.Router();
const addressController = require("../controllers/addressController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, addressController.createAddress);
router.get("/", protect, addressController.getUserAddresses); // Get logged-in user's addresses
router.put("/:addressId", protect, addressController.updateAddress);
router.delete("/:addressId", protect, addressController.deleteAddress);

module.exports = router;
