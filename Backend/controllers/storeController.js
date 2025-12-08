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

module.exports = {
  getStoreBySlug,
};
