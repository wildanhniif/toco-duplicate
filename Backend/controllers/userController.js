const pool = require('../config/database');

/**
 * Mendapatkan profil pengguna yang sedang login.
 * Data pengguna didapatkan dari `req.user` yang diisi oleh middleware `protect`.
 */
const getUserProfile = async (req, res) => {
    try {
        // ID pengguna diambil dari token yang sudah diverifikasi oleh middleware
        const userId = req.user.user_id;

        // Ambil data terbaru dari database (tanpa password_hash, dengan field baru)
        const [users] = await pool.query(
            `SELECT user_id AS id, full_name, email, phone_number, role, is_verified, is_active, 
                    last_login_at, email_verified_at, created_at, updated_at 
             FROM users 
             WHERE user_id = ? AND deleted_at IS NULL`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(users[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getUserProfile,
};