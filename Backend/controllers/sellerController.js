// controllers/sellerController.js

const db = require('../config/database');
const slugify = require('../utils/slugify');

exports.registerSeller = async (req, res) => {
    const userId = req.user.user_id;

    if (!userId) {
        return res.status(401).json({ message: "User tidak terautentikasi." });
    }

    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        // Cek apakah user sudah menjadi seller
        const [users] = await connection.execute(
            'SELECT role, store_id FROM users u LEFT JOIN stores s ON u.user_id = s.user_id WHERE u.user_id = ?', 
            [userId]
        );
        
        if (users.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "User tidak ditemukan." });
        }
        
        const user = users[0];
        
        if (user.role === 'seller') {
            await connection.rollback();
            return res.status(409).json({ 
                message: "Anda sudah terdaftar sebagai seller.",
                store_id: user.store_id
            });
        }

        // Update role user menjadi 'seller'
        await connection.execute(
            'UPDATE users SET role = ? WHERE user_id = ?', 
            ['seller', userId]
        );

        // Buat entri toko baru
        const defaultStoreName = `Toko Baru #${userId}`;
        const defaultSlug = `toko-baru-${userId}-${Date.now()}`;
        
        const [storeResult] = await connection.execute(
            'INSERT INTO stores (user_id, name, slug, is_active) VALUES (?, ?, ?, ?)',
            [userId, defaultStoreName, defaultSlug, false]
        );

        await connection.commit();

        res.status(201).json({
            message: "Selamat! Anda berhasil terdaftar sebagai seller. Silakan lengkapi informasi toko Anda.",
            store_id: storeResult.insertId,
            store: {
                name: defaultStoreName,
                slug: defaultSlug,
                is_active: false
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error("Error saat registrasi seller:", error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "Toko sudah ada untuk user ini." });
        }
        
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    } finally {
        connection.release();
    }
};

exports.updateStoreDetails = async (req, res) => {
    const userId = req.user.user_id;
    
    if (!userId) {
        return res.status(401).json({ message: "User tidak terautentikasi." });
    }

    const {
        name,
        description,
        business_phone,
        show_phone_number,
        address_detail,
        postal_code,
        province,
        city,
        district,
        sub_district,
        province_id,
        city_id,
        district_id,
        sub_district_id,
        latitude,
        longitude,
        use_cloudflare
    } = req.body;

    // Validasi data dasar
    if (!name || name.trim().length === 0) {
        return res.status(400).json({ message: "Nama toko wajib diisi." });
    }

    if (name.length > 100) {
        return res.status(400).json({ message: "Nama toko maksimal 100 karakter." });
    }

    // Generate slug dari nama toko
    const slug = slugify(name.trim());

    // Dapatkan path file gambar dari multer
    const profileImageUrl = req.files?.profile_image ? 
        `/uploads/stores/${req.files.profile_image[0].filename}` : undefined;
    const backgroundImageUrl = req.files?.background_image ? 
        `/uploads/stores/${req.files.background_image[0].filename}` : undefined;

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Cek apakah user memiliki toko
        const [stores] = await connection.execute(
            'SELECT store_id, slug FROM stores WHERE user_id = ?', 
            [userId]
        );

        if (stores.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Toko tidak ditemukan. Silakan daftar sebagai seller terlebih dahulu." });
        }

        // Cek duplikasi slug (kecuali untuk toko sendiri)
        const [existingSlug] = await connection.execute(
            'SELECT store_id FROM stores WHERE slug = ? AND user_id != ?',
            [slug, userId]
        );

        if (existingSlug.length > 0) {
            await connection.rollback();
            return res.status(409).json({ message: "Nama toko sudah digunakan. Silakan gunakan nama lain." });
        }

        // Bangun query UPDATE secara dinamis
        const fieldsToUpdate = [];
        const values = [];

        const addField = (field, value) => {
            if (value !== undefined && value !== null && value !== '') {
                fieldsToUpdate.push(`${field} = ?`);
                values.push(value);
            }
        };

        addField('name', name.trim());
        addField('slug', slug);
        addField('description', description?.trim());
        addField('business_phone', business_phone?.trim());
        addField('show_phone_number', show_phone_number !== undefined ? Boolean(show_phone_number) : undefined);
        addField('address_detail', address_detail?.trim());
        addField('postal_code', postal_code?.trim());
        addField('province', province?.trim());
        addField('city', city?.trim());
        addField('district', district?.trim());
        addField('sub_district', sub_district?.trim());
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
        addField('updated_at', new Date());

        if (fieldsToUpdate.length === 0) {
            await connection.rollback();
            return res.status(400).json({ message: "Tidak ada data untuk diupdate." });
        }
        
        values.push(userId);
        const sql = `UPDATE stores SET ${fieldsToUpdate.join(', ')} WHERE user_id = ?`;
        const [result] = await connection.execute(sql, values);
        
        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Toko tidak ditemukan atau Anda tidak memiliki izin." });
        }

        await connection.commit();

        res.status(200).json({
            message: "Informasi toko berhasil diperbarui.",
            store: {
                name: name.trim(),
                slug: slug,
                is_active: true
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error("Error saat update toko:", error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "Nama toko sudah digunakan. Silakan gunakan nama lain." });
        }
        
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    } finally {
        connection.release();
    }
};

// Get store details for current user
exports.getMyStore = async (req, res) => {
    const userId = req.user.user_id;
    
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
            store: stores[0]
        });

    } catch (error) {
        console.error("Error saat mengambil data toko:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};