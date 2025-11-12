// controllers/voucherSellerController.js

const db = require("../config/database");
const crypto = require("crypto");

/**
 * Generate voucher code otomatis
 */
function generateVoucherCode(prefix = "VCHR") {
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${random}`;
}

/**
 * Hitung estimasi pengeluaran
 */
function calculateEstimatedExpenditure(
  usage_limit_total,
  type,
  value,
  max_discount = null
) {
  if (!usage_limit_total) return 0;

  if (type === "percent") {
    // Untuk persentase, estimasi = kuota * max_discount (worst case)
    // Jika tidak ada max_discount, estimasi tidak bisa dihitung dengan akurat
    return max_discount ? usage_limit_total * parseFloat(max_discount) : 0;
  } else {
    // Untuk fixed/potongan, estimasi = kuota * nominal
    return usage_limit_total * parseFloat(value);
  }
}

/**
 * @desc    Membuat voucher baru
 * @route   POST /api/vouchers
 * @access  Private (Seller)
 */
exports.createVoucher = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const userId = req.user.user_id;

    // Ambil store_id seller
    const [storeRows] = await conn.query(
      "SELECT store_id FROM stores WHERE user_id = ? LIMIT 1",
      [userId]
    );
    if (!storeRows.length) {
      await conn.rollback();
      return res.status(403).json({ message: "User does not have a store" });
    }
    const store_id = storeRows[0].store_id;

    const {
      voucher_type, // 'discount' | 'free_shipping'
      target, // 'public' | 'private'
      title,
      description,
      type, // 'percent' | 'fixed' (untuk discount)
      value, // nilai persentase atau nominal
      max_discount, // untuk persentase
      min_discount, // untuk persentase
      min_order_amount, // minimum transaksi
      start_at,
      end_at,
      usage_limit_total, // kuota promosi
      usage_limit_per_user, // limit per pembeli (null = tanpa batas)
      code, // kode voucher (opsional, akan di-generate otomatis jika tidak ada)
      applicable_to, // 'all_products' | 'specific_products'
      product_ids = [], // array product_id jika applicable_to = 'specific_products'
    } = req.body;

    // Validasi wajib
    if (
      !voucher_type ||
      !["discount", "free_shipping"].includes(voucher_type)
    ) {
      await conn.rollback();
      return res
        .status(400)
        .json({
          message: "Voucher type harus 'discount' atau 'free_shipping'",
        });
    }
    if (!target || !["public", "private"].includes(target)) {
      await conn.rollback();
      return res
        .status(400)
        .json({ message: "Target harus 'public' atau 'private'" });
    }
    if (!title || title.trim() === "") {
      await conn.rollback();
      return res.status(400).json({ message: "Judul promosi wajib diisi" });
    }
    if (!start_at || !end_at) {
      await conn.rollback();
      return res.status(400).json({ message: "Periode promosi wajib diisi" });
    }
    if (new Date(start_at) >= new Date(end_at)) {
      await conn.rollback();
      return res
        .status(400)
        .json({ message: "Periode berakhir harus setelah periode dimulai" });
    }
    if (!usage_limit_total || usage_limit_total < 1) {
      await conn.rollback();
      return res
        .status(400)
        .json({ message: "Kuota promosi harus lebih dari 0" });
    }
    if (usage_limit_per_user !== null && usage_limit_per_user < 1) {
      await conn.rollback();
      return res
        .status(400)
        .json({ message: "Limit per pembeli harus lebih dari 0 atau null" });
    }

    // Validasi untuk discount
    if (voucher_type === "discount") {
      if (!type || !["percent", "fixed"].includes(type)) {
        await conn.rollback();
        return res
          .status(400)
          .json({ message: "Type harus 'percent' atau 'fixed'" });
      }
      if (!value || parseFloat(value) <= 0) {
        await conn.rollback();
        return res.status(400).json({ message: "Nominal diskon wajib diisi" });
      }
      if (type === "percent") {
        if (parseFloat(value) > 100 || parseFloat(value) < 0) {
          await conn.rollback();
          return res
            .status(400)
            .json({ message: "Persentase harus antara 0-100" });
        }
        if (!max_discount || parseFloat(max_discount) <= 0) {
          await conn.rollback();
          return res
            .status(400)
            .json({ message: "Maksimum diskon wajib diisi untuk persentase" });
        }
      } else {
        // fixed/potongan
        if (!min_order_amount || parseFloat(min_order_amount) <= 0) {
          await conn.rollback();
          return res
            .status(400)
            .json({ message: "Minimum transaksi wajib diisi untuk potongan" });
        }
      }
    }

    // Validasi untuk free_shipping
    if (voucher_type === "free_shipping") {
      // Untuk free_shipping, set type = 'fixed' dan value = 0 (atau bisa disesuaikan)
      // Tapi tetap perlu min_order_amount
      if (!min_order_amount || parseFloat(min_order_amount) <= 0) {
        await conn.rollback();
        return res
          .status(400)
          .json({
            message: "Minimum transaksi wajib diisi untuk gratis ongkir",
          });
      }
    }

    // Validasi applicable_to
    if (
      !applicable_to ||
      !["all_products", "specific_products"].includes(applicable_to)
    ) {
      await conn.rollback();
      return res
        .status(400)
        .json({
          message:
            "Penerapan voucher harus 'all_products' atau 'specific_products'",
        });
    }
    if (applicable_to === "specific_products") {
      if (!Array.isArray(product_ids) || product_ids.length === 0) {
        await conn.rollback();
        return res
          .status(400)
          .json({
            message:
              "Product IDs wajib diisi jika penerapan voucher adalah produk tertentu",
          });
      }
      // Validasi product_ids milik store seller
      const placeholders = product_ids.map(() => "?").join(",");
      const [productRows] = await conn.query(
        `SELECT product_id FROM products WHERE product_id IN (${placeholders}) AND store_id = ?`,
        [...product_ids, store_id]
      );
      if (productRows.length !== product_ids.length) {
        await conn.rollback();
        return res
          .status(400)
          .json({
            message:
              "Beberapa produk tidak ditemukan atau bukan milik toko Anda",
          });
      }
    }

    // Generate code jika tidak ada
    let voucherCode =
      code && code.trim() !== ""
        ? code.trim().toUpperCase()
        : generateVoucherCode();

    // Cek code unique
    const [codeCheck] = await conn.query(
      "SELECT voucher_id FROM vouchers WHERE code = ?",
      [voucherCode]
    );
    if (codeCheck.length > 0) {
      await conn.rollback();
      return res.status(400).json({ message: "Kode voucher sudah digunakan" });
    }

    // Hitung estimasi pengeluaran
    let estimated_expenditure = 0;
    if (voucher_type === "discount") {
      if (type === "percent") {
        estimated_expenditure = calculateEstimatedExpenditure(
          usage_limit_total,
          type,
          value,
          max_discount
        );
      } else {
        estimated_expenditure = calculateEstimatedExpenditure(
          usage_limit_total,
          type,
          value
        );
      }
    } else {
      // free_shipping - estimasi sulit dihitung karena tergantung shipping cost
      // Untuk sementara set 0 atau bisa dihitung berdasarkan rata-rata
      estimated_expenditure = 0;
    }

    // Insert voucher
    const [result] = await conn.query(
      `INSERT INTO vouchers (
        store_id, code, voucher_type, type, value, max_discount, min_discount,
        min_order_amount, title, description, target, applicable_to,
        start_at, end_at, usage_limit_total, usage_limit_per_user, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        store_id,
        voucherCode,
        voucher_type,
        voucher_type === "free_shipping" ? "fixed" : type, // free_shipping menggunakan type='fixed'
        voucher_type === "free_shipping" ? 0 : parseFloat(value),
        max_discount ? parseFloat(max_discount) : null,
        min_discount ? parseFloat(min_discount) : null,
        min_order_amount ? parseFloat(min_order_amount) : 0,
        title.trim(),
        description ? description.trim() : null,
        target,
        applicable_to,
        start_at,
        end_at,
        parseInt(usage_limit_total),
        usage_limit_per_user ? parseInt(usage_limit_per_user) : null,
      ]
    );

    const voucher_id = result.insertId;

    // Insert voucher_products jika applicable_to = 'specific_products'
    if (applicable_to === "specific_products" && product_ids.length > 0) {
      const productValues = product_ids.map((product_id) => [
        voucher_id,
        product_id,
      ]);
      const placeholders = productValues.map(() => "(?, ?)").join(", ");
      const values = productValues.flat();
      await conn.query(
        `INSERT INTO voucher_products (voucher_id, product_id) VALUES ${placeholders}`,
        values
      );
    }

    await conn.commit();

    // Fetch created voucher dengan detail
    const [voucherRows] = await conn.query(
      `SELECT v.*, 
       (SELECT COUNT(*) FROM voucher_products WHERE voucher_id = v.voucher_id) as product_count
       FROM vouchers v WHERE voucher_id = ?`,
      [voucher_id]
    );

    const voucher = voucherRows[0];

    // Get product details jika applicable_to = 'specific_products'
    if (applicable_to === "specific_products") {
      const [productRows] = await conn.query(
        `SELECT p.product_id, p.name, p.price, 
         (SELECT url FROM product_images WHERE product_id = p.product_id ORDER BY sort_order ASC LIMIT 1) as image_url
         FROM products p
         INNER JOIN voucher_products vp ON p.product_id = vp.product_id
         WHERE vp.voucher_id = ?`,
        [voucher_id]
      );
      voucher.products = productRows;
    }

    voucher.estimated_expenditure = estimated_expenditure;

    conn.release();
    res.status(201).json({
      message: "Voucher berhasil dibuat",
      voucher,
    });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  } finally {
    if (conn) conn.release();
  }
};

