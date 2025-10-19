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

// Fungsi baru untuk mendapatkan semua pengaturan toko
exports.getStoreSettings = async (req, res) => {
    try {
        const userId = req.user.id;

        // Query untuk mengambil data dari tabel 'stores' dan 'store_about_pages' sekaligus
        const sql = `
            SELECT 
                s.name, s.description, s.business_phone, s.profile_image_url, s.background_image_url,
                s.is_on_holiday, s.holiday_start_date, s.holiday_end_date, s.show_phone_number,
                ap.title AS about_title, ap.thumbnail_url AS about_thumbnail_url, ap.content AS about_content
            FROM stores s
            LEFT JOIN store_about_pages ap ON s.id = ap.store_id
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

// Fungsi baru untuk mengupdate pengaturan umum (libur, dll)
exports.updateStoreSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const { is_on_holiday, holiday_start_date, holiday_end_date, show_phone_number } = req.body;

        // Ambil store_id berdasarkan user_id
        const [stores] = await db.execute('SELECT id FROM stores WHERE user_id = ?', [userId]);
        if (stores.length === 0) {
            return res.status(404).json({ message: "Toko tidak ditemukan." });
        }
        const storeId = stores[0].id;
        
        // Validasi sederhana: jika is_on_holiday=true, tanggal harus ada
        if (is_on_holiday && (!holiday_start_date || !holiday_end_date)) {
            return res.status(400).json({ message: "Tanggal mulai dan akhir libur wajib diisi saat mode libur aktif." });
        }

        const sql = `
            UPDATE stores SET 
                is_on_holiday = ?, 
                holiday_start_date = ?, 
                holiday_end_date = ?, 
                show_phone_number = ?
            WHERE id = ?
        `;
        
        // Jika mode libur tidak aktif, paksa tanggal menjadi NULL
        const params = [
            is_on_holiday,
            is_on_holiday ? holiday_start_date : null,
            is_on_holiday ? holiday_end_date : null,
            show_phone_number,
            storeId
        ];
        
        await db.execute(sql, params);

        res.status(200).json({ message: "Pengaturan toko berhasil diperbarui." });

    } catch (error) {
        console.error("Error saat update pengaturan toko:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};


// Fungsi baru untuk membuat atau mengupdate halaman "Tentang Toko"
exports.createOrUpdateAboutPage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, content } = req.body;

        // 1. Validasi Input
        if (!title || !content) {
            return res.status(400).json({ message: "Judul dan Isi Konten wajib diisi." });
        }
        
        // 2. Dapatkan ID Toko
        const [stores] = await db.execute('SELECT id FROM stores WHERE user_id = ?', [userId]);
        if (stores.length === 0) {
            return res.status(404).json({ message: "Toko tidak ditemukan." });
        }
        const storeId = stores[0].id;

        // 3. Cek apakah halaman "Tentang" sudah ada
        const [aboutPages] = await db.execute('SELECT id, thumbnail_url FROM store_about_pages WHERE store_id = ?', [storeId]);
        const aboutPageExists = aboutPages.length > 0;

        // 4. Tentukan URL thumbnail
        let thumbnailUrl;
        if (req.file) { // Jika ada file baru yang di-upload
            thumbnailUrl = `/uploads/about_thumbnails/${req.file.filename}`;
        } else if (aboutPageExists) { // Jika tidak ada file baru, pakai yang lama
            thumbnailUrl = aboutPages[0].thumbnail_url;
        } else { // Jika tidak ada file baru dan ini entri baru, maka error
            return res.status(400).json({ message: "Thumbnail wajib di-upload." });
        }

        // 5. Lakukan Operasi INSERT atau UPDATE (Logika "UPSERT")
        if (aboutPageExists) {
            // UPDATE data yang ada
            const sql = `
                UPDATE store_about_pages SET title = ?, content = ?, thumbnail_url = ? 
                WHERE store_id = ?
            `;
            await db.execute(sql, [title, content, thumbnailUrl, storeId]);
            res.status(200).json({ message: "Halaman 'Tentang Toko' berhasil diperbarui." });
        } else {
            // INSERT data baru
            const sql = `
                INSERT INTO store_about_pages (store_id, title, content, thumbnail_url) 
                VALUES (?, ?, ?, ?)
            `;
            await db.execute(sql, [storeId, title, content, thumbnailUrl]);
            res.status(201).json({ message: "Halaman 'Tentang Toko' berhasil dibuat." });
        }
    } catch (error) {
        console.error("Error saat update halaman 'Tentang Toko':", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};