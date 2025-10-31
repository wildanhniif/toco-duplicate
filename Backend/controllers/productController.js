// controllers/productController.js

const db = require("../config/database");
const slugify = require("../utils/slugify");
/**
 * @desc    Membuat produk baru
 * @route   POST /api/products
 * @access  Private (butuh login sebagai pemilik toko)
 */
const createProduct = async (req, res) => {
  const {
    name,
    category_id,
    description,
    product_classification,
    price,
    stock,
    sku,
    condition,
    brand,
    weight_gram,
    dimensions, // { length, width, height }
    is_preorder,
    preorder_lead_time_days, // opsional
    use_store_courier,
    insurance, // 'wajib' | 'opsional'
    images, // [url]
    variants, // [{ name, options: [] }]
    skus, // [{ sku_code, price, stock, option_map, weight_gram, dimensions }]
    // Classified specific (optional depending on category)
    motor_specs,
    mobil_specs,
    property_specs,
  } = req.body;

  const store_id = req.user.store_id || req.user.store_Id; // toleransi nama field
  if (!store_id) {
    return res.status(403).json({ message: "User does not have a store." });
  }
  if (!name || !category_id) {
    return res
      .status(400)
      .json({ message: "name dan category_id wajib diisi" });
  }

  const slug = slugify(name, { lower: true, strict: true });

  // Helper: tentukan tipe form berdasar kategori
  async function resolveCategoryMeta(conn, categoryId) {
    const [rows] = await conn.query(
      "SELECT category_id, name, slug FROM categories WHERE category_id = ?",
      [categoryId]
    );
    if (rows.length === 0) return { type: "marketplace" };
    const cat = rows[0];
    const slugStr = (cat.slug || cat.name || "").toLowerCase();
    if (/(motor|sepeda-motor|motorcycle)/.test(slugStr))
      return { type: "motor" };
    if (/(mobil|car|otomobil)/.test(slugStr)) return { type: "mobil" };
    if (
      /(properti|property|rumah|kost|kontrakan|apartemen|apartment)/.test(
        slugStr
      )
    )
      return { type: "property" };
    return { type: "marketplace" };
  }

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    // Tentukan meta kategori dan validasi khusus
    const catMeta = await resolveCategoryMeta(conn, category_id);

    // Atur classification otomatis untuk kategori classified
    let effectiveClassification = product_classification || "marketplace";
    if (
      catMeta.type === "motor" ||
      catMeta.type === "mobil" ||
      catMeta.type === "property"
    ) {
      effectiveClassification = "classified";
    }

    // Validasi wajib per tipe
    if (effectiveClassification === "marketplace") {
      if (price == null) throw new Error("PRICE_REQUIRED");
      if (stock == null) throw new Error("STOCK_REQUIRED");
      if (weight_gram == null) throw new Error("WEIGHT_REQUIRED");
    }
    if (catMeta.type === "motor") {
      const m = motor_specs || {};
      const required = ["brand", "year", "model", "transmission"];
      for (const key of required) {
        if (!m[key]) throw new Error(`MOTOR_${key.toUpperCase()}_REQUIRED`);
      }
      if (!m.location || m.location.lat == null || m.location.lng == null)
        throw new Error("MOTOR_LOCATION_REQUIRED");
    }
    if (catMeta.type === "mobil") {
      const c = mobil_specs || {};
      const required = ["brand", "model", "year", "transmission"];
      for (const key of required) {
        if (!c[key]) throw new Error(`MOBIL_${key.toUpperCase()}_REQUIRED`);
      }
      if (!c.location || c.location.lat == null || c.location.lng == null)
        throw new Error("MOBIL_LOCATION_REQUIRED");
    }
    if (catMeta.type === "property") {
      const p = property_specs || {};
      const required = ["transaction_type", "price"];
      for (const key of required) {
        if (!p[key]) throw new Error(`PROPERTY_${key.toUpperCase()}_REQUIRED`);
      }
      if (!p.location || p.location.lat == null || p.location.lng == null)
        throw new Error("PROPERTY_LOCATION_REQUIRED");
    }

    // Insert products
    const insertProductSql = `
            INSERT INTO products (
                store_id, category_id, name, slug, description, product_classification,
                price, stock, sku, \`condition\`, brand, weight_gram, dimensions,
                is_preorder, use_store_courier, insurance, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'inactive')
        `;
    const [productResult] = await conn.query(insertProductSql, [
      store_id,
      category_id,
      name,
      slug,
      description || null,
      effectiveClassification,
      price || 0,
      stock || 0,
      sku || null,
      condition || "new",
      brand || null,
      weight_gram || 0,
      dimensions ? JSON.stringify(dimensions) : null,
      is_preorder ? 1 : 0,
      use_store_courier ? 1 : 0,
      insurance || "opsional",
    ]);
    const product_id = productResult.insertId;

    // Images
    if (Array.isArray(images) && images.length > 0) {
      const insertImageSql = `INSERT INTO product_images (product_id, url, alt_text, sort_order) VALUES ?`;
      const values = images.map((url, idx) => [product_id, url, null, idx]);
      await conn.query(insertImageSql, [values]);
    }

    // Variants/SKUs
    const attributeIdByName = new Map();
    const optionIdByAttrAndValue = new Map();
    if (Array.isArray(variants) && variants.length > 0) {
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const [attrRes] = await conn.query(
          `INSERT INTO product_variant_attributes (product_id, attribute_name, sort_order) VALUES (?, ?, ?)`,
          [product_id, v.name, i]
        );
        const attribute_id = attrRes.insertId;
        attributeIdByName.set(v.name, attribute_id);
        if (Array.isArray(v.options)) {
          for (let j = 0; j < v.options.length; j++) {
            const opt = v.options[j];
            const [optRes] = await conn.query(
              `INSERT INTO product_variant_attribute_options (attribute_id, option_value, sort_order) VALUES (?, ?, ?)`,
              [attribute_id, opt, j]
            );
            optionIdByAttrAndValue.set(
              `${attribute_id}::${opt}`,
              optRes.insertId
            );
          }
        }
      }
    }

    if (Array.isArray(skus) && skus.length > 0) {
      for (const s of skus) {
        const [skuRes] = await conn.query(
          `INSERT INTO product_skus (product_id, sku_code, price, stock, weight_gram, dimensions) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            product_id,
            s.sku_code,
            s.price ?? price ?? 0,
            s.stock ?? 0,
            s.weight_gram ?? weight_gram ?? null,
            s.dimensions ? JSON.stringify(s.dimensions) : null,
          ]
        );
        const product_sku_id = skuRes.insertId;
        if (s.option_map && variants) {
          // Map each variant name -> option value to option_id
          for (const [attrName, optionValue] of Object.entries(s.option_map)) {
            const attrId = attributeIdByName.get(attrName);
            if (!attrId) continue;
            const optionId = optionIdByAttrAndValue.get(
              `${attrId}::${optionValue}`
            );
            if (!optionId) continue;
            await conn.query(
              `INSERT INTO product_sku_options (product_sku_id, option_id) VALUES (?, ?)`,
              [product_sku_id, optionId]
            );
          }
        }
      }
    }

    // Classified specs by provided payload
    if (motor_specs) {
      const m = motor_specs;
      await conn.query(
        `INSERT INTO vehicle_motor_specs (product_id, brand, year, model, transmission, mileage_km, engine_cc, color, fuel, tax_expiry_date, completeness_text, latitude, longitude)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product_id,
          m.brand,
          m.year,
          m.model,
          m.transmission,
          m.mileage_km ?? null,
          m.engine_cc ?? null,
          m.color ?? null,
          m.fuel ?? null,
          m.tax_expiry_date ?? null,
          m.completeness_text ?? null,
          m.location?.lat ?? null,
          m.location?.lng ?? null,
        ]
      );
    }
    if (mobil_specs) {
      const c = mobil_specs;
      await conn.query(
        `INSERT INTO vehicle_mobil_specs (product_id, brand, model, year, transmission, mileage_km, license_plate, color, fuel, engine_cc, seat_count, tax_expiry_date, completeness_text, latitude, longitude)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product_id,
          c.brand,
          c.model,
          c.year,
          c.transmission,
          c.mileage_km ?? null,
          c.license_plate ?? null,
          c.color ?? null,
          c.fuel ?? null,
          c.engine_cc ?? null,
          c.seat_count ?? null,
          c.tax_expiry_date ?? null,
          c.completeness_text ?? null,
          c.location?.lat ?? null,
          c.location?.lng ?? null,
        ]
      );
    }
    if (property_specs) {
      const p = property_specs;
      await conn.query(
        `INSERT INTO property_specs (product_id, transaction_type, price, building_area_m2, land_area_m2, bedrooms, bathrooms, floors, certificate_text, facilities_text, latitude, longitude)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product_id,
          p.transaction_type,
          p.price,
          p.building_area_m2 ?? null,
          p.land_area_m2 ?? null,
          p.bedrooms ?? null,
          p.bathrooms ?? null,
          p.floors ?? null,
          p.certificate_text ?? null,
          p.facilities_text ?? null,
          p.location?.lat ?? null,
          p.location?.lng ?? null,
        ]
      );
    }

    await conn.commit();
    res.status(201).json({
      message: "Product created successfully!",
      productId: product_id,
      slug,
    });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error(error);
    // Mapping error validation ke 400
    if (typeof error.message === "string" && /_REQUIRED$/.test(error.message)) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server Error" });
  } finally {
    if (conn) conn.release();
  }
};

