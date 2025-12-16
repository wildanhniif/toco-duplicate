const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * Middleware untuk memverifikasi token JWT.
 * Jika token valid, data user akan ditambahkan ke `req.user`.
 * Jika tidak, akan mengirim respon error.
 */
const protect = (req, res, next) => {
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

      // Tambahkan payload ke req.user
      req.user = decoded;

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
