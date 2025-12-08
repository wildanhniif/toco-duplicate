// controllers/addressController.js
const db = require("../config/database");
const pool = require("../config/database");
const Joi = require("joi");

// Skema validasi menggunakan Joi
const addressSchema = Joi.object({
  label: Joi.string().min(3).max(50).required(),
  recipient_name: Joi.string().min(3).max(100).required(),
  phone_number: Joi.string().min(10).max(20).required(),
  latitude: Joi.number().optional().allow(null),
  longitude: Joi.number().optional().allow(null),
  map_address: Joi.string().optional().allow(null, ""),
  address_line: Joi.string().optional().allow(null, ""),
  postal_code: Joi.string().max(10).required(),
  province: Joi.string().required(),
  city: Joi.string().required(),
  district: Joi.string().required(),
  subdistrict: Joi.string().required(),
  // API tetap memakai nama field is_primary, nanti di-mapping ke kolom DB is_default
  is_primary: Joi.boolean().required(),
});

// --- TAMBAHKAN SKEMA VALIDASI BARU UNTUK UPDATE ---
// Semua field bersifat opsional saat update
const updateAddressSchema = Joi.object({
  label: Joi.string().min(3).max(50),
  recipient_name: Joi.string().min(3).max(100),
  phone_number: Joi.string().min(10).max(20),
  latitude: Joi.number().optional().allow(null),
  longitude: Joi.number().optional().allow(null),
  map_address: Joi.string().optional().allow(null, ""),
  address_line: Joi.string().optional().allow(null, ""),
  postal_code: Joi.string().max(10),
  province: Joi.string(),
  city: Joi.string(),
  district: Joi.string(),
  subdistrict: Joi.string(),
  // API-level flag, akan di-mapping ke is_default di database
  is_primary: Joi.boolean(),
}).min(1); // User harus menyediakan setidaknya satu field untuk diupdate

