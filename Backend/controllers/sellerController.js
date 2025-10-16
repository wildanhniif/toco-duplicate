// controllers/sellerController.js

// Asumsikan Anda memiliki koneksi database (misal: pool dari 'mysql2/promise')
const db = require('../config/database');
const slugify = require('../utils/slugify');

exports.registerSeller = async (req, res) => {
    // 1. Dapatkan user ID dari middleware otentikasi (setelah verifikasi JWT)
    const userId = req.user.id;

    // Mulai transaksi database
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        // 2. Cek apakah user sudah menjadi seller
        const [users] = await connection.execute('SELECT role FROM users WHERE id = ?', [userId]);
        
        if (users.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "User tidak ditemukan." });
        }
        
        if (users[0].role === 'seller') {
            await connection.rollback();
            return res.status(409).json({ message: "Anda sudah terdaftar sebagai seller." });
        }

        // 3. Update role user menjadi 'seller'
        await connection.execute('UPDATE users SET role = ? WHERE id = ?', ['seller', userId]);

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

exports.updateStoreDetails = async (req, res) => {
    // 1. Dapatkan user ID dari token JWT
    const userId = req.user.id;

    // 2. Ambil semua data teks dari form body
    const {
        name,
        description,
        business_phone,
        show_business_phone,
        address_detail,
        postal_code,
        province,
        city,
        district,
        sub_district,
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
    // `req.files` akan dibuat oleh multer. Kita cek apakah file 'profile' atau 'background' ada.
    const profileImageUrl = req.files?.profile_image ? `/uploads/stores/${req.files.profile_image[0].filename}` : undefined;
    const backgroundImageUrl = req.files?.background_image ? `/uploads/stores/${req.files.background_image[0].filename}` : undefined;

    try {
        // 6. Bangun query UPDATE secara dinamis
        // Ini lebih efisien daripada mengirim semua field, bahkan yang tidak berubah
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
        addField('latitude', latitude);
        addField('longitude', longitude);
        addField('use_cloudflare', use_cloudflare);
        addField('profile_image_url', profileImageUrl);
        addField('background_image_url', backgroundImageUrl);
        
        // Tandai toko sebagai 'aktif' setelah diisi pertama kali
        addField('is_active', true);

        if (fieldsToUpdate.length === 0) {
            return res.status(400).json({ message: "Tidak ada data untuk diupdate." });
        }
        
        // Tambahkan user_id ke akhir array values untuk klausa WHERE
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
        // Cek jika error karena slug duplikat
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "Nama toko sudah digunakan. Silakan gunakan nama lain." });
        }
        console.error("Error saat update toko:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};