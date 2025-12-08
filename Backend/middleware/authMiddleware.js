const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * Middleware untuk memverifikasi token JWT.
 * Jika token valid, data user akan ditambahkan ke `req.user`.
 * Jika tidak, akan mengirim respon error.
 */
const protect = (req, res, next) => {
  let token;

  // Debug logging
  console.log("=== Auth Middleware Debug ===");
  console.log("Authorization header:", req.headers.authorization);

  // Cek apakah ada header 'Authorization' dan dimulai dengan 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Ambil token dari header
      token = req.headers.authorization.split(" ")[1];
      console.log(
        "Extracted token:",
        token ? `${token.substring(0, 20)}...` : "null"
      );

      // Validasi token tidak kosong
      if (!token || token.trim() === "") {
        console.error("Token is empty or whitespace only");
        return res.status(401).json({ message: "User tidak terautentikasi." });
      }

      // Debug JWT_SECRET
      console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
      console.log(
        "JWT_SECRET length:",
        process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0
      );

      // Verifikasi token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded token payload:", decoded);

      // Tambahkan payload ke req.user
      req.user = decoded;

      // Lanjutkan ke controller berikutnya
      next();
    } catch (error) {
      console.error("JWT Error:", error.message);
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
    console.log("No authorization header or does not start with Bearer");
    // Jika tidak ada token
    res.status(401).json({ message: "User tidak terautentikasi." });
  }
};

module.exports = { protect };
