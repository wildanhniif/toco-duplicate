const express = require('express');
const router = express.Router();
const { 
    createCategory, 
    getAllCategories, 
    getCategoryById, // <--- TAMBAHKAN IMPORT INI
    getCategoryTree,
    updateCategory, 
    deleteCategory 
} = require('../controllers/categories');

// CREATE
router.post('/', createCategory);

// READ
router.get('/tree', getCategoryTree);
router.get('/', getAllCategories);
router.get('/:id', getCategoryById); // <--- TAMBAHKAN RUTE INI

// UPDATE
router.put('/:id', updateCategory);

// DELETE
router.delete('/:id', deleteCategory);


module.exports = router;