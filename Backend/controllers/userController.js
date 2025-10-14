const pool = require('../config/database');

/**
 * Mendapatkan profil pengguna yang sedang login.
 * Data pengguna didapatkan dari `req.user` yang diisi oleh middleware `protect`.
 */
const getUserProfile = async (req, res) => {
    try {
        // ID pengguna diambil dari token yang sudah diverifikasi oleh middleware
        const userId = req.user.id;

        // Ambil data terbaru dari database (tanpa password)
        const [users] = await pool.query(
            "SELECT id, full_name, email, phone_number, created_at FROM users WHERE id = ?",
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