exports.createAddress = async (req, res) => {
  // 1. Validasi Input
  const { error, value } = addressSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: "fail",
      message: error.details[0].message,
    });
  }

  const user_id = req.user.user_id || req.user.id;
  if (!user_id) {
    return res.status(401).json({
      status: "fail",
      message: "User tidak terautentik. Silakan login kembali.",
    });
  }

  // Mapping is_primary (API) -> is_default (DB)
  const { is_primary, ...addressData } = value;
  const is_default = is_primary === true;
  const connection = await pool.getConnection(); // Dapatkan koneksi dari pool

  try {
    await connection.beginTransaction(); // Mulai transaksi

    // 2. Logika "Jadikan Alamat Utama" (pakai kolom is_default)
    // Jika alamat baru ini mau dijadikan utama, maka alamat utama sebelumnya (jika ada)
    // statusnya diubah menjadi tidak utama.
    if (is_default === true) {
      const updatePrimarySql =
        "UPDATE user_addresses SET is_default = 0 WHERE user_id = ?";
      await connection.execute(updatePrimarySql, [user_id]);
    }

    // 3. Simpan Alamat Baru
    const insertSql = `
            INSERT INTO user_addresses (user_id, is_default, label, recipient_name, phone_number, latitude, longitude, address_line, postal_code, province, city, district, subdistrict)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

    const [result] = await connection.execute(insertSql, [
      user_id,
      is_default,
      addressData.label,
      addressData.recipient_name,
      addressData.phone_number,
      addressData.latitude ?? null,
      addressData.longitude ?? null,
      addressData.address_line,
      addressData.postal_code,
      addressData.province,
      addressData.city,
      addressData.district,
      addressData.subdistrict,
    ]);

    await connection.commit(); // Commit transaksi jika semua berhasil

    // 4. Kirim Respon Sukses
    res.status(201).json({
      status: "success",
      message: "Alamat berhasil ditambahkan",
      data: {
        addressId: result.insertId,
      },
    });
  } catch (dbError) {
    await connection.rollback(); // Rollback jika ada error
    console.error("Database error:", dbError);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  } finally {
    if (connection) {
      connection.release(); // Selalu lepaskan koneksi
    }
  }
};

exports.getUserAddresses = async (req, res) => {
  // 1. Ambil user ID dari authenticated user
  const userId = req.user.user_id || req.user.id;

  if (!userId) {
    return res
      .status(401)
      .json({ status: "fail", message: "User tidak terautentik." });
  }

  try {
    // 2. Query ke database untuk mengambil semua alamat milik user tersebut
    // Urutkan berdasarkan alamat utama (is_default) terlebih dahulu
    const sql = `
      SELECT
        address_id,
        user_id,
        label,
        recipient_name,
        phone_number,
        latitude,
        longitude,
        NULL as map_address,
        address_line,
        postal_code,
        province,
        city,
        district,
        subdistrict,
        is_default AS is_primary,
        created_at,
        updated_at
      FROM user_addresses
      WHERE user_id = ? AND deleted_at IS NULL
      ORDER BY is_default DESC, created_at DESC`;
    const [addresses] = await db.execute(sql, [userId]);

    // 3. Kirim respon
    // Jika tidak ada alamat, kirim array kosong (ini bukan error)
    res.status(200).json({
      status: "success",
      data: addresses,
    });
  } catch (dbError) {
    console.error("Database error:", dbError);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};

// --- FUNGSI BARU DIMULAI DI SINI ---
exports.updateAddress = async (req, res) => {
  const { addressId } = req.params;
  const userId = req.user.user_id;

  // 1. Validasi Input
  const { error, value } = updateAddressSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ status: "fail", message: error.details[0].message });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 2. Verify address belongs to user
    const [rows] = await connection.execute(
      "SELECT user_id FROM user_addresses WHERE address_id = ? AND user_id = ?",
      [addressId, userId]
    );
    if (rows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        status: "fail",
        message: "Alamat tidak ditemukan atau bukan milik Anda.",
      });
    }

    // 3. Siapkan payload update dan mapping is_primary -> is_default
    const payload = { ...value };

    // LOGIKA ALAMAT UTAMA (Sama seperti fungsi Create)
    // Jika user menjadikan alamat ini utama, maka nonaktifkan status utama alamat lain.
    if (payload.is_primary === true) {
      const updatePrimarySql =
        "UPDATE user_addresses SET is_default = 0 WHERE user_id = ? AND address_id != ?";
      await connection.execute(updatePrimarySql, [userId, addressId]);
    }

    // Mapping ke kolom DB
    if (Object.prototype.hasOwnProperty.call(payload, "is_primary")) {
      payload.is_default = payload.is_primary === true;
      delete payload.is_primary;
    }

    // 4. Bangun query UPDATE secara dinamis
    const fieldsToUpdate = Object.keys(payload);
    const setClauses = fieldsToUpdate.map((field) => `${field} = ?`).join(", ");
    const queryValues = fieldsToUpdate.map((field) => payload[field]);
    queryValues.push(addressId); // Tambahkan addressId untuk klausa WHERE

    const updateSql = `UPDATE user_addresses SET ${setClauses} WHERE address_id = ?`;

    const [result] = await connection.execute(updateSql, queryValues);

    await connection.commit();

    // 5. Kirim respon sukses
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "fail",
        message: "Alamat tidak ditemukan atau tidak ada data yang berubah.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Alamat berhasil diperbarui",
    });
  } catch (dbError) {
    await connection.rollback();
    console.error("Database error:", dbError);
    res
      .status(500)
      .json({ status: "error", message: "Terjadi kesalahan pada server" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// --- FUNGSI DELETE VERSI FINAL ---
exports.deleteAddress = async (req, res) => {
  const { addressId } = req.params;
  const userId = req.user.user_id;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Verify address belongs to user dan get info
    const [addressInfoRows] = await connection.execute(
      "SELECT user_id, is_default FROM user_addresses WHERE address_id = ? AND user_id = ?",
      [addressId, userId]
    );

    if (addressInfoRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        status: "fail",
        message: "Alamat tidak ditemukan atau bukan milik Anda.",
      });
    }

    const { is_default: wasPrimary } = addressInfoRows[0];

    // 2. LOGIKA BARU: Cek jumlah total alamat yang dimiliki user
    const [countRows] = await connection.execute(
      "SELECT COUNT(*) as total FROM user_addresses WHERE user_id = ?",
      [userId]
    );
    const totalAddresses = countRows[0].total;

    // Jika hanya ada satu alamat, tolak penghapusan.
    if (totalAddresses <= 1) {
      await connection.rollback();
      connection.release();
      // Gunakan status 403 Forbidden, artinya server mengerti permintaannya tapi menolak untuk menjalankannya.
      return res.status(403).json({
        status: "fail",
        message:
          "Tidak dapat menghapus alamat terakhir. Anda harus memiliki minimal satu alamat.",
      });
    }

    // 3. Jika lebih dari satu, lanjutkan proses penghapusan
    await connection.execute(
      "DELETE FROM user_addresses WHERE address_id = ?",
      [addressId]
    );

    // 4. LOGIKA PENGGANTI PRIMARY: Jika yang dihapus adalah alamat utama
    if (wasPrimary) {
      // Cari alamat lain (yang paling baru dibuat) untuk dijadikan primary baru.
      const [newPrimaryCandidate] = await connection.execute(
        "SELECT address_id FROM user_addresses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
        [userId]
      );

      // Jika masih ada alamat tersisa (seharusnya ada), update menjadi primary.
      if (newPrimaryCandidate.length > 0) {
        const newPrimaryId = newPrimaryCandidate[0].address_id;
        await connection.execute(
          "UPDATE user_addresses SET is_default = 1 WHERE address_id = ?",
          [newPrimaryId]
        );
      }
    }

    await connection.commit();

    res.status(200).json({
      status: "success",
      message: "Alamat berhasil dihapus.",
    });
  } catch (dbError) {
    await connection.rollback();
    console.error("Database error:", dbError);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
