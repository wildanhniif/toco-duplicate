// controllers/voucherController.js
const db = require("../config/database");

/**
 * @desc    Get all vouchers for seller's store with filters
 * @route   GET /api/seller/vouchers
 * @access  Private (Seller)
 */
exports.getVouchers = async (req, res) => {
  try {
    const storeId = req.user.store_id;
    const {
      status, // upcoming, active, ended, all
      search, // search by title
      period, // today, yesterday, last7days, last30days, thismonth, custom
      start_date,
      end_date,
      sort, // newest, oldest, quota_desc, quota_asc, a_z, z_a
      type, // discount, free_shipping
      target, // public, private
      page = 1,
      limit = 20,
    } = req.query;

    let whereConditions = ["v.store_id = ?", "v.deleted_at IS NULL"];
    let params = [storeId];

    // Filter by status
    if (status && status !== "all") {
      whereConditions.push("v.status = ?");
      params.push(status);
    }

    // Search by title
    if (search) {
      whereConditions.push("v.title LIKE ?");
      params.push(`%${search}%`);
    }

    // Filter by period
    if (period) {
      const now = new Date();
      let periodStart, periodEnd;

      switch (period) {
        case "today":
          periodStart = new Date(now.setHours(0, 0, 0, 0));
          periodEnd = new Date(now.setHours(23, 59, 59, 999));
          break;
        case "yesterday":
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          periodStart = new Date(yesterday.setHours(0, 0, 0, 0));
          periodEnd = new Date(yesterday.setHours(23, 59, 59, 999));
          break;
        case "last7days":
          periodStart = new Date(now.setDate(now.getDate() - 7));
          periodEnd = new Date();
          break;
        case "last30days":
          periodStart = new Date(now.setDate(now.getDate() - 30));
          periodEnd = new Date();
          break;
        case "thismonth":
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          periodEnd = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23,
            59,
            59
          );
          break;
        case "custom":
          if (start_date && end_date) {
            periodStart = new Date(start_date);
            periodEnd = new Date(end_date);
          }
          break;
      }

      if (periodStart && periodEnd) {
        whereConditions.push(
          "(v.start_date BETWEEN ? AND ? OR v.end_date BETWEEN ? AND ?)"
        );
        params.push(periodStart, periodEnd, periodStart, periodEnd);
      }
    }

    // Filter by voucher type
    if (type) {
      whereConditions.push("v.voucher_type = ?");
      params.push(type);
    }

    // Filter by target type
    if (target) {
      whereConditions.push("v.target_type = ?");
      params.push(target);
    }

    // Build ORDER BY
    let orderBy = "v.created_at DESC"; // default
    switch (sort) {
      case "newest":
        orderBy = "v.created_at DESC";
        break;
      case "oldest":
        orderBy = "v.created_at ASC";
        break;
      case "quota_desc":
        orderBy = "v.quota DESC";
        break;
      case "quota_asc":
        orderBy = "v.quota ASC";
        break;
      case "a_z":
        orderBy = "v.title ASC";
        break;
      case "z_a":
        orderBy = "v.title DESC";
        break;
    }

    // Pagination
    const offset = (page - 1) * limit;

    // Count total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM vouchers v
      WHERE ${whereConditions.join(" AND ")}
    `;
    const [[{ total }]] = await db.query(countQuery, params);

    // Get vouchers with product count
    const query = `
      SELECT 
        v.*,
        COALESCE(v.title, v.name) as title,
        v.code as voucher_code,
        v.type as discount_type,
        v.started_at as start_date,
        v.expired_at as end_date,
        COALESCE(v.quota, v.usage_limit) as quota,
        COALESCE(v.quota_used, v.usage_count) as quota_used,
        (COALESCE(v.quota, v.usage_limit) - COALESCE(v.quota_used, v.usage_count)) as remaining_quota,
        COALESCE(v.limit_per_user, v.user_usage_limit) as limit_per_user,
        CASE 
          WHEN NOW() < v.started_at THEN 'upcoming'
          WHEN NOW() BETWEEN v.started_at AND v.expired_at THEN 'active'
          WHEN NOW() > v.expired_at THEN 'ended'
        END as current_status,
        COUNT(DISTINCT vp.product_id) as product_count,
        (SELECT COUNT(*) FROM voucher_usage WHERE voucher_id = v.voucher_id) as usage_count
      FROM vouchers v
      LEFT JOIN voucher_products vp ON v.voucher_id = vp.voucher_id
      WHERE ${whereConditions.join(" AND ")}
      GROUP BY v.voucher_id
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const [vouchers] = await db.query(query, [
      ...params,
      parseInt(limit),
      offset,
    ]);

    res.json({
      success: true,
      data: vouchers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error getting vouchers:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc    Get single voucher details
 * @route   GET /api/seller/vouchers/:id
 * @access  Private (Seller)
 */
exports.getVoucherById = async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.user.store_id;

    const query = `
      SELECT 
        v.*,
        COALESCE(v.title, v.name) as title,
        v.code as voucher_code,
        v.type as discount_type,
        v.started_at as start_date,
        v.expired_at as end_date,
        COALESCE(v.quota, v.usage_limit) as quota,
        COALESCE(v.quota_used, v.usage_count) as quota_used,
        (COALESCE(v.quota, v.usage_limit) - COALESCE(v.quota_used, v.usage_count)) as remaining_quota,
        COALESCE(v.limit_per_user, v.user_usage_limit) as limit_per_user
      FROM vouchers v
      WHERE v.voucher_id = ? AND v.store_id = ? AND (v.deleted_at IS NULL OR v.deleted_at > NOW())
    `;

    const [vouchers] = await db.query(query, [id, storeId]);

    if (vouchers.length === 0) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    const voucher = vouchers[0];

    // Get related products if applicable
    if (voucher.apply_to === "specific_products") {
      const [products] = await db.query(
        `SELECT vp.product_id, p.name, p.price, pi.url as image_url
         FROM voucher_products vp
         JOIN products p ON vp.product_id = p.product_id
         LEFT JOIN (
           SELECT product_id, url 
           FROM product_images 
           WHERE sort_order = 0 
           GROUP BY product_id
         ) pi ON p.product_id = pi.product_id
         WHERE vp.voucher_id = ?`,
        [id]
      );
      voucher.products = products;
    }

    res.json({
      success: true,
      data: voucher,
    });
  } catch (error) {
    console.error("Error getting voucher:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc    Create new voucher
 * @route   POST /api/seller/vouchers
 * @access  Private (Seller)
 */
exports.createVoucher = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const storeId = req.user.store_id;
    const {
      voucher_type,
      target_type,
      voucher_code,
      title,
      description,
      start_date,
      end_date,
      quota,
      limit_per_user,
      apply_to,
      product_ids, // array of product IDs
      discount_type,
      discount_value,
      max_discount,
      min_transaction,
    } = req.body;

    // Validation
    if (!title || !start_date || !end_date || !quota || !discount_value) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (new Date(start_date) >= new Date(end_date)) {
      return res
        .status(400)
        .json({ message: "End date must be after start date" });
    }

    if (target_type === "private" && !voucher_code) {
      return res
        .status(400)
        .json({ message: "Voucher code required for private vouchers" });
    }

    await connection.beginTransaction();

    // Calculate estimated cost
    let estimated_cost = quota * discount_value;
    if (discount_type === "percentage") {
      // For percentage, use max_discount if provided
      estimated_cost = max_discount ? quota * max_discount : null;
    }

    // Determine initial status
    const now = new Date();
    const startDateTime = new Date(start_date);
    let status = "upcoming";
    if (startDateTime <= now) {
      status = "active";
    }

    // Insert voucher (support both old and new column names)
    const insertQuery = `
      INSERT INTO vouchers (
        store_id, voucher_type, target_type, code, name, title, description,
        started_at, expired_at, usage_limit, quota, user_usage_limit, limit_per_user, apply_to,
        type, value, max_discount_amount, min_purchase_amount,
        estimated_cost, status, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.query(insertQuery, [
      storeId,
      voucher_type,
      target_type,
      voucher_code || null, // code (old column)
      title, // name (old column)
      title, // title (new column)
      description || null,
      start_date, // started_at (old column)
      end_date, // expired_at (old column)
      quota, // usage_limit (old column)
      quota, // quota (new column)
      limit_per_user || null, // user_usage_limit (old column)
      limit_per_user || null, // limit_per_user (new column)
      apply_to,
      discount_type, // type (old column)
      discount_value, // value (old column)
      max_discount || null, // max_discount_amount (old column)
      min_transaction || 0, // min_purchase_amount (old column)
      estimated_cost,
      status,
      true, // is_active
    ]);

    const voucherId = result.insertId;

    // Insert voucher products if specific products selected
    if (
      apply_to === "specific_products" &&
      product_ids &&
      product_ids.length > 0
    ) {
      const productValues = product_ids.map((productId) => [
        voucherId,
        productId,
      ]);
      await connection.query(
        "INSERT INTO voucher_products (voucher_id, product_id) VALUES ?",
        [productValues]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Voucher created successfully",
      voucher_id: voucherId,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error creating voucher:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  } finally {
    connection.release();
  }
};

/**
 * @desc    Update voucher
 * @route   PUT /api/seller/vouchers/:id
 * @access  Private (Seller)
 */
exports.updateVoucher = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;
    const storeId = req.user.store_id;
    const {
      voucher_type,
      target_type,
      voucher_code,
      title,
      description,
      start_date,
      end_date,
      quota,
      limit_per_user,
      apply_to,
      product_ids,
      discount_type,
      discount_value,
      max_discount,
      min_transaction,
    } = req.body;

    // Check if voucher exists and belongs to store
    const [existing] = await connection.query(
      "SELECT * FROM vouchers WHERE voucher_id = ? AND store_id = ? AND deleted_at IS NULL",
      [id, storeId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    // Validation
    if (new Date(start_date) >= new Date(end_date)) {
      return res
        .status(400)
        .json({ message: "End date must be after start date" });
    }

    await connection.beginTransaction();

    // Calculate estimated cost
    let estimated_cost = quota * discount_value;
    if (discount_type === "percentage") {
      estimated_cost = max_discount ? quota * max_discount : null;
    }

    // Update voucher (support both old and new columns)
    const updateQuery = `
      UPDATE vouchers SET
        voucher_type = ?, 
        target_type = ?, 
        code = ?, 
        name = ?, 
        title = ?, 
        description = ?,
        started_at = ?, 
        expired_at = ?, 
        usage_limit = ?,
        quota = ?, 
        user_usage_limit = ?,
        limit_per_user = ?, 
        apply_to = ?,
        type = ?, 
        value = ?, 
        max_discount_amount = ?, 
        min_purchase_amount = ?,
        estimated_cost = ?, 
        updated_at = NOW()
      WHERE voucher_id = ? AND store_id = ?
    `;

    await connection.query(updateQuery, [
      voucher_type,
      target_type,
      voucher_code || null, // code
      title, // name
      title, // title
      description || null,
      start_date, // started_at
      end_date, // expired_at
      quota, // usage_limit
      quota, // quota
      limit_per_user || null, // user_usage_limit
      limit_per_user || null, // limit_per_user
      apply_to,
      discount_type, // type
      discount_value, // value
      max_discount || null, // max_discount_amount
      min_transaction || 0, // min_purchase_amount
      estimated_cost,
      id,
      storeId,
    ]);

    // Update voucher products
    if (apply_to === "specific_products" && product_ids) {
      // Delete old product associations
      await connection.query(
        "DELETE FROM voucher_products WHERE voucher_id = ?",
        [id]
      );

      // Insert new associations
      if (product_ids.length > 0) {
        const productValues = product_ids.map((productId) => [id, productId]);
        await connection.query(
          "INSERT INTO voucher_products (voucher_id, product_id) VALUES ?",
          [productValues]
        );
      }
    } else if (apply_to === "all_products") {
      // Remove all product associations
      await connection.query(
        "DELETE FROM voucher_products WHERE voucher_id = ?",
        [id]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: "Voucher updated successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating voucher:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  } finally {
    connection.release();
  }
};

/**
 * @desc    Duplicate voucher
 * @route   POST /api/seller/vouchers/:id/duplicate
 * @access  Private (Seller)
 */
exports.duplicateVoucher = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;
    const storeId = req.user.store_id;

    // Get original voucher
    const [vouchers] = await connection.query(
      "SELECT * FROM vouchers WHERE voucher_id = ? AND store_id = ? AND deleted_at IS NULL",
      [id, storeId]
    );

    if (vouchers.length === 0) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    const original = vouchers[0];

    await connection.beginTransaction();

    // Create duplicate with modified title
    const insertQuery = `
      INSERT INTO vouchers (
        store_id, voucher_type, target_type, title, description,
        start_date, end_date, quota, limit_per_user, apply_to,
        discount_type, discount_value, max_discount, min_transaction,
        estimated_cost, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.query(insertQuery, [
      storeId,
      original.voucher_type,
      original.target_type,
      `${original.title} (Copy)`,
      original.description,
      original.start_date,
      original.end_date,
      original.quota,
      original.limit_per_user,
      original.apply_to,
      original.discount_type,
      original.discount_value,
      original.max_discount,
      original.min_transaction,
      original.estimated_cost,
      "upcoming",
    ]);

    const newVoucherId = result.insertId;

    // Copy product associations if applicable
    if (original.apply_to === "specific_products") {
      await connection.query(
        `INSERT INTO voucher_products (voucher_id, product_id)
         SELECT ?, product_id FROM voucher_products WHERE voucher_id = ?`,
        [newVoucherId, id]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Voucher duplicated successfully",
      voucher_id: newVoucherId,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error duplicating voucher:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  } finally {
    connection.release();
  }
};

/**
 * @desc    End voucher (set status to ended)
 * @route   PUT /api/seller/vouchers/:id/end
 * @access  Private (Seller)
 */
exports.endVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.user.store_id;

    const [result] = await db.query(
      `UPDATE vouchers SET status = 'ended', is_active = FALSE, updated_at = NOW()
       WHERE voucher_id = ? AND store_id = ? AND deleted_at IS NULL`,
      [id, storeId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    res.json({
      success: true,
      message: "Voucher ended successfully",
    });
  } catch (error) {
    console.error("Error ending voucher:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc    Delete voucher (soft delete)
 * @route   DELETE /api/seller/vouchers/:id
 * @access  Private (Seller)
 */
exports.deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.user.store_id;

    const [result] = await db.query(
      "UPDATE vouchers SET deleted_at = NOW() WHERE voucher_id = ? AND store_id = ?",
      [id, storeId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    res.json({
      success: true,
      message: "Voucher deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting voucher:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc    Get voucher statistics
 * @route   GET /api/seller/vouchers/stats
 * @access  Private (Seller)
 */
exports.getVoucherStats = async (req, res) => {
  try {
    const storeId = req.user.store_id;

    const query = `
      SELECT 
        COUNT(*) as total_vouchers,
        SUM(CASE WHEN status = 'upcoming' THEN 1 ELSE 0 END) as upcoming_count,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN status = 'ended' THEN 1 ELSE 0 END) as ended_count,
        SUM(quota_used) as total_usage,
        SUM(estimated_cost) as total_estimated_cost
      FROM vouchers
      WHERE store_id = ? AND deleted_at IS NULL
    `;

    const [[stats]] = await db.query(query, [storeId]);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting voucher stats:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
