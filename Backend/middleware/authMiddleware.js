const jwt = require("jsonwebtoken");
require("dotenv").config();
const pool = require("../config/database");

/**
 * Middleware untuk memverifikasi token JWT.
 * Jika token valid, data user akan ditambahkan ke `req.user`.
 * Jika tidak, akan mengirim respon error.
 */
const protect = async (req, res, next) => {
  let token;

  // Cek apakah ada header 'Authorization' dan dimulai dengan 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Ambil token dari header
      token = req.headers.authorization.split(" ")[1];

      // Validasi token tidak kosong
      if (!token || token.trim() === "") {
        return res.status(401).json({ message: "User tidak terautentikasi." });
      }

      // Verifikasi token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Verify user exists in database and get store_id
      const [rows] = await pool.query(
        `SELECT u.user_id, u.role, u.is_active, s.store_id 
         FROM users u 
         LEFT JOIN stores s ON u.user_id = s.user_id 
         WHERE u.user_id = ?`,
        [decoded.user_id]
      );

      if (rows.length === 0) {
        return res.status(401).json({ message: "User tidak ditemukan. Token tidak valid." });
      }

      // Check if user is active
      if (!rows[0].is_active) {
        return res.status(401).json({ message: "Akun dinonaktifkan." });
      }

      // Tambahkan payload ke req.user
      req.user = rows[0];

      // Lanjutkan ke controller berikutnya
      next();
    } catch (error) {
      // Log errors only in development
      if (process.env.NODE_ENV === 'development') {
        console.error("JWT Error:", error.message);
      }
      if (error.name === "JsonWebTokenError") {
        return res
          .status(401)
          .json({ message: "Token tidak valid. Silakan login kembali." });
      }
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Token telah kedaluwarsa. Silakan login kembali." });
      }
      res.status(401).json({ message: "User tidak terautentikasi." });
    }
  } else {
    // Jika tidak ada token
    res.status(401).json({ message: "User tidak terautentikasi." });
  }
};

module.exports = { protect };