/**
 * @desc    Ambil daftar voucher seller
 * @route   GET /api/vouchers/my
 * @access  Private (Seller)
 */
exports.getMyVouchers = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Ambil store_id seller
    const [storeRows] = await db.query(
      "SELECT store_id FROM stores WHERE user_id = ? LIMIT 1",
      [userId]
    );
    if (!storeRows.length) {
      return res.status(403).json({ message: "User does not have a store" });
    }
    const store_id = storeRows[0].store_id;

    const {
      status = "all", // 'all' | 'upcoming' | 'ongoing' | 'ended'
      type, // 'discount' | 'free_shipping'
      target, // 'public' | 'private'
      q, // search by title/description
      period_type, // 'day' | 'week' | 'month' | 'custom'
      period_start, // untuk custom
      period_end, // untuk custom
      period_preset, // 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month'
      sort = "created_at_desc", // 'created_at_desc' | 'created_at_asc' | 'usage_desc' | 'usage_asc' | 'title_asc' | 'title_desc'
      page = 1,
      limit = 20,
    } = req.query;

    const where = [`v.store_id = ?`];
    const params = [store_id];

    // Filter by status
    const now = new Date();
    if (status !== "all") {
      if (status === "upcoming") {
        where.push(`v.start_at > ?`);
        params.push(now);
      } else if (status === "ongoing") {
        where.push(`v.start_at <= ? AND v.end_at >= ?`);
        params.push(now, now);
      } else if (status === "ended") {
        where.push(`v.end_at < ?`);
        params.push(now);
      }
    }

    // Filter by type
    if (type && ["discount", "free_shipping"].includes(type)) {
      where.push(`v.voucher_type = ?`);
      params.push(type);
    }

    // Filter by target
    if (target && ["public", "private"].includes(target)) {
      where.push(`v.target = ?`);
      params.push(target);
    }

    // Search
    if (q) {
      where.push(`(v.title LIKE ? OR v.description LIKE ?)`);
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm);
    }

    // Filter by period
    if (period_preset) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (period_preset === "today") {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        where.push(`v.start_at >= ? AND v.start_at < ?`);
        params.push(today, tomorrow);
      } else if (period_preset === "yesterday") {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        where.push(`v.start_at >= ? AND v.start_at < ?`);
        params.push(yesterday, today);
      } else if (period_preset === "last_7_days") {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        where.push(`v.start_at >= ?`);
        params.push(sevenDaysAgo);
      } else if (period_preset === "last_30_days") {
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        where.push(`v.start_at >= ?`);
        params.push(thirtyDaysAgo);
      } else if (period_preset === "this_month") {
        const firstDayOfMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        );
        where.push(`v.start_at >= ?`);
        params.push(firstDayOfMonth);
      }
    } else if (period_type === "custom" && period_start && period_end) {
      where.push(`v.start_at >= ? AND v.end_at <= ?`);
      params.push(period_start, period_end);
    }

    // Sort
    let orderBy = "v.created_at DESC";
    if (sort === "created_at_asc") orderBy = "v.created_at ASC";
    else if (sort === "usage_desc") orderBy = "usage_count DESC";
    else if (sort === "usage_asc") orderBy = "usage_count ASC";
    else if (sort === "title_asc") orderBy = "v.title ASC";
    else if (sort === "title_desc") orderBy = "v.title DESC";

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Query dengan count usage
    const sql = `
      SELECT v.*,
             (SELECT COUNT(*) FROM voucher_usages vu WHERE vu.voucher_id = v.voucher_id) as usage_count,
             (SELECT COUNT(*) FROM voucher_products vp WHERE vp.voucher_id = v.voucher_id) as product_count
      FROM vouchers v
      WHERE ${where.join(" AND ")}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), offset);

    const [vouchers] = await db.query(sql, params);

    // Count total
    const countSql = `
      SELECT COUNT(*) as total
      FROM vouchers v
      WHERE ${where.join(" AND ")}
    `;
    const countParams = params.slice(0, -2); // Hapus limit dan offset
    const [countResult] = await db.query(countSql, countParams);
    const total = countResult[0].total;

    // Format response
    const formattedVouchers = vouchers.map((v) => {
      const voucher = { ...v };

      // Determine status
      const startDate = new Date(v.start_at);
      const endDate = new Date(v.end_at);
      if (now < startDate) {
        voucher.status = "upcoming";
      } else if (now >= startDate && now <= endDate) {
        voucher.status = "ongoing";
      } else {
        voucher.status = "ended";
      }

      // Format nominal
      if (v.voucher_type === "discount") {
        if (v.type === "percent") {
          voucher.nominal = `${v.value}%`;
          if (v.max_discount)
            voucher.nominal += ` (maks ${v.max_discount.toLocaleString(
              "id-ID"
            )})`;
        } else {
          voucher.nominal = `Rp ${parseFloat(v.value).toLocaleString("id-ID")}`;
        }
      } else {
        voucher.nominal = "Gratis Ongkir";
      }

      return voucher;
    });

    res.json({
      vouchers: formattedVouchers,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc    Ambil detail voucher
 * @route   GET /api/vouchers/:id
 * @access  Private (Seller)
 */
exports.getVoucherById = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { id } = req.params;

    // Ambil store_id seller
    const [storeRows] = await db.query(
      "SELECT store_id FROM stores WHERE user_id = ? LIMIT 1",
      [userId]
    );
    if (!storeRows.length) {
      return res.status(403).json({ message: "User does not have a store" });
    }
    const store_id = storeRows[0].store_id;

    const [voucherRows] = await db.query(
      `SELECT v.*,
       (SELECT COUNT(*) FROM voucher_usages vu WHERE vu.voucher_id = v.voucher_id) as usage_count
       FROM vouchers v
       WHERE v.voucher_id = ? AND v.store_id = ?`,
      [id, store_id]
    );

    if (!voucherRows.length) {
      return res.status(404).json({ message: "Voucher tidak ditemukan" });
    }

    const voucher = voucherRows[0];

    // Get products jika applicable_to = 'specific_products'
    if (voucher.applicable_to === "specific_products") {
      const [productRows] = await db.query(
        `SELECT p.product_id, p.name, p.price, p.sku,
         (SELECT url FROM product_images WHERE product_id = p.product_id ORDER BY sort_order ASC LIMIT 1) as image_url
         FROM products p
         INNER JOIN voucher_products vp ON p.product_id = vp.product_id
         WHERE vp.voucher_id = ?`,
        [id]
      );
      voucher.products = productRows;
    }

    // Determine status
    const now = new Date();
    const startDate = new Date(voucher.start_at);
    const endDate = new Date(voucher.end_at);
    if (now < startDate) {
      voucher.status = "upcoming";
    } else if (now >= startDate && now <= endDate) {
      voucher.status = "ongoing";
    } else {
      voucher.status = "ended";
    }

    res.json({ voucher });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc    Duplikasi voucher
 * @route   POST /api/vouchers/:id/duplicate
 * @access  Private (Seller)
 */
exports.duplicateVoucher = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const userId = req.user.user_id;
    const { id } = req.params;

    // Ambil store_id seller
    const [storeRows] = await conn.query(
      "SELECT store_id FROM stores WHERE user_id = ? LIMIT 1",
      [userId]
    );
    if (!storeRows.length) {
      await conn.rollback();
      return res.status(403).json({ message: "User does not have a store" });
    }
    const store_id = storeRows[0].store_id;

    // Ambil voucher original
    const [voucherRows] = await conn.query(
      "SELECT * FROM vouchers WHERE voucher_id = ? AND store_id = ?",
      [id, store_id]
    );

    if (!voucherRows.length) {
      await conn.rollback();
      return res.status(404).json({ message: "Voucher tidak ditemukan" });
    }

    const original = voucherRows[0];

    // Generate code baru
    const newCode = generateVoucherCode();

    // Insert voucher baru (copy semua field kecuali code)
    const [result] = await conn.query(
      `INSERT INTO vouchers (
        store_id, code, voucher_type, type, value, max_discount, min_discount,
        min_order_amount, title, description, target, applicable_to,
        start_at, end_at, usage_limit_total, usage_limit_per_user, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        original.store_id,
        newCode,
        original.voucher_type,
        original.type,
        original.value,
        original.max_discount,
        original.min_discount,
        original.min_order_amount,
        `${original.title} (Copy)`,
        original.description,
        original.target,
        original.applicable_to,
        original.start_at,
        original.end_at,
        original.usage_limit_total,
        original.usage_limit_per_user,
        original.is_active,
      ]
    );

    const newVoucherId = result.insertId;

    // Copy voucher_products jika applicable_to = 'specific_products'
    if (original.applicable_to === "specific_products") {
      const [productRows] = await conn.query(
        "SELECT product_id FROM voucher_products WHERE voucher_id = ?",
        [id]
      );
      if (productRows.length > 0) {
        const productValues = productRows.map((p) => [
          newVoucherId,
          p.product_id,
        ]);
        const placeholders = productValues.map(() => "(?, ?)").join(", ");
        const values = productValues.flat();
        await conn.query(
          `INSERT INTO voucher_products (voucher_id, product_id) VALUES ${placeholders}`,
          values
        );
      }
    }

    await conn.commit();

    // Fetch created voucher
    const [newVoucherRows] = await conn.query(
      `SELECT v.*,
       (SELECT COUNT(*) FROM voucher_products WHERE voucher_id = v.voucher_id) as product_count
       FROM vouchers v WHERE voucher_id = ?`,
      [newVoucherId]
    );

    conn.release();
    res.status(201).json({
      message: "Voucher berhasil diduplikasi",
      voucher: newVoucherRows[0],
    });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  } finally {
    if (conn) conn.release();
  }
};

/**
 * @desc    Akhiri voucher (set is_active = 0 atau end_at = now)
 * @route   PUT /api/vouchers/:id/end
 * @access  Private (Seller)
 */
exports.endVoucher = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { id } = req.params;

    // Ambil store_id seller
    const [storeRows] = await db.query(
      "SELECT store_id FROM stores WHERE user_id = ? LIMIT 1",
      [userId]
    );
    if (!storeRows.length) {
      return res.status(403).json({ message: "User does not have a store" });
    }
    const store_id = storeRows[0].store_id;

    // Cek voucher exists dan milik store
    const [voucherRows] = await db.query(
      "SELECT voucher_id FROM vouchers WHERE voucher_id = ? AND store_id = ?",
      [id, store_id]
    );

    if (!voucherRows.length) {
      return res.status(404).json({ message: "Voucher tidak ditemukan" });
    }

    // Update end_at menjadi sekarang atau set is_active = 0
    const now = new Date();
    await db.query(
      "UPDATE vouchers SET end_at = ?, is_active = 0 WHERE voucher_id = ?",
      [now, id]
    );

    res.json({ message: "Voucher berhasil diakhiri" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

