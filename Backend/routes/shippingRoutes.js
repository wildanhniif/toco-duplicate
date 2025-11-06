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
} = require("../controllers/shippingController");

// GET /api/shipping/rates
router.get("/rates", protect, getRajaOngkirRates);

// Lokasi
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

// Perhitungan ongkir
router.post("/calculate/domestic", protect, calculateDomesticCost);
router.post("/calculate/international", protect, calculateInternationalCost);

// Tracking AWB
router.post("/track/waybill", protect, trackWaybill);

module.exports = router;
