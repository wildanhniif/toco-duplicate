// routes/templateRoutes.js

const express = require('express');
// Tambahkan { mergeParams: true } agar router ini bisa "mewarisi"
// parameter dari router induk jika suatu saat dibutuhkan.
const router = express.Router({ mergeParams: true }); 

const templateController = require('../controllers/templateController.js');

// Rute ini akan menangani: GET /api/seller/stores/me/templates
router.get('/', templateController.getTemplates);

// Rute ini akan menangani: POST /api/seller/stores/me/templates
router.post('/', templateController.createTemplate);

// Rute ini akan menangani: PUT /api/seller/stores/me/templates/order
router.put('/order', templateController.updateTemplatesOrder);

// Rute ini akan menangani: PUT /api/seller/stores/me/templates/:templateId
router.put('/:templateId', templateController.updateTemplate);

// Rute ini akan menangani: DELETE /api/seller/stores/me/templates/:templateId
router.delete('/:templateId', templateController.deleteTemplate);

module.exports = router;