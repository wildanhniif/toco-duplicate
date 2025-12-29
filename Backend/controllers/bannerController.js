const db = require('../config/database');

// @desc    Get all banners (Public)
// @route   GET /api/banners
// @access  Public
exports.getBanners = async (req, res) => {
    try {
        const [banners] = await db.query("SELECT * FROM banners WHERE is_active = 1 ORDER BY sort_order ASC, created_at DESC");
        res.json(banners);
    } catch (error) {
        // If table doesn't exist, return empty array to prevent crash on frontend
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.json([]);
        }
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all banners (Admin - includes inactive)
// @route   GET /api/banners/admin
// @access  Admin
exports.getAllBannersAdmin = async (req, res) => {
    try {
        const [banners] = await db.query("SELECT * FROM banners ORDER BY created_at DESC");
        res.json(banners);
    } catch (error) {
         if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.json([]);
        }
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a banner
// @route   POST /api/banners
// @access  Admin
exports.createBanner = async (req, res) => {
    const { title, image_url, redirect_url, is_active, sort_order } = req.body;
    
    if (!image_url) {
        return res.status(400).json({ message: 'Image URL is required' });
    }

    try {
        const [result] = await db.query(
            "INSERT INTO banners (title, image_url, redirect_url, is_active, sort_order) VALUES (?, ?, ?, ?, ?)",
            [title || '', image_url, redirect_url || '', is_active ? 1 : 0, sort_order || 0]
        );
        
        res.status(201).json({ 
            id: result.insertId,
            title, image_url, redirect_url, is_active, sort_order 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update a banner
// @route   PUT /api/banners/:id
// @access  Admin
exports.updateBanner = async (req, res) => {
    const { id } = req.params;
    const { title, image_url, redirect_url, is_active, sort_order } = req.body;

    try {
        const [result] = await db.query(
            "UPDATE banners SET title = ?, image_url = ?, redirect_url = ?, is_active = ?, sort_order = ? WHERE id = ?",
            [title, image_url, redirect_url, is_active, sort_order, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Banner not found' });
        }

        res.json({ message: 'Banner updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a banner
// @route   DELETE /api/banners/:id
// @access  Admin
exports.deleteBanner = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.query("DELETE FROM banners WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Banner not found' });
        }

        res.json({ message: 'Banner deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
