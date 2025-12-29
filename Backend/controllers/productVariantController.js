const pool = require("../config/database");

// Get all variants for a specific product
const getProductVariants = async (req, res) => {
  try {
    const { product_id } = req.params;

    const [variants] = await pool.query(
      `SELECT 
        variant_id,
        product_id,
        variant_name,
        variant_value,
        price_adjustment,
        image_url,
        stock_quantity,
        sku,
        is_active,
        created_at
      FROM product_variants
      WHERE product_id = ? AND is_active = 1
      ORDER BY variant_name, variant_value`,
      [product_id]
    );

    res.json(variants);
  } catch (error) {
    console.error("Error fetching product variants:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

// Create a new variant for a product (seller only)
const createVariant = async (req, res) => {
  try {
    const { product_id } = req.params;
    const {
      variant_name,
      variant_value,
      price_adjustment = 0,
      image_url,
      stock_quantity = 0,
      sku,
    } = req.body;

    // Verify product belongs to seller's store
    const userId = req.user?.user_id || req.user?.id;
    const userRole = req.user?.role;

    if (userRole !== "seller") {
      return res.status(403).json({ message: "Akses ditolak. Hanya seller yang dapat menambah varian." });
    }

    const [productCheck] = await pool.query(
      `SELECT p.product_id 
       FROM products p 
       JOIN stores s ON p.store_id = s.store_id 
       WHERE p.product_id = ? AND s.user_id = ?`,
      [product_id, userId]
    );

    if (productCheck.length === 0) {
      return res.status(404).json({ message: "Produk tidak ditemukan atau bukan milik Anda" });
    }

    // Validate required fields
    if (!variant_name || !variant_value) {
      return res.status(400).json({ message: "Nama varian dan nilai varian wajib diisi" });
    }

    const [result] = await pool.query(
      `INSERT INTO product_variants 
        (product_id, variant_name, variant_value, price_adjustment, image_url, stock_quantity, sku)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [product_id, variant_name, variant_value, price_adjustment, image_url, stock_quantity, sku]
    );

    res.status(201).json({
      message: "Varian berhasil ditambahkan",
      variant_id: result.insertId,
    });
  } catch (error) {
    console.error("Error creating product variant:", error);
    
    // Handle duplicate variant error
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Varian dengan nama dan nilai ini sudah ada" });
    }
    
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

// Update a variant (seller only)
const updateVariant = async (req, res) => {
  try {
    const { variant_id } = req.params;
    const {
      variant_name,
      variant_value,
      price_adjustment,
      image_url,
      stock_quantity,
      sku,
      is_active,
    } = req.body;

    // Verify variant belongs to seller's product
    const userId = req.user?.user_id || req.user?.id;
    const userRole = req.user?.role;

    if (userRole !== "seller") {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    const [variantCheck] = await pool.query(
      `SELECT pv.variant_id 
       FROM product_variants pv
       JOIN products p ON pv.product_id = p.product_id
       JOIN stores s ON p.store_id = s.store_id 
       WHERE pv.variant_id = ? AND s.user_id = ?`,
      [variant_id, userId]
    );

    if (variantCheck.length === 0) {
      return res.status(404).json({ message: "Varian tidak ditemukan" });
    }

    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];

    if (variant_name !== undefined) {
      updates.push("variant_name = ?");
      values.push(variant_name);
    }
    if (variant_value !== undefined) {
      updates.push("variant_value = ?");
      values.push(variant_value);
    }
    if (price_adjustment !== undefined) {
      updates.push("price_adjustment = ?");
      values.push(price_adjustment);
    }
    if (image_url !== undefined) {
      updates.push("image_url = ?");
      values.push(image_url);
    }
    if (stock_quantity !== undefined) {
      updates.push("stock_quantity = ?");
      values.push(stock_quantity);
    }
    if (sku !== undefined) {
      updates.push("sku = ?");
      values.push(sku);
    }
    if (is_active !== undefined) {
      updates.push("is_active = ?");
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "Tidak ada data yang diupdate" });
    }

    values.push(variant_id);

    await pool.query(
      `UPDATE product_variants SET ${updates.join(", ")} WHERE variant_id = ?`,
      values
    );

    res.json({ message: "Varian berhasil diupdate" });
  } catch (error) {
    console.error("Error updating product variant:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

// Delete a variant (seller only)
const deleteVariant = async (req, res) => {
  try {
    const { variant_id } = req.params;

    // Verify variant belongs to seller's product
    const userId = req.user?.user_id || req.user?.id;
    const userRole = req.user?.role;

    if (userRole !== "seller") {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    const [variantCheck] = await pool.query(
      `SELECT pv.variant_id 
       FROM product_variants pv
       JOIN products p ON pv.product_id = p.product_id
       JOIN stores s ON p.store_id = s.store_id 
       WHERE pv.variant_id = ? AND s.user_id = ?`,
      [variant_id, userId]
    );

    if (variantCheck.length === 0) {
      return res.status(404).json({ message: "Varian tidak ditemukan" });
    }

    // Soft delete by setting is_active to 0
    await pool.query(
      "UPDATE product_variants SET is_active = 0 WHERE variant_id = ?",
      [variant_id]
    );

    res.json({ message: "Varian berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting product variant:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

module.exports = {
  getProductVariants,
  createVariant,
  updateVariant,
  deleteVariant,
};
