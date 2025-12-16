// controllers/sellerController.js

const db = require("../config/database");
const slugify = require("../utils/slugify");
const jwt = require("jsonwebtoken");
const {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
} = require("../utils/uploadToCloudinary");

// Helper untuk mengambil userId dari payload JWT yang bisa punya dua bentuk:
// 1) { user_id, name, role, store_id }
// 2) { user: { id, name }, ... }
const resolveUserIdFromToken = (userPayload) => {
  if (!userPayload) return null;

  if (userPayload.user_id) {
    return userPayload.user_id;
  }

  if (userPayload.user && userPayload.user.id) {
    return userPayload.user.id;
  }

  return null;
};

// Helper untuk mengambil public_id Cloudinary dari URL penuh
// Contoh URL: https://res.cloudinary.com/<cloud>/image/upload/v123/toco-seller/stores/abc123.jpg
// Hasil: toco-seller/stores/abc123
const extractCloudinaryPublicIdFromUrl = (url) => {
  if (!url || typeof url !== "string") return null;

  try {
    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex === -1) return null;

    let remainder = url.substring(uploadIndex + "/upload/".length);

    // Buang query string jika ada
    remainder = remainder.split("?")[0];

    // Buang prefix versi: v123456/
    remainder = remainder.replace(/^v[0-9]+\//, "");

    // Buang ekstensi file: .jpg, .png, dll
    const lastDot = remainder.lastIndexOf(".");
    if (lastDot !== -1) {
      remainder = remainder.substring(0, lastDot);
    }

    return remainder || null;
  } catch (error) {
    console.error(
      "Failed to extract Cloudinary public_id from URL:",
      url,
      error
    );
    return null;
  }
};

exports.registerSeller = async (req, res) => {
  console.log("=== Seller Registration Debug ===");
  console.log("req.user:", req.user);
  console.log("JWT_SECRET in controller:", !!process.env.JWT_SECRET);

  const userId = resolveUserIdFromToken(req.user);

  if (!userId) {
    console.error("No user_id found in req.user:", req.user);
    return res.status(401).json({ message: "User tidak terautentikasi." });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Cek apakah user sudah menjadi seller
    const [users] = await connection.execute(
      "SELECT role, store_id FROM users u LEFT JOIN stores s ON u.user_id = s.user_id WHERE u.user_id = ?",
      [userId]
    );

    if (users.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "User tidak ditemukan." });
    }

    const user = users[0];

    if (user.role === "seller") {
      await connection.rollback();
      return res.status(409).json({
        message: "Anda sudah terdaftar sebagai seller.",
        store_id: user.store_id,
      });
    }

    // Check if user already has a store but role is still customer
    if (user.store_id) {
      console.log("User has store but role is not seller. Updating role...");
      // Update role user menjadi 'seller'
      await connection.execute("UPDATE users SET role = ? WHERE user_id = ?", [
        "seller",
        userId,
      ]);

      await connection.commit();

      // Generate new JWT token with updated role and existing store_id
      const [userDetails] = await connection.execute(
        "SELECT user_id, full_name, role FROM users WHERE user_id = ?",
        [userId]
      );

      const payload = {
        user_id: userId,
        name: userDetails[0].full_name,
        role: "seller",
        store_id: user.store_id,
      };

      const newToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      return res.status(200).json({
        message: "Role berhasil diperbarui menjadi seller.",
        token: newToken,
        store_id: user.store_id,
      });
    }

    // Update role user menjadi 'seller'
    await connection.execute("UPDATE users SET role = ? WHERE user_id = ?", [
      "seller",
      userId,
    ]);

    // Buat entri toko baru
    const defaultStoreName = `Toko Baru #${userId}`;
    const defaultSlug = `toko-baru-${userId}-${Date.now()}`;

    const [storeResult] = await connection.execute(
      "INSERT INTO stores (user_id, name, slug, is_active) VALUES (?, ?, ?, ?)",
      [userId, defaultStoreName, defaultSlug, false]
    );

    await connection.commit();

    // Generate new JWT token with updated role and store_id
    const [userDetails] = await connection.execute(
      "SELECT user_id, full_name, role FROM users WHERE user_id = ?",
      [userId]
    );

    const payload = {
      user_id: userId,
      name: userDetails[0].full_name,
      role: "seller",
      store_id: storeResult.insertId,
    };

    const newToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(201).json({
      message:
        "Selamat! Anda berhasil terdaftar sebagai seller. Silakan lengkapi informasi toko Anda.",
      token: newToken,
      store_id: storeResult.insertId,
      store: {
        name: defaultStoreName,
        slug: defaultSlug,
        is_active: false,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error saat registrasi seller:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: "Toko sudah ada untuk user ini." });
    }

    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  } finally {
    connection.release();
  }
};

