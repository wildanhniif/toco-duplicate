// controllers/addressController.js

const pool = require('../config/database');
const Joi = require('joi');

// Skema validasi menggunakan Joi
const addressSchema = Joi.object({
    user_id: Joi.number().integer().required(),
    label: Joi.string().min(3).max(50).required(),
    recipient_name: Joi.string().min(3).max(100).required(),
    phone_number: Joi.string().min(10).max(20).required(),
    latitude: Joi.number().optional().allow(null),
    longitude: Joi.number().optional().allow(null),
    map_address: Joi.string().optional().allow(null, ''),
    address_detail: Joi.string().optional().allow(null, ''),
    postal_code: Joi.string().max(10).required(),
    province: Joi.string().required(),
    city: Joi.string().required(),
    district: Joi.string().required(),
    sub_district: Joi.string().required(),
    is_primary: Joi.boolean().required()
});

exports.createAddress = async (req, res) => {
    // 1. Validasi Input
    const { error, value } = addressSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            status: 'fail',
            message: error.details[0].message
        });
    }

    const { user_id, is_primary, ...addressData } = value;
    const connection = await pool.getConnection(); // Dapatkan koneksi dari pool

    try {
        await connection.beginTransaction(); // Mulai transaksi

        // 2. Logika "Jadikan Alamat Utama"
        // Jika alamat baru ini mau dijadikan utama, maka alamat utama sebelumnya (jika ada)
        // statusnya diubah menjadi tidak utama.
        if (is_primary === true) {
            const updatePrimarySql = 'UPDATE user_addresses SET is_primary = false WHERE user_id = ?';
            await connection.execute(updatePrimarySql, [user_id]);
        }

        // 3. Simpan Alamat Baru
        const insertSql = `
            INSERT INTO user_addresses (user_id, is_primary, label, recipient_name, phone_number, latitude, longitude, map_address, address_detail, postal_code, province, city, district, sub_district)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await connection.execute(insertSql, [
            user_id,
            is_primary,
            addressData.label,
            addressData.recipient_name,
            addressData.phone_number,
            addressData.latitude,
            addressData.longitude,
            addressData.map_address,
            addressData.address_detail,
            addressData.postal_code,
            addressData.province,
            addressData.city,
            addressData.district,
            addressData.sub_district
        ]);
        
        await connection.commit(); // Commit transaksi jika semua berhasil

        // 4. Kirim Respon Sukses
        res.status(201).json({
            status: 'success',
            message: 'Alamat berhasil ditambahkan',
            data: {
                addressId: result.insertId
            }
        });

    } catch (dbError) {
        await connection.rollback(); // Rollback jika ada error
        console.error('Database error:', dbError);
        res.status(500).json({
            status: 'error',
            message: 'Terjadi kesalahan pada server'
        });
    } finally {
        if (connection) {
            connection.release(); // Selalu lepaskan koneksi
        }
    }
};