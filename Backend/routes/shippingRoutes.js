const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getRajaOngkirRates,
  getProvinces,
  getCitiesByProvince,
  getDistrictsByCity,
  getSubDistrictsByDistrict,
  searchDomesticDestination,
  calculateDomesticCost,
  calculateInternationalCost,
  trackWaybill,
  getStoreCourierOptionsForBuyer,
} = require("../controllers/shippingController");

// GET /api/shipping/rates
router.get("/rates", protect, getRajaOngkirRates);

// Lokasi (protected)
router.get("/destination/province", protect, getProvinces);
router.get("/destination/city/:province_id", protect, getCitiesByProvince);
router.get("/destination/district/:city_id", protect, getDistrictsByCity);
router.get(
  "/destination/sub-district/:district_id",
  protect,
  getSubDistrictsByDistrict
);
router.get(
  "/destination/domestic-destination",
  protect,
  searchDomesticDestination
);

// Buyer-facing: daftar layanan pengiriman aktif per store
router.get(
  "/store/:store_id/services",
  protect,
  getStoreCourierOptionsForBuyer
);

// Lokasi (public) - untuk pencarian lokasi di navbar tanpa login
// GET /api/shipping/public/destination/province
router.get("/public/destination/province", getProvinces);

// GET /api/shipping/public/destination/domestic-destination
router.get(
  "/public/destination/domestic-destination",
  searchDomesticDestination
);

// Perhitungan ongkir
router.post("/calculate/domestic", protect, calculateDomesticCost);
router.post("/calculate/international", protect, calculateInternationalCost);

// Tracking AWB
router.post("/track/waybill", protect, trackWaybill);

module.exports = router;
