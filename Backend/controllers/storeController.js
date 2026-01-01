const db = require("../config/database");

// Public: get store by slug for storefront page
const getStoreBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const sql = `
      SELECT
        s.store_id,
        s.user_id,
        s.name,
        s.slug,
        s.description,
        s.business_phone,
        s.show_phone_number,
        s.address_line,
        s.province,
        s.city,
        s.district,
        s.subdistrict,
        s.rating_average,
        s.review_count,
        s.profile_image_url,
        s.background_image_url,
        s.is_active,
        s.is_verified,
        s.created_at,
        (SELECT COUNT(*) FROM products p2 WHERE p2.store_id = s.store_id AND p2.deleted_at IS NULL AND p2.status = 'active') AS active_product_count
      FROM stores s
      WHERE s.slug = ? AND (s.deleted_at IS NULL OR s.deleted_at IS NULL)
      LIMIT 1
    `;

    const [rows] = await db.query(sql, [slug]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Store not found" });
    }

    return res.status(200).json({ store: rows[0] });
  } catch (error) {
    console.error("Error fetching public store by slug:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Public: search stores by name
const searchStores = async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;
    
    // If no query, return empty list (or popular stores if we wanted)
    if (!q) {
      return res.status(200).json({ stores: [] });
    }

    console.log("Searching stores with query:", q); // DEBUG LOG

    const sql = `
      SELECT
        s.store_id,
        s.name,
        s.slug,
        s.city,
        s.district,
        s.profile_image_url,
        s.rating_average,
        s.is_verified,
        (SELECT COUNT(*) FROM products p WHERE p.store_id = s.store_id AND p.status = 'active' AND p.deleted_at IS NULL) as product_count
      FROM stores s
      WHERE s.name LIKE ? AND s.deleted_at IS NULL AND s.is_active = 1
      LIMIT ?
    `;

    const [rows] = await db.query(sql, [`%${q}%`, parseInt(limit)]);

    return res.status(200).json({ stores: rows });
  } catch (error) {
    console.error("Error searching stores:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  getStoreBySlug,
  searchStores,
};
