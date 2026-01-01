const express = require("express");
const router = express.Router();

const { getStoreBySlug, searchStores } = require("../controllers/storeController");

// Public route: search stores
router.get("/", searchStores);

// Public route: get store details by slug
router.get("/:slug", getStoreBySlug);

module.exports = router;