/**
 * @desc    Mengambil semua produk (public)
 * @route   GET /api/products
 * @access  Public
 */
const getAllProducts = async (req, res) => {
  try {
    const {
      q,
      category_id,
      classification,
      store_id,
      status = "active",
      min_price,
      max_price,
      page = 1,
      limit = 20,
      sort = "created_at_desc",
    } = req.query;

    const where = [];
    const params = [];
    if (status) {
      where.push("status = ?");
      params.push(status);
    }
    if (category_id) {
      where.push("category_id = ?");
      params.push(category_id);
    }
    if (classification) {
      where.push("product_classification = ?");
      params.push(classification);
    }
    if (store_id) {
      where.push("store_id = ?");
      params.push(store_id);
    }
    if (q) {
      where.push("(name LIKE ? OR slug LIKE ?)");
      params.push(`%${q}%`, `%${q}%`);
    }
    if (min_price) {
      where.push("price >= ?");
      params.push(min_price);
    }
    if (max_price) {
      where.push("price <= ?");
      params.push(max_price);
    }

    let orderBy = "created_at DESC";
    if (sort === "price_asc") orderBy = "price ASC";
    else if (sort === "price_desc") orderBy = "price DESC";
    else if (sort === "created_at_asc") orderBy = "created_at ASC";

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const sql = `
            SELECT p.*,
                   (SELECT url FROM product_images WHERE product_id = p.product_id ORDER BY sort_order ASC LIMIT 1) AS primary_image
            FROM products p
            ${whereSql
              .replaceAll("status", "p.status")
              .replaceAll("category_id", "p.category_id")
              .replaceAll("product_classification", "p.product_classification")
              .replaceAll("store_id", "p.store_id")
              .replaceAll("name", "p.name")
              .replaceAll("slug", "p.slug")}
            ORDER BY ${orderBy}
            LIMIT ? OFFSET ?`;
    const [products] = await db.query(sql, [
      ...params,
      parseInt(limit),
      offset,
    ]);
    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * @desc    Mengambil satu produk berdasarkan ID atau Slug
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
            SELECT p.*,
                   (SELECT url FROM product_images WHERE product_id = p.product_id ORDER BY sort_order ASC LIMIT 1) AS primary_image
            FROM products p
            WHERE p.product_id = ? OR p.slug = ?`;
    const [products] = await db.query(sql, [id, id]);

    if (products.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(products[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * @desc    Mengupdate produk
 * @route   PUT /api/products/:id
 * @access  Private
 */
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const store_id = req.user.store_id || req.user.store_Id;

  // Ambil field yang ingin diupdate dari body
  const { name, description, price, stock, status } = req.body;

  try {
    // PERHATIKAN: Query ini sangat aman.
    // User HANYA bisa update produk jika product_id cocok DAN store_id juga cocok.
    // Ini mencegah user A mengedit produk milik user B.
    const sql = `
            UPDATE products 
            SET name = ?, description = ?, price = ?, stock = ?, status = ? 
            WHERE product_id = ? AND store_id = ?
        `;
    const [result] = await db.query(sql, [
      name,
      description,
      price,
      stock,
      status,
      id,
      store_id,
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Product not found or user not authorized." });
    }

    res.status(200).json({ message: "Product updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * @desc    Menghapus produk
 * @route   DELETE /api/products/:id
 * @access  Private
 */
const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const store_id = req.user.store_id || req.user.store_Id;

  try {
    // Logika keamanan yang sama seperti update diterapkan di sini.
    const sql = "DELETE FROM products WHERE product_id = ? AND store_id = ?";
    const [result] = await db.query(sql, [id, store_id]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Product not found or user not authorized." });
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * @desc    Tambah gambar produk (via multer upload)
 * @route   POST /api/products/:id/images
 * @access  Private (pemilik store)
 */
const addProductImages = async (req, res) => {
  const { id } = req.params;
  const store_id = req.user.store_id || req.user.store_Id;
  try {
    // Pastikan produk milik store pemanggil
    const [rows] = await db.query(
      "SELECT product_id FROM products WHERE product_id = ? AND store_id = ?",
      [id, store_id]
    );
    if (rows.length === 0)
      return res
        .status(404)
        .json({ message: "Product not found or user not authorized." });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }
    // Simpan path file ke DB
    const values = req.files.map((f, idx) => [
      id,
      `/uploads/products/${f.filename}`,
      null,
      idx,
    ]);
    await db.query(
      "INSERT INTO product_images (product_id, url, alt_text, sort_order) VALUES ?",
      [values]
    );
    res.status(201).json({ message: "Images uploaded" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * @desc    Toggle/Set status produk (active/inactive)
 * @route   PUT /api/products/:id/status
 * @access  Private (pemilik store)
 */
const setProductStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'active' | 'inactive'
  const store_id = req.user.store_id || req.user.store_Id;
  if (!["active", "inactive"].includes(status)) {
    return res
      .status(400)
      .json({ message: "status harus active atau inactive" });
  }
  try {
    const sql = `UPDATE products SET status = ? WHERE product_id = ? AND store_id = ?`;
    const [result] = await db.query(sql, [status, id, store_id]);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Product not found or user not authorized." });
    }
    res.status(200).json({ message: "Status updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Export semua fungsi agar bisa digunakan di file routes
module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  setProductStatus,
  addProductImages,
};
