const db = require('../config/database');
const { deleteFromCloudinary } = require('../utils/uploadToCloudinary');

// @desc    Get all banners (Public)
// @route   GET /api/banners
// @access  Public
exports.getBanners = async (req, res) => {
    const { type } = req.query;
    try {
        let query = "SELECT * FROM banners WHERE is_active = 1";
        const params = [];

        if (type) {
            query += " AND type = ?";
            params.push(type);
        }

        query += " ORDER BY sort_order ASC, created_at DESC";

        const [banners] = await db.query(query, params);
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
    const { type } = req.query;
    try {
        let query = "SELECT * FROM banners";
        const params = [];

        if (type) {
            query += " WHERE type = ?";
            params.push(type);
        }
        
        query += " ORDER BY created_at DESC";
        
        const [banners] = await db.query(query, params);
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
    const { title, image_url, public_id, redirect_url, is_active, sort_order, type } = req.body;
    
    if (!image_url) {
        return res.status(400).json({ message: 'Image URL is required' });
    }

    try {
        const [result] = await db.query(
            "INSERT INTO banners (title, type, image_url, public_id, redirect_url, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [title || '', type || 'main', image_url, public_id || null, redirect_url || '', is_active ? 1 : 0, sort_order || 0]
        );
        
        res.status(201).json({ 
            id: result.insertId,
            title, type, image_url, public_id, redirect_url, is_active, sort_order 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create multiple banners (Batch)
// @route   POST /api/banners/batch
// @access  Admin
exports.createBatchBanners = async (req, res) => {
    const { banners, type } = req.body;
    
    if (!banners || !Array.isArray(banners) || banners.length === 0) {
        return res.status(400).json({ message: 'Banners array is required' });
    }

    try {
        // Get current max sort order
        const [rows] = await db.query("SELECT MAX(sort_order) as maxOrder FROM banners WHERE type = ?", [type || 'main']);
        let currentOrder = (rows[0].maxOrder || 0) + 1;

        // Prepare values for bulk insert
        const values = banners.map(b => [
            b.title || '', 
            type || 'main', 
            b.image_url, 
            b.public_id || null, 
            b.redirect_url || '', 
            1, // is_active default true
            currentOrder++
        ]);

        if (values.length === 0) return res.status(400).json({ message: "No valid banners to insert" });

        // Helper to flatten the array for mysql2
        const placeholders = values.map(() => "(?, ?, ?, ?, ?, ?, ?)").join(", ");
        const flatValues = values.flat();

        const query = `INSERT INTO banners (title, type, image_url, public_id, redirect_url, is_active, sort_order) VALUES ${placeholders}`;

        await db.query(query, flatValues);
        
        res.status(201).json({ message: `Successfully added ${values.length} banners`, count: values.length });
    } catch (error) {
        console.error("Batch create error:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update a banner
// @route   PUT /api/banners/:id
// @access  Admin
exports.updateBanner = async (req, res) => {
    const { id } = req.params;
    const { title, image_url, public_id, redirect_url, is_active, sort_order, type } = req.body;

    try {
        // Get existing banner to check if image changed
        const [existing] = await db.query("SELECT * FROM banners WHERE id = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Banner not found' });
        }
        
        const oldBanner = existing[0];

        // If image URL changed and there was an old public_id, delete old image from Cloudinary
        if (image_url !== oldBanner.image_url && oldBanner.public_id) {
             // Only delete if the new image is different and old image effectively exists
             try {
                await deleteFromCloudinary(oldBanner.public_id);
             } catch (err) {
                 console.error("Failed to delete old banner image:", err);
                 // Continue update even if delete fails
             }
        }

        const [result] = await db.query(
            "UPDATE banners SET title = ?, type = ?, image_url = ?, public_id = ?, redirect_url = ?, is_active = ?, sort_order = ? WHERE id = ?",
            [title, type || 'main', image_url, public_id || oldBanner.public_id, redirect_url, is_active, sort_order, id]
        );

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
        // Get banner first to retrieve public_id
        const [banners] = await db.query("SELECT * FROM banners WHERE id = ?", [id]);
        
        if (banners.length === 0) {
            return res.status(404).json({ message: 'Banner not found' });
        }

        const banner = banners[0];

        // Delete from database
        const [result] = await db.query("DELETE FROM banners WHERE id = ?", [id]);

        // Delete image from Cloudinary if public_id exists
        if (banner.public_id) {
            try {
                await deleteFromCloudinary(banner.public_id);
            } catch (err) {
                 console.error("Failed to delete banner image from Cloudinary:", err);
                 // We still consider the banner deleted from our system
            }
        }

        res.json({ message: 'Banner deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
