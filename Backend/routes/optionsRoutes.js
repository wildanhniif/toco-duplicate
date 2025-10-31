const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/options -> daftar opsi varian (misal Warna, Ukuran, Penyimpanan)
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT option_id, name FROM product_options ORDER BY name ASC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET /api/options/:optionId/values -> nilai tiap opsi (misal Hitam, Putih untuk Warna)
router.get('/:optionId/values', async (req, res) => {
    const { optionId } = req.params;
    try {
        const [rows] = await db.query(
            'SELECT value_id, value FROM product_option_values WHERE option_id = ? ORDER BY value ASC',
            [optionId]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;

