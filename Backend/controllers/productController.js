// controllers/productController.js

const db = require("../config/database");
const slugify = require("../utils/slugify");
const { uploadBufferToCloudinary } = require("../utils/uploadToCloudinary");
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
    product_type,
    price,
    stock_quantity,
    sku,
    condition,
    brand,
    weight_gram,
    dimensions, // { length, width, height }
    is_preorder,
    use_store_courier,
    insurance, // 'wajib' | 'opsional'
    images, // [url]
    variants, // [{ name, options: [] }]
    skus, // [{ sku_code, price, stock_quantity, option_map, weight_gram, dimensions }]
    // Classified specific (optional depending on category)
    motor_specs,
    mobil_specs,
    property_specs,
  } = req.body;

  const store_id = req.user.store_id;
  if (!store_id) {
    return res.status(403).json({ message: "User does not have a store." });
  }
  if (!name || !category_id) {
    return res
      .status(400)
      .json({ message: "name dan category_id wajib diisi" });
  }

  const baseSlug = slugify(name, { lower: true, strict: true });

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

  // Helper: generate slug yang unik (untuk menghindari ER_DUP_ENTRY pada uk_products_slug)
  async function generateUniqueSlug(conn, baseSlug) {
    const [rows] = await conn.query(
      "SELECT slug FROM products WHERE slug = ? OR slug LIKE ?",
      [baseSlug, `${baseSlug}-%`]
    );

    if (!rows.length) return baseSlug;

    let maxSuffix = 0;
    for (const row of rows) {
      const current = row.slug;
      if (current === baseSlug) {
        // dasar sudah ada, minimal mulai dari -1
        if (maxSuffix < 1) maxSuffix = 1;
        continue;
      }

      if (current.startsWith(`${baseSlug}-`)) {
        const suffixStr = current.substring(baseSlug.length + 1);
        const suffixNum = parseInt(suffixStr, 10);
        if (!Number.isNaN(suffixNum) && suffixNum > maxSuffix) {
          maxSuffix = suffixNum;
        }
      }
    }

    const nextSuffix = maxSuffix + 1;
    return `${baseSlug}-${nextSuffix}`;
  }

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    // Pastikan slug unik di tabel products
    const slug = await generateUniqueSlug(conn, baseSlug);

    // Tentukan meta kategori dan validasi khusus
    const catMeta = await resolveCategoryMeta(conn, category_id);

    // Atur classification otomatis untuk kategori classified
    let effectiveClassification = product_type || "marketplace";
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
      if (stock_quantity == null) throw new Error("STOCK_REQUIRED");
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
                store_id, category_id, name, slug, description, product_type,
                price, stock_quantity, sku, \`condition\`, brand, weight_gram, 
                length_mm, width_mm, height_mm, is_preorder, preorder_days,
                min_order_quantity, max_order_quantity, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
        `;
    const [productResult] = await conn.query(insertProductSql, [
      store_id,
      category_id,
      name,
      slug,
      description || null,
      effectiveClassification, // product_type
      price || 0,
      stock_quantity || 0, // stock_quantity
      sku || null,
      condition || "new",
      brand || null,
      weight_gram || 0,
      dimensions ? dimensions.length || null : null, // length_mm
      dimensions ? dimensions.width || null : null, // width_mm
      dimensions ? dimensions.height || null : null, // height_mm
      is_preorder ? 1 : 0,
      is_preorder && preorder_days ? preorder_days : null,
      1, // min_order_quantity
      null, // max_order_quantity
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
          `INSERT INTO product_skus (product_id, sku_code, price, stock_quantity, weight_gram, dimensions) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            product_id,
            s.sku_code,
            s.price ?? price ?? 0,
            s.stock_quantity ?? 0,
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
      classification, // Renamed to product_type in query
      store_id,
      status = "active",
      min_price,
      max_price,
      condition,
      page = 1,
      limit = 20,
      sort = "created_at_desc",
    } = req.query;

    const where = ["p.deleted_at IS NULL"];
    const params = [];
    if (status) {
      where.push("p.status = ?");
      params.push(status);
    }
    if (category_id) {
      where.push("p.category_id = ?");
      params.push(category_id);
    }
    if (classification) {
      where.push("p.product_type = ?");
      params.push(classification);
    }
    if (store_id) {
      where.push("p.store_id = ?");
      params.push(store_id);
    }
    if (q) {
      where.push("(p.name LIKE ? OR p.slug LIKE ?)");
      params.push(`%${q}%`, `%${q}%`);
    }
    if (min_price) {
      where.push("p.price >= ?");
      params.push(min_price);
    }
    if (max_price) {
      where.push("p.price <= ?");
      params.push(max_price);
    }
    if (condition && ["new", "used"].includes(condition)) {
      where.push("p.`condition` = ?");
      params.push(condition);
    }

    let orderBy = "p.created_at DESC";
    if (sort === "price_asc") orderBy = "p.price ASC";
    else if (sort === "price_desc") orderBy = "p.price DESC";
    else if (sort === "created_at_asc") orderBy = "p.created_at ASC";

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const sql = `
            SELECT 
              p.*,
              s.store_id,
              s.name AS store_name,
              s.slug AS store_slug,
              s.city AS store_city,
              s.rating_average AS store_rating,
              s.review_count AS store_review_count,
              (SELECT url FROM product_images WHERE product_id = p.product_id ORDER BY sort_order ASC LIMIT 1) AS primary_image
            FROM products p
            JOIN stores s ON s.store_id = p.store_id
            ${whereSql}
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
            SELECT 
              p.*,
              s.store_id,
              s.name AS store_name,
              s.slug AS store_slug,
              s.city AS store_city,
              s.description AS store_description,
              s.rating_average AS store_rating,
              s.review_count AS store_review_count,
              s.profile_image_url AS store_profile_image_url,
              s.background_image_url AS store_background_image_url,
              (SELECT COUNT(*) FROM products p2 WHERE p2.store_id = s.store_id AND p2.deleted_at IS NULL AND p2.status = 'active') AS store_product_count,
              (SELECT url FROM product_images WHERE product_id = p.product_id ORDER BY sort_order ASC LIMIT 1) AS primary_image
            FROM products p
            JOIN stores s ON s.store_id = p.store_id
            WHERE p.product_id = ? OR p.slug = ?`;
    const [products] = await db.query(sql, [id, id]);

    if (products.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const product = products[0];

    // Ambil semua gambar produk untuk gallery thumbnail
    const [images] = await db.query(
      "SELECT image_id, url, alt_text, sort_order, is_primary FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, image_id ASC",
      [product.product_id]
    );

    product.images = images;

    res.status(200).json(product);
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
  const store_id = req.user.store_id;

  // Ambil field yang ingin diupdate dari body
  const { name, description, price, stock_quantity, status } = req.body;

  try {
    // PERHATIKAN: Query ini sangat aman.
    // User HANYA bisa update produk jika product_id cocok DAN store_id juga cocok.
    // Ini mencegah user A mengedit produk milik user B.
    const sql = `
            UPDATE products 
            SET name = ?, description = ?, price = ?, stock_quantity = ?, status = ? 
            WHERE product_id = ? AND store_id = ?
        `;
    const [result] = await db.query(sql, [
      name,
      description,
      price,
      stock_quantity,
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
/**
 * @desc    Daftar produk khusus seller (semua status, filter/urutan lengkap)
 * @route   GET /api/products/my
 * @access  Private (seller)
 */
const getMyProducts = async (req, res) => {
  const userId = req.user.user_id || req.user.id;
  try {
    const {
      status, // 'all' | 'active' | 'inactive' | 'classified' | 'draft'
      q,
      category_id,
      condition,
      stock_min,
      stock_max,
      price_min,
      price_max,
      sort = "created_at_desc",
      page = 1,
      limit = 20,
    } = req.query;

    console.log("\n=== getMyProducts Debug ===");
    console.log("User ID:", userId);
    console.log("User object:", req.user);
    console.log("Query params:", req.query);

    // Ambil store_id seller
    const [rows] = await db.query(
      "SELECT store_id FROM stores WHERE user_id = ? LIMIT 1",
      [userId]
    );
    console.log("Store query result:", rows);
    if (!rows.length) {
      console.log("ERROR: User does not have a store");
      return res.status(403).json({ message: "User does not have a store" });
    }
    const store_id = rows[0].store_id;
    console.log("Store ID from query:", store_id);
    console.log("Store ID from token:", req.user.store_id);

    const where = [`p.store_id = ?`];
    const params = [store_id];

    if (q) {
      where.push(`(p.name LIKE ? OR p.sku LIKE ?)`);
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm);
    }
    if (category_id) {
      where.push(`p.category_id = ?`);
      params.push(category_id);
    }
    if (condition && ["new", "used"].includes(condition)) {
      where.push(`p.\`condition\` = ?`);
      params.push(condition);
    }
    if (stock_min) {
      where.push(`p.stock_quantity >= ?`);
      params.push(stock_min);
    }
    if (stock_max) {
      where.push(`p.stock_quantity <= ?`);
      params.push(stock_max);
    }
    if (price_min) {
      where.push(`p.price >= ?`);
      params.push(price_min);
    }
    if (price_max) {
      where.push(`p.price <= ?`);
      params.push(price_max);
    }

    if (status !== "all") {
      if (status === "classified") {
        where.push(`p.product_type = 'classified'`);
      } else if (status === "draft") {
        where.push(`(p.status = 'draft' OR p.status IS NULL)`);
      } else if (["active", "inactive"].includes(status)) {
        where.push(`p.status = ?`);
        params.push(status);
      }
    }

    let orderBy = "p.created_at DESC";
    if (sort === "popular") orderBy = "p.review_count DESC";
    else if (sort === "price_asc") orderBy = "p.price ASC";
    else if (sort === "price_desc") orderBy = "p.price DESC";

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const now = new Date();

    // Query untuk count total (tanpa LIMIT)
    const countParams = [...params]; // Copy params untuk count
    const countSql = `
      SELECT COUNT(*) as total
      FROM products p
      WHERE ${where.join(" AND ")}
    `;
    const [countResult] = await db.query(countSql, countParams);
    const total = countResult[0].total;

    // Query untuk products dengan pagination
    // PENTING: Parameter untuk promotion check (now) harus di awal array
    const productParams = [now, ...params, parseInt(limit), offset];

    const sql = `
      SELECT p.*, 
      (SELECT url FROM product_images WHERE product_id = p.product_id ORDER BY sort_order ASC LIMIT 1) AS image_url,
      (SELECT name FROM categories WHERE category_id = p.category_id) AS category_name,
      CASE WHEN EXISTS (SELECT 1 FROM product_promotions pp WHERE pp.product_id = p.product_id AND pp.expires_at > ?) THEN 1 ELSE 0 END AS is_promoted
      FROM products p
      WHERE ${where.join(" AND ")}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    console.log("SQL Query:", sql);
    console.log("Product Params:", productParams);
    console.log("WHERE conditions:", where);

    const [products] = await db.query(sql, productParams);

    console.log("Total found:", total);
    console.log("Products count:", products.length);
    console.log("Products:", products);

    res.json({ products, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server Error" });
  }
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const store_id = req.user.store_id;

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
 * @desc    Tambah gambar produk (via multer upload + Cloudinary)
 * @route   POST /api/products/:id/images
 * @access  Private (pemilik store)
 */
const addProductImages = async (req, res) => {
  const { id } = req.params;
  const store_id = req.user.store_id;
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

    // Upload all files to Cloudinary from buffer
    const uploadPromises = req.files.map((file) =>
      uploadBufferToCloudinary(file.buffer, "products")
    );
    const uploadResults = await Promise.all(uploadPromises);

    // Simpan Cloudinary URL ke DB
    const values = uploadResults.map((result, idx) => [
      id,
      result.url,
      null,
      idx,
    ]);

    await db.query(
      "INSERT INTO product_images (product_id, url, alt_text, sort_order) VALUES ?",
      [values]
    );

    res.status(201).json({
      message: "Images uploaded to Cloudinary successfully",
      images: uploadResults,
    });
  } catch (error) {
    console.error("Error uploading product images:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
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
  const store_id = req.user.store_id;
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

/**
 * @desc    Bulk toggle status produk (massal)
 * @route   PATCH /api/products/bulk/status
 * @access  Private (seller)
 */
const bulkToggleStatus = async (req, res) => {
  const userId = req.user.user_id || req.user.id;
  const { product_ids, status } = req.body; // product_ids: [1,2,3], status: 'active'|'inactive'

  if (!Array.isArray(product_ids) || product_ids.length === 0) {
    return res
      .status(400)
      .json({ message: "product_ids harus array dan tidak kosong" });
  }
  if (!["active", "inactive"].includes(status)) {
    return res
      .status(400)
      .json({ message: "status harus active atau inactive" });
  }

  try {
    const [storeRows] = await db.query(
      "SELECT store_id FROM stores WHERE user_id = ? LIMIT 1",
      [userId]
    );
    if (!storeRows.length)
      return res.status(403).json({ message: "User does not have a store" });
    const store_id = storeRows[0].store_id;

    const placeholders = product_ids.map(() => "?").join(",");
    const sql = `UPDATE products SET status = ? WHERE product_id IN (${placeholders}) AND store_id = ?`;
    const [result] = await db.query(sql, [status, ...product_ids, store_id]);

    res.json({
      message: `${result.affectedRows} produk berhasil diupdate`,
      affected: result.affectedRows,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * @desc    Bulk delete produk (massal)
 * @route   DELETE /api/products/bulk
 * @access  Private (seller)
 */
const bulkDeleteProducts = async (req, res) => {
  const userId = req.user.user_id || req.user.id;
  const { product_ids } = req.body;

  if (!Array.isArray(product_ids) || product_ids.length === 0) {
    return res
      .status(400)
      .json({ message: "product_ids harus array dan tidak kosong" });
  }

  try {
    const [storeRows] = await db.query(
      "SELECT store_id FROM stores WHERE user_id = ? LIMIT 1",
      [userId]
    );
    if (!storeRows.length)
      return res.status(403).json({ message: "User does not have a store" });
    const store_id = storeRows[0].store_id;

    const placeholders = product_ids.map(() => "?").join(",");
    const sql = `DELETE FROM products WHERE product_id IN (${placeholders}) AND store_id = ?`;
    const [result] = await db.query(sql, [...product_ids, store_id]);

    res.json({
      message: `${result.affectedRows} produk berhasil dihapus`,
      affected: result.affectedRows,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * @desc    Iklankan produk (promote) - maksimal 2 produk aktif
 * @route   POST /api/products/:id/promote
 * @access  Private (seller)
 */
const promoteProduct = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.user_id || req.user.id;

  try {
    const [storeRows] = await db.query(
      "SELECT store_id FROM stores WHERE user_id = ? LIMIT 1",
      [userId]
    );
    if (!storeRows.length)
      return res.status(403).json({ message: "User does not have a store" });
    const store_id = storeRows[0].store_id;

    // Validasi produk milik seller
    const [productRows] = await db.query(
      "SELECT product_id FROM products WHERE product_id = ? AND store_id = ? LIMIT 1",
      [id, store_id]
    );
    if (!productRows.length)
      return res
        .status(404)
        .json({ message: "Product not found or not authorized" });

    // Cek jumlah promosi aktif (maksimal 2)
    const now = new Date();
    const [activePromos] = await db.query(
      "SELECT COUNT(*) as count FROM product_promotions WHERE store_id = ? AND expires_at > ?",
      [store_id, now]
    );
    if (activePromos[0].count >= 2) {
      return res.status(400).json({
        message: "Maksimal 2 produk dapat diiklankan dalam satu waktu",
      });
    }

    // Cek apakah produk ini sudah dipromote
    const [existing] = await db.query(
      "SELECT promotion_id FROM product_promotions WHERE product_id = ? AND expires_at > ? LIMIT 1",
      [id, now]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "Produk ini sedang diiklankan" });
    }

    // Tambahkan promosi (durasi 60 menit)
    const startedAt = now;
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 60 menit
    await db.query(
      "INSERT INTO product_promotions (product_id, store_id, started_at, expires_at) VALUES (?, ?, ?, ?)",
      [id, store_id, startedAt, expiresAt]
    );

    res.json({ message: "Produk berhasil diiklankan selama 60 menit" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * @desc    Duplikat produk (clone semua data termasuk images, variants, specs)
 * @route   POST /api/products/:id/duplicate
 * @access  Private (seller)
 */
const duplicateProduct = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.user_id || req.user.id;

  let conn;
  try {
    const [storeRows] = await db.query(
      "SELECT store_id FROM stores WHERE user_id = ? LIMIT 1",
      [userId]
    );
    if (!storeRows.length)
      return res.status(403).json({ message: "User does not have a store" });
    const store_id = storeRows[0].store_id;

    conn = await db.getConnection();
    await conn.beginTransaction();

    // Ambil data produk asli
    const [products] = await conn.query(
      "SELECT * FROM products WHERE product_id = ? AND store_id = ? LIMIT 1",
      [id, store_id]
    );
    if (!products.length) {
      await conn.rollback();
      conn.release();
      return res
        .status(404)
        .json({ message: "Product not found or not authorized" });
    }
    const original = products[0];

    // Buat produk baru dengan data yang sama (tapi status inactive)
    const slug = slugify(`${original.name} (copy)`, {
      lower: true,
      strict: true,
    });
    const [insertResult] = await conn.query(
      `INSERT INTO products (
        store_id, category_id, name, slug, description, product_type,
        price, stock_quantity, sku, \`condition\`, brand, weight_gram, dimensions,
        is_preorder, use_store_courier, insurance, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'inactive')`,
      [
        original.store_id,
        original.category_id,
        `${original.name} (copy)`,
        slug,
        original.description,
        original.product_type,
        original.price,
        original.stock_quantity,
        null, // SKU harus unique, jadi null
        original.condition,
        original.brand,
        original.weight_gram,
        original.dimensions,
        original.is_preorder,
        original.use_store_courier,
        original.insurance,
      ]
    );
    const newProductId = insertResult.insertId;

    // Duplikat images
    const [images] = await conn.query(
      "SELECT url, alt_text, sort_order FROM product_images WHERE product_id = ?",
      [id]
    );
    if (images.length > 0) {
      const imageValues = images.map((img) => [
        newProductId,
        img.url,
        img.alt_text,
        img.sort_order,
      ]);
      await conn.query(
        "INSERT INTO product_images (product_id, url, alt_text, sort_order) VALUES ?",
        [imageValues]
      );
    }

    // Duplikat variants & SKUs
    const [variants] = await conn.query(
      "SELECT * FROM product_variant_attributes WHERE product_id = ?",
      [id]
    );
    const attrMap = new Map();
    for (const v of variants) {
      const [attrRes] = await conn.query(
        "INSERT INTO product_variant_attributes (product_id, attribute_name, sort_order) VALUES (?, ?, ?)",
        [newProductId, v.attribute_name, v.sort_order]
      );
      const newAttrId = attrRes.insertId;
      attrMap.set(v.attribute_id, newAttrId);

      const [options] = await conn.query(
        "SELECT * FROM product_variant_attribute_options WHERE attribute_id = ?",
        [v.attribute_id]
      );
      for (const opt of options) {
        await conn.query(
          "INSERT INTO product_variant_attribute_options (attribute_id, option_value, sort_order) VALUES (?, ?, ?)",
          [newAttrId, opt.option_value, opt.sort_order]
        );
      }
    }

    // Duplikat SKUs (disederhanakan, karena mapping option_id perlu diupdate)
    const [skus] = await conn.query(
      "SELECT * FROM product_skus WHERE product_id = ?",
      [id]
    );
    for (const sku of skus) {
      const [skuRes] = await conn.query(
        "INSERT INTO product_skus (product_id, sku_code, price, stock_quantity, weight_gram, dimensions) VALUES (?, ?, ?, ?, ?, ?)",
        [
          newProductId,
          null,
          sku.price,
          sku.stock_quantity,
          sku.weight_gram,
          sku.dimensions,
        ]
      );
    }

    // Duplikat classified specs
    const [motorSpecs] = await conn.query(
      "SELECT * FROM vehicle_motor_specs WHERE product_id = ?",
      [id]
    );
    if (motorSpecs.length) {
      const m = motorSpecs[0];
      await conn.query(
        "INSERT INTO vehicle_motor_specs (product_id, brand, year, model, transmission, mileage_km, engine_cc, color, fuel, tax_expiry_date, completeness_text, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          newProductId,
          m.brand,
          m.year,
          m.model,
          m.transmission,
          m.mileage_km,
          m.engine_cc,
          m.color,
          m.fuel,
          m.tax_expiry_date,
          m.completeness_text,
          m.latitude,
          m.longitude,
        ]
      );
    }

    const [mobilSpecs] = await conn.query(
      "SELECT * FROM vehicle_mobil_specs WHERE product_id = ?",
      [id]
    );
    if (mobilSpecs.length) {
      const c = mobilSpecs[0];
      await conn.query(
        "INSERT INTO vehicle_mobil_specs (product_id, brand, model, year, transmission, mileage_km, license_plate, color, fuel, engine_cc, seat_count, tax_expiry_date, completeness_text, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          newProductId,
          c.brand,
          c.model,
          c.year,
          c.transmission,
          c.mileage_km,
          c.license_plate,
          c.color,
          c.fuel,
          c.engine_cc,
          c.seat_count,
          c.tax_expiry_date,
          c.completeness_text,
          c.latitude,
          c.longitude,
        ]
      );
    }

    const [propertySpecs] = await conn.query(
      "SELECT * FROM property_specs WHERE product_id = ?",
      [id]
    );
    if (propertySpecs.length) {
      const p = propertySpecs[0];
      await conn.query(
        "INSERT INTO property_specs (product_id, transaction_type, price, building_area_m2, land_area_m2, bedrooms, bathrooms, floors, certificate_text, facilities_text, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          newProductId,
          p.transaction_type,
          p.price,
          p.building_area_m2,
          p.land_area_m2,
          p.bedrooms,
          p.bathrooms,
          p.floors,
          p.certificate_text,
          p.facilities_text,
          p.latitude,
          p.longitude,
        ]
      );
    }

    await conn.commit();
    conn.release();
    res
      .status(201)
      .json({ message: "Produk berhasil diduplikat", productId: newProductId });
  } catch (e) {
    if (conn) {
      await conn.rollback();
      conn.release();
    }
    console.error(e);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * @desc    Batalkan iklan produk (cancel promotion)
 * @route   DELETE /api/products/:id/promote
 * @access  Private (seller)
 */
const cancelPromoteProduct = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.user_id || req.user.id;

  try {
    const [storeRows] = await db.query(
      "SELECT store_id FROM stores WHERE user_id = ? LIMIT 1",
      [userId]
    );
    if (!storeRows.length)
      return res.status(403).json({ message: "User does not have a store" });
    const store_id = storeRows[0].store_id;

    const [result] = await db.query(
      "DELETE FROM product_promotions WHERE product_id = ? AND store_id = ?",
      [id, store_id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Promosi produk tidak ditemukan" });
    }

    res.json({ message: "Iklan produk dibatalkan" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * @desc    Update cepat harga dan stock_quantity per produk
 * @route   PATCH /api/products/:id/quick-update
 * @access  Private (seller)
 */
const quickUpdateProduct = async (req, res) => {
  const { id } = req.params;
  const { price, stock_quantity } = req.body;
  const userId = req.user.user_id || req.user.id;

  try {
    const [storeRows] = await db.query(
      "SELECT store_id FROM stores WHERE user_id = ? LIMIT 1",
      [userId]
    );
    if (!storeRows.length)
      return res.status(403).json({ message: "User does not have a store" });
    const store_id = storeRows[0].store_id;

    const updates = [];
    const values = [];
    if (price !== undefined) {
      updates.push("price = ?");
      values.push(price);
    }
    if (stock_quantity !== undefined) {
      updates.push("stock_quantity = ?");
      values.push(stock_quantity);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        message:
          "Minimal salah satu field (price atau stock_quantity) harus diisi",
      });
    }

    values.push(id, store_id);
    const sql = `UPDATE products SET ${updates.join(
      ", "
    )} WHERE product_id = ? AND store_id = ?`;
    const [result] = await db.query(sql, values);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Product not found or user not authorized" });
    }

    res.json({ message: "Produk berhasil diupdate" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server Error" });
  }
};

// Export semua fungsi agar bisa digunakan di file routes
module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  getMyProducts,
  updateProduct,
  quickUpdateProduct,
  deleteProduct,
  duplicateProduct,
  setProductStatus,
  bulkToggleStatus,
  bulkDeleteProducts,
  promoteProduct,
  cancelPromoteProduct,
  addProductImages,
};
