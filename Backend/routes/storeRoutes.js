const express = require("express");
const router = express.Router();

const { getStoreBySlug } = require("../controllers/storeController");

// Public route: get store details by slug
router.get("/:slug", getStoreBySlug);

module.exports = router;