exports.updateStoreDetails = async (req, res) => {
  const userId = resolveUserIdFromToken(req.user);

  if (!userId) {
    return res.status(401).json({ message: "User tidak terautentikasi." });
  }

  const {
    name,
    description,
    business_phone,
    show_phone_number,
    address_line,
    postal_code,
    province,
    city,
    district,
    subdistrict,
    province_id,
    city_id,
    district_id,
    subdistrict_id,
    latitude,
    longitude,
    use_cloudflare,
  } = req.body;

  // Validasi data dasar
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ message: "Nama toko wajib diisi." });
  }

  if (name.length > 100) {
    return res
      .status(400)
      .json({ message: "Nama toko maksimal 100 karakter." });
  }

  // Generate slug dari nama toko
  const slug = slugify(name.trim());

  const connection = await db.getConnection();

  let profileImageUrl;
  let backgroundImageUrl;

  try {
    await connection.beginTransaction();

    // Cek apakah user memiliki toko dan ambil URL gambar lama jika ada
    const [stores] = await connection.execute(
      "SELECT store_id, slug, profile_image_url, background_image_url FROM stores WHERE user_id = ?",
      [userId]
    );

    if (stores.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        message:
          "Toko tidak ditemukan. Silakan daftar sebagai seller terlebih dahulu.",
      });
    }

    // Cek duplikasi slug (kecuali untuk toko sendiri)
    const [existingSlug] = await connection.execute(
      "SELECT store_id FROM stores WHERE slug = ? AND user_id != ?",
      [slug, userId]
    );

    if (existingSlug.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        message: "Nama toko sudah digunakan. Silakan gunakan nama lain.",
      });
    }

    // Bangun query UPDATE secara dinamis
    const fieldsToUpdate = [];
    const values = [];

    const addField = (field, value) => {
      if (value !== undefined && value !== null && value !== "") {
        fieldsToUpdate.push(`${field} = ?`);
        values.push(value);
      }
    };

    addField("name", name.trim());
    addField("slug", slug);
    addField("description", description?.trim());
    addField("business_phone", business_phone?.trim());
    addField(
      "show_phone_number",
      show_phone_number !== undefined ? Boolean(show_phone_number) : undefined
    );
    addField("address_line", address_line?.trim());
    addField("postal_code", postal_code?.trim());
    addField("province", province?.trim());
    addField("city", city?.trim());
    addField("district", district?.trim());
    addField("subdistrict", subdistrict?.trim());
    addField("province_id", province_id);
    addField("city_id", city_id);
    addField("district_id", district_id);
    addField("subdistrict_id", subdistrict_id);
    addField("latitude", latitude);
    addField("longitude", longitude);
    addField("use_cloudflare", use_cloudflare);
    addField("profile_image_url", profileImageUrl);
    addField("background_image_url", backgroundImageUrl);
    addField("is_active", true);
    addField("updated_at", new Date());

    if (fieldsToUpdate.length === 0) {
      await connection.rollback();
      return res
        .status(400)
        .json({ message: "Tidak ada data untuk diupdate." });
    }

    values.push(userId);
    const sql = `UPDATE stores SET ${fieldsToUpdate.join(
      ", "
    )} WHERE user_id = ?`;
    const [result] = await connection.execute(sql, values);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        message: "Toko tidak ditemukan atau Anda tidak memiliki izin.",
      });
    }

    await connection.commit();

    res.status(200).json({
      message: "Informasi toko berhasil diperbarui.",
      store: {
        name: name.trim(),
        slug: slug,
        is_active: true,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error saat update toko:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Nama toko sudah digunakan. Silakan gunakan nama lain.",
      });
    }

    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  } finally {
    connection.release();
  }
};

// Get dashboard stats for seller
exports.getDashboardStats = async (req, res) => {
  const userId = resolveUserIdFromToken(req.user);

  try {
    // Get store_id for this user
    const [stores] = await db.execute(
      "SELECT store_id FROM stores WHERE user_id = ?",
      [userId]
    );

    if (stores.length === 0) {
      return res.status(404).json({ message: "Toko tidak ditemukan." });
    }

    const storeId = stores[0].store_id;

    // Get order counts
    const [newOrders] = await db.execute(
      `SELECT COUNT(*) as count FROM orders WHERE store_id = ? AND status = 'pending'`,
      [storeId]
    );

    const [ongoingOrders] = await db.execute(
      `SELECT COUNT(*) as count FROM orders WHERE store_id = ? AND status IN ('processing', 'shipped')`,
      [storeId]
    );

    // Get product count
    const [products] = await db.execute(
      `SELECT COUNT(*) as count FROM products WHERE store_id = ? AND status = 'active'`,
      [storeId]
    );

    // Get total transaction amount (last 30 days)
    const [transactions] = await db.execute(
      `SELECT COALESCE(SUM(total_amount), 0) as total FROM orders 
       WHERE store_id = ? AND status IN ('completed', 'delivered') 
       AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [storeId]
    );

    // Get transaction data for chart (last 30 days, grouped by date)
    const [dailyTransactions] = await db.execute(
      `SELECT DATE(created_at) as date, SUM(total_amount) as total 
       FROM orders 
       WHERE store_id = ? AND status IN ('completed', 'delivered')
       AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [storeId]
    );

    res.status(200).json({
      stats: {
        pesanan_baru: newOrders[0].count || 0,
        pesanan_berlangsung: ongoingOrders[0].count || 0,
        total_produk: products[0].count || 0,
        chat_baru: 0, // TODO: implement chat system
      },
      total_transaksi: transactions[0].total || 0,
      daily_transactions: dailyTransactions,
    });
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};

// Get store details for current user
exports.getMyStore = async (req, res) => {
  const userId = resolveUserIdFromToken(req.user);

  try {
    const [stores] = await db.execute(
      `SELECT s.*, u.full_name, u.email 
             FROM stores s 
             JOIN users u ON s.user_id = u.user_id 
             WHERE s.user_id = ?`,
      [userId]
    );

    if (stores.length === 0) {
      return res.status(404).json({ message: "Toko tidak ditemukan." });
    }

    res.status(200).json({
      store: stores[0],
    });
  } catch (error) {
    console.error("Error saat mengambil data toko:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};
