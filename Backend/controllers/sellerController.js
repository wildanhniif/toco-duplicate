// controllers/sellerController.js

// Asumsikan Anda memiliki koneksi database (misal: pool dari 'mysql2/promise')
const db = require('../config/database');
const slugify = require('../utils/slugify');

exports.registerSeller = async (req, res) => {
    // 1. Dapatkan user ID dari middleware otentikasi (setelah verifikasi JWT)
    const userId = req.user.user_id;

    // Mulai transaksi database
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        // 2. Cek apakah user sudah menjadi seller
        const [users] = await connection.execute('SELECT role FROM users WHERE user_id = ?', [userId]);
        
        if (users.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "User tidak ditemukan." });
        }
        
        if (users[0].role === 'seller') {
            await connection.rollback();
            return res.status(409).json({ message: "Anda sudah terdaftar sebagai seller." });
        }

        // 3. Update role user menjadi 'seller'
        await connection.execute('UPDATE users SET role = ? WHERE user_id = ?', ['seller', userId]);

        // 4. Buat entri toko baru yang default/kosong
        // Kita buat slug unik sementara, user akan mengisinya nanti
        const defaultStoreName = `Toko Baru #${userId}`;
        const defaultSlug = `toko-baru-${userId}-${Date.now()}`;
        
        const [storeResult] = await connection.execute(
            'INSERT INTO stores (user_id, name, slug) VALUES (?, ?, ?)',
            [userId, defaultStoreName, defaultSlug]
        );

        // Commit transaksi jika semua berhasil
        await connection.commit();

        res.status(201).json({
            message: "Selamat! Anda berhasil terdaftar sebagai seller. Silakan lengkapi informasi toko Anda.",
            storeId: storeResult.insertId,
            store: {
                name: defaultStoreName,
                slug: defaultSlug
            }
        });

    } catch (error) {
        // Rollback transaksi jika terjadi error
        await connection.rollback();
        console.error("Error saat registrasi seller:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    } finally {
        // Selalu lepaskan koneksi
        connection.release();
    }
};

// (Fungsi updateStoreDetails yang sudah kita modifikasi di langkah sebelumnya)
exports.updateStoreDetails = async (req, res) => {
    // 1. Dapatkan user ID dari token JWT
    const userId = req.user.user_id;

    // 2. Ambil semua data teks dari form body
    const {
        name,
        description,
        business_phone,
        show_business_phone,
        address_detail,
        postal_code,
        // -- DATA LAMA --
        province,
        city,
        district,
        sub_district,
        // -- DATA BARU (PENTING) --
        province_id,
        city_id,
        district_id,
        sub_district_id,
        // -- DATA LOKASI --
        latitude,
        longitude,
        use_cloudflare
    } = req.body;

    // 3. Validasi data dasar (wajib ada nama toko)
    if (!name) {
        return res.status(400).json({ message: "Nama toko wajib diisi." });
    }

    // 4. Generate slug dari nama toko
    const slug = slugify(name);

    // 5. Dapatkan path file gambar dari multer (jika ada yang di-upload)
    const profileImageUrl = req.files?.profile_image ? `/uploads/stores/${req.files.profile_image[0].filename}` : undefined;
    const backgroundImageUrl = req.files?.background_image ? `/uploads/stores/${req.files.background_image[0].filename}` : undefined;

    try {
        // 6. Bangun query UPDATE secara dinamis
        const fieldsToUpdate = [];
        const values = [];

        // Fungsi helper untuk menambahkan field ke query
        const addField = (field, value) => {
            if (value !== undefined) {
                fieldsToUpdate.push(`${field} = ?`);
                values.push(value);
            }
        };

        addField('name', name);
        addField('slug', slug);
        addField('description', description);
        addField('business_phone', business_phone);
        addField('show_business_phone', show_business_phone);
        addField('address_detail', address_detail);
        addField('postal_code', postal_code);
        
        addField('province', province);
        addField('city', city);
        addField('district', district);
        addField('sub_district', sub_district);

        addField('province_id', province_id);
        addField('city_id', city_id);
        addField('district_id', district_id);
        addField('sub_district_id', sub_district_id);
        
        addField('latitude', latitude);
        addField('longitude', longitude);
        
        addField('use_cloudflare', use_cloudflare);
        addField('profile_image_url', profileImageUrl);
        addField('background_image_url', backgroundImageUrl);
        
        addField('is_active', true);

        if (fieldsToUpdate.length === 0) {
            return res.status(400).json({ message: "Tidak ada data untuk diupdate." });
        }
        
        values.push(userId);
        const sql = `UPDATE stores SET ${fieldsToUpdate.join(', ')} WHERE user_id = ?`;
        const [result] = await db.execute(sql, values);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Toko tidak ditemukan atau Anda tidak memiliki izin." });
        }

        res.status(200).json({
            message: "Informasi toko berhasil diperbarui."
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "Nama toko sudah digunakan. Silakan gunakan nama lain." });
        }
        console.error("Error saat update toko:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};


// === FUNGSI getStoreSettings, updateStoreSettings, dan createOrUpdateAboutPage DIHAPUS DARI SINI ===