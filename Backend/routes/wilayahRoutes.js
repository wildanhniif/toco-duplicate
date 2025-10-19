// routes/wilayahRoutes.js
const express = require('express');
const router = express.Router();
const wilayahController = require('../controllers/wilayahController');

// URL: GET http://localhost:3000/api/wilayah/provinces
router.get('/provinces', wilayahController.getProvinces);

// URL: GET http://localhost:3000/api/wilayah/cities?id_provinsi=32
router.get('/cities', wilayahController.getCities);

// URL: GET http://localhost:3000/api/wilayah/districts?id_kabupaten=32.73
router.get('/districts', wilayahController.getDistricts);

// URL: GET http://localhost:3000/api/wilayah/subdistricts?id_kecamatan=32.73.200
router.get('/subdistricts', wilayahController.getSubDistricts);

module.exports = router;