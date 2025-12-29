const pool = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); // Kita gunakan JWT untuk token verifikasi
const { validationResult } = require("express-validator");
const { sendVerificationEmail } = require("../utils/mailer"); // <-- Impor service email kita

// ... fungsi register yang sudah ada, kita modifikasi isinya

const register = async (req, res) => {
  // Validation sudah dilakukan di route dengan validateRegister middleware
  const errors = validationResult(req);
  console.log("Register Request Body:", req.body); // DEBUG LOG
  if (!errors.isEmpty()) {
    console.log("Validation Errors:", errors.array()); // DEBUG LOG
    return res.status(400).json({ errors: errors.array() });
  }

  // Password validation is handled by validateRegister middleware

  try {
    const { fullName, phoneNumber, email, password, confirmPassword, googleId } = req.body; 

    // Server-side password match validation to allow simultaneous error reporting
    const validationErrors = [];
    
    if (password !== confirmPassword) {
      validationErrors.push({
        path: "confirmPassword",
        msg: "Password dan Konfirmasi Password tidak cocok."
      });
    }

    // Check for existing user with detailed error reporting (now includes fullName)
    const [existingUsers] = await pool.query(
      "SELECT full_name, email, phone_number FROM users WHERE email = ? OR phone_number = ? OR full_name = ?",
      [email, phoneNumber, fullName]
    );

    if (existingUsers.length > 0) {
      // Check if email exists
      const emailExists = existingUsers.some(user => user.email === email);
      if (emailExists) {
        validationErrors.push({
          path: "email",
          msg: "Email sudah terdaftar. Gunakan email lain."
        });
      }

      // Check if phone number exists
      const phoneExists = existingUsers.some(user => user.phone_number === phoneNumber);
      if (phoneExists) {
        validationErrors.push({
          path: "phoneNumber",
          msg: "Nomor telepon sudah terdaftar. Gunakan nomor lain."
        });
      }
      
      // Check if full name exists (Requested by user)
      const nameExists = existingUsers.some(user => user.full_name === fullName);
      if (nameExists) {
        validationErrors.push({
          path: "fullName",
          msg: "Nama Lengkap sudah terdaftar. Gunakan nama lain."
        });
      }
    }

    // Return all collected errors if any
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Updated for new schema
    const sqlQuery = `
            INSERT INTO users
                (full_name, phone_number, email, password_hash, role, is_verified, is_active, google_id) 
            VALUES (?, ?, ?, ?, 'customer', 0, 1, ?)
        `;
    const values = [
      fullName,
      phoneNumber,
      email,
      hashedPassword,
      googleId || null,
    ];

    const [result] = await pool.query(sqlQuery, values);
    const userId = result.insertId;

    // Buat token verifikasi menggunakan JWT
    const verificationToken = jwt.sign(
      { user_id: userId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" } // Token berlaku 1 jam
    );

    // Kirim email verifikasi
    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({
      message: "Registrasi berhasil. Silakan cek email Anda untuk verifikasi.",
      user_id: userId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};

// Buat fungsi baru untuk handle verifikasi
const verifyEmail = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Token tidak disediakan." });
  }

  try {
    // Verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.user_id;

    // Update status verifikasi user di database - use email_verified_at
    await pool.query(
      "UPDATE users SET is_verified = 1, email_verified_at = NOW() WHERE user_id = ?",
      [userId]
    );

    res
      .status(200)
      .json({ message: "Akun berhasil diverifikasi! Silakan login." });
  } catch (error) {
    // Tangani jika token tidak valid atau kedaluwarsa
    res
      .status(401)
      .json({ message: "Token tidak valid atau sudah kedaluwarsa." });
  }
};

module.exports = {
  register,
  verifyEmail, // <-- Ekspor fungsi baru
};
