// controllers/storeSettings.js
const db = require("../config/database");
const { uploadBufferToCloudinary } = require("../utils/uploadToCloudinary");

// Fungsi ini dipindahkan dari sellerController.js
exports.getStoreSettings = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Query untuk mengambil data dari tabel 'stores' dan 'store_about_pages' sekaligus
    const sql = `
            SELECT 
                s.name, s.description, s.business_phone, s.profile_image_url, s.background_image_url,
                s.is_on_holiday, s.holiday_start_date, s.holiday_end_date, s.show_phone_number,
                ap.title AS about_title, ap.thumbnail_url AS about_thumbnail_url, ap.content AS about_content
            FROM stores s
            LEFT JOIN store_about_pages ap ON s.store_id = ap.store_id
            WHERE s.user_id = ?
        `;

    const [rows] = await db.execute(sql, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Toko tidak ditemukan." });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error saat mengambil pengaturan toko:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};

// Fungsi ini dipindahkan dari sellerController.js
exports.updateStoreSettings = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const {
      is_on_holiday,
      holiday_start_date,
      holiday_end_date,
      show_phone_number,
    } = req.body;

    // Ambil store_id berdasarkan user_id
    const [stores] = await db.execute(
      "SELECT store_id FROM stores WHERE user_id = ?",
      [userId]
    );
    if (stores.length === 0) {
      return res.status(404).json({ message: "Toko tidak ditemukan." });
    }
    const storeId = stores[0].store_id;

    // Validasi sederhana: jika is_on_holiday=true, tanggal harus ada
    if (is_on_holiday && (!holiday_start_date || !holiday_end_date)) {
      return res.status(400).json({
        message:
          "Tanggal mulai dan akhir libur wajib diisi saat mode libur aktif.",
      });
    }

    const sql = `
            UPDATE stores SET 
                is_on_holiday = ?, 
                holiday_start_date = ?, 
                holiday_end_date = ?, 
                show_phone_number = ?
            WHERE store_id = ?
        `;

    // Jika mode libur tidak aktif, paksa tanggal menjadi NULL
    const params = [
      is_on_holiday,
      is_on_holiday ? holiday_start_date : null,
      is_on_holiday ? holiday_end_date : null,
      show_phone_number,
      storeId,
    ];

    await db.execute(sql, params);

    res.status(200).json({ message: "Pengaturan toko berhasil diperbarui." });
  } catch (error) {
    console.error("Error saat update pengaturan toko:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};

// Fungsi ini dipindahkan dari sellerController.js
exports.createOrUpdateAboutPage = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { title, content } = req.body;

    // 1. Validasi Input
    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Judul dan Isi Konten wajib diisi." });
    }

    // 2. Dapatkan ID Toko
    const [stores] = await db.execute(
      "SELECT store_id FROM stores WHERE user_id = ?",
      [userId]
    );
    if (stores.length === 0) {
      return res.status(404).json({ message: "Toko tidak ditemukan." });
    }
    const storeId = stores[0].store_id;

    // 3. Cek apakah halaman "Tentang" sudah ada
    const [aboutPages] = await db.execute(
      "SELECT about_id FROM store_about_pages WHERE store_id = ?",
      [storeId]
    );
    const aboutPageExists = aboutPages.length > 0;

    // 4. Tentukan URL thumbnail (optional - tidak wajib)
    let thumbnailUrl = null;
    if (req.file) {
      // Jika ada file baru yang di-upload
      const result = await uploadBufferToCloudinary(
        req.file.buffer,
        "about_thumbnails",
        { transformation: [{ width: 800, height: 600, crop: "fill" }] }
      );
      thumbnailUrl = result.url;
    }

    // 5. Lakukan Operasi INSERT atau UPDATE (Logika "UPSERT")
    if (aboutPageExists) {
      // UPDATE data yang ada
      if (thumbnailUrl) {
        // Update with thumbnail
        const sql = `UPDATE store_about_pages SET title = ?, content = ?, thumbnail_url = ? WHERE store_id = ?`;
        await db.execute(sql, [title, content, thumbnailUrl, storeId]);
      } else {
        // Update without thumbnail
        const sql = `UPDATE store_about_pages SET title = ?, content = ? WHERE store_id = ?`;
        await db.execute(sql, [title, content, storeId]);
      }
      res
        .status(200)
        .json({ message: "Halaman 'Tentang Toko' berhasil diperbarui." });
    } else {
      // INSERT data baru
      if (thumbnailUrl) {
        const sql = `INSERT INTO store_about_pages (store_id, title, content, thumbnail_url) VALUES (?, ?, ?, ?)`;
        await db.execute(sql, [storeId, title, content, thumbnailUrl]);
      } else {
        const sql = `INSERT INTO store_about_pages (store_id, title, content) VALUES (?, ?, ?)`;
        await db.execute(sql, [storeId, title, content]);
      }
      res
        .status(201)
        .json({ message: "Halaman 'Tentang Toko' berhasil dibuat." });
    }
  } catch (error) {
    console.error("Error saat update halaman 'Tentang Toko':", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};

// ===========================================
// === FUNGSI BARU UNTUK KURIR TOKO (GET) ===
// ===========================================
exports.getStoreCourierSettings = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // 1. Dapatkan store_id
    const [stores] = await db.execute(
      "SELECT store_id FROM stores WHERE user_id = ?",
      [userId]
    );
    if (stores.length === 0) {
      return res.status(404).json({ message: "Toko tidak ditemukan." });
    }
    const storeId = stores[0].store_id;

    // 2. Dapatkan pengaturan utama kurir toko
    const [settings] = await db.execute(
      "SELECT setting_id, is_active, max_delivery_km FROM store_courier_settings WHERE store_id = ?",
      [storeId]
    );

    // Jika belum ada pengaturan, kirim data default (kosong)
    if (settings.length === 0) {
      return res.status(200).json({
        is_active: false,
        max_delivery_km: 0,
        distance_rates: [],
        weight_rates: [],
      });
    }

    const settingId = settings[0].setting_id;

    // 3. Dapatkan data ongkir berdasarkan jarak
    const [distanceRates] = await db.execute(
      "SELECT from_km, to_km, price FROM store_courier_distance_rates WHERE setting_id = ? ORDER BY from_km ASC",
      [settingId]
    );

    // 4. Dapatkan data ongkir tambahan berdasarkan berat
    const [weightRates] = await db.execute(
      "SELECT above_weight_gr, additional_price FROM store_courier_weight_rates WHERE setting_id = ? ORDER BY above_weight_gr ASC",
      [settingId]
    );

    // 5. Gabungkan semua data dan kirim
    res.status(200).json({
      is_active: settings[0].is_active,
      max_delivery_km: settings[0].max_delivery_km,
      distance_rates: distanceRates,
      weight_rates: weightRates,
    });
  } catch (error) {
    console.error("Error saat mengambil pengaturan kurir toko:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};

// =============================================
// === FUNGSI BARU UNTUK KURIR TOKO (UPDATE) ===
// =============================================
exports.updateStoreCourierSettings = async (req, res) => {
  const userId = req.user.user_id;
  const {
    is_active, // boolean: (Aktifkan kurir toko)
    max_delivery_km, // number: (Batas pengiriman ...km)
    distance_rates, // array: [{ from_km, to_km, price }]
    weight_rates, // array: [{ above_weight_gr, additional_price }]
  } = req.body;

  // Mulai transaksi database
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Dapatkan store_id
    const [stores] = await connection.execute(
      "SELECT store_id FROM stores WHERE user_id = ?",
      [userId]
    );
    if (stores.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Toko tidak ditemukan." });
    }
    const storeId = stores[0].store_id;

    // 2. Validasi Input
    if (is_active && (!max_delivery_km || max_delivery_km <= 0)) {
      await connection.rollback();
      return res.status(400).json({
        message: "Batas pengiriman (km) wajib diisi jika kurir toko aktif.",
      });
    }
    if (is_active && (!distance_rates || distance_rates.length === 0)) {
      await connection.rollback();
      return res.status(400).json({
        message: "Pengaturan ongkir jarak wajib diisi jika kurir toko aktif.",
      });
    }

    // 3. Logika "UPSERT" (Update or Insert) untuk pengaturan utama
    // Ini akan membuat data baru jika belum ada, atau update jika sudah ada
    const [upsertResult] = await connection.execute(
      `INSERT INTO store_courier_settings (store_id, is_active, max_delivery_km) 
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE is_active = ?, max_delivery_km = ?`,
      [storeId, is_active, max_delivery_km, is_active, max_delivery_km]
    );

    // Dapatkan ID dari pengaturan yang baru saja di-insert atau di-update
    const settingId =
      upsertResult.insertId > 0
        ? upsertResult.insertId
        : (
            await connection.execute(
              "SELECT setting_id FROM store_courier_settings WHERE store_id = ?",
              [storeId]
            )
          )[0][0].setting_id;

    // --- TRANSAKSI PENGATURAN JARAK ---
    // 4. Hapus semua data ongkir jarak yang lama (agar bersih)
    await connection.execute(
      "DELETE FROM store_courier_distance_rates WHERE setting_id = ?",
      [settingId]
    );

    // 5. Masukkan data ongkir jarak yang baru (jika ada)
    if (is_active && distance_rates && distance_rates.length > 0) {
      const distanceValues = distance_rates.map((rate) => [
        settingId,
        rate.from_km,
        rate.to_km,
        rate.price,
      ]);
      await connection.query(
        "INSERT INTO store_courier_distance_rates (setting_id, from_km, to_km, price) VALUES ?",
        [distanceValues]
      );
    }

    // --- TRANSAKSI PENGATURAN BERAT ---
    // 6. Hapus semua data ongkir berat yang lama
    await connection.execute(
      "DELETE FROM store_courier_weight_rates WHERE setting_id = ?",
      [settingId]
    );

    // 7. Masukkan data ongkir berat yang baru (jika ada)
    if (is_active && weight_rates && weight_rates.length > 0) {
      const weightValues = weight_rates.map((rate) => [
        settingId,
        rate.above_weight_gr,
        rate.additional_price,
      ]);
      await connection.query(
        "INSERT INTO store_courier_weight_rates (setting_id, above_weight_gr, additional_price) VALUES ?",
        [weightValues]
      );
    }

    // 8. Jika semua berhasil, commit transaksi
    await connection.commit();
    res
      .status(200)
      .json({ message: "Pengaturan kurir toko berhasil diperbarui." });
  } catch (error) {
    // 9. Jika ada satu saja error, batalkan semua perubahan
    await connection.rollback();
    console.error("Error saat update pengaturan kurir toko:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  } finally {
    // 10. Selalu lepaskan koneksi
    connection.release();
  }
};

// ==========================================================
// === FUNGSI BARU UNTUK JASA PENGIRIMAN PIHAK KETIGA (GET) ===
// ==========================================================
exports.getAvailableCouriers = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // 1. Dapatkan store_id (opsional, jika toko belum ada, tetap tampilkan list)
    const [stores] = await db.execute(
      "SELECT store_id FROM stores WHERE user_id = ?",
      [userId]
    );
    const storeId = stores.length > 0 ? stores[0].store_id : null;

    // 2. Ambil semua data kurir dan layanannya dalam satu query
    const sql = `
            SELECT 
                c.courier_id as courier_id, c.code as courier_code, c.name as courier_name,
                cs.service_id as service_id, cs.code as service_code, cs.name as service_name
            FROM couriers c
            JOIN courier_services cs ON c.courier_id = cs.courier_id
            WHERE c.is_active = 1 AND cs.is_active = 1
            ORDER BY c.name ASC, cs.name ASC
        `;
    const [allServices] = await db.execute(sql);

    // 3. Ambil layanan yang sudah dipilih oleh toko ini (jika tokonya ada)
    let selectedServiceIds = new Set(); // Gunakan Set untuk pencarian cepat (O(1))
    if (storeId) {
      const [selected] = await db.execute(
        "SELECT service_id FROM store_selected_services WHERE store_id = ?",
        [storeId]
      );
      selected.forEach((s) => selectedServiceIds.add(s.service_id));
    }

    // 4. Proses data menjadi format JSON yang rapi (grouping by courier)
    const couriersMap = new Map();
    allServices.forEach((service) => {
      // Jika kurir belum ada di map, tambahkan
      if (!couriersMap.has(service.courier_id)) {
        couriersMap.set(service.courier_id, {
          courier_id: service.courier_id,
          code: service.courier_code,
          name: service.courier_name,
          services: [],
        });
      }

      // Tambahkan layanan ke kurir yang sesuai
      couriersMap.get(service.courier_id).services.push({
        service_id: service.service_id,
        code: service.service_code,
        name: service.service_name,
        // Cek apakah ID layanan ini ada di Set layanan yang sudah dipilih
        isSelected: selectedServiceIds.has(service.service_id),
      });
    });

    const result = Array.from(couriersMap.values());
    res.status(200).json(result);
  } catch (error) {
    console.error("Error saat mengambil daftar kurir:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};

// ============================================================
// === FUNGSI BARU UNTUK JASA PENGIRIMAN PIHAK KETIGA (UPDATE) ===
// ============================================================
exports.updateSelectedCouriers = async (req, res) => {
  const userId = req.user.user_id;
  // Frontend akan mengirim array berisi ID dari layanan yang dicentang
  const { selected_service_ids } = req.body; // Contoh: [1, 2, 5, 13, 14]

  // Validasi sederhana
  if (!Array.isArray(selected_service_ids)) {
    return res.status(400).json({ message: "Input harus berupa array." });
  }

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Dapatkan store_id
    const [stores] = await connection.execute(
      "SELECT store_id FROM stores WHERE user_id = ?",
      [userId]
    );
    if (stores.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Toko tidak ditemukan." });
    }
    const storeId = stores[0].store_id;

    // 2. Hapus semua pilihan kurir yang lama untuk toko ini.
    // Ini adalah cara paling aman dan sederhana untuk sinkronisasi.
    await connection.execute(
      "DELETE FROM store_selected_services WHERE store_id = ?",
      [storeId]
    );

    // 3. Jika ada layanan baru yang dipilih, masukkan semuanya sekaligus (bulk insert)
    if (selected_service_ids.length > 0) {
      const values = selected_service_ids.map((serviceId) => [
        storeId,
        serviceId,
      ]);
      await connection.query(
        "INSERT INTO store_selected_services (store_id, service_id) VALUES ?",
        [values]
      );
    }

    // 4. Commit transaksi jika semua berhasil
    await connection.commit();
    res
      .status(200)
      .json({ message: "Pilihan jasa pengiriman berhasil diperbarui." });
  } catch (error) {
    await connection.rollback();
    // Cek jika error karena service_id tidak valid
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res
        .status(400)
        .json({ message: "Satu atau lebih ID layanan tidak valid." });
    }
    console.error("Error saat update pilihan kurir:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  } finally {
    connection.release();
  }
};
