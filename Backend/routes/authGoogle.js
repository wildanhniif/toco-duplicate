const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");

// @route   GET api/auth/google
// @desc    Memulai proses autentikasi Google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"], // Data yang kita minta dari Google
    session: false,
  })
);

// @route   GET api/auth/google/callback
// @desc    URL yang dituju Google setelah user memberikan izin
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/login`
      : "/login", // Arahkan ke halaman login frontend jika gagal
    session: false,
  }),
  async (req, res) => {
    // req.user berasal dari callback 'done' di passport.js
    const user = req.user;
    const frontendBase = process.env.FRONTEND_URL || "http://localhost:3000";

    // Ambil data lengkap dari database termasuk role dan store_id
    const db = require("../config/database");
    const connection = await db.getConnection();

    try {
      const [userDetails] = await connection.execute(
        `SELECT u.user_id, u.full_name, u.role, s.store_id 
         FROM users u 
         LEFT JOIN stores s ON u.user_id = s.user_id 
         WHERE u.user_id = ?`,
        [user.user_id || user.id]
      );

      if (userDetails.length > 0) {
        const fullUserData = userDetails[0];

        // Samakan struktur payload dengan login biasa (authLogin.js)
        const payload = {
          user_id: fullUserData.user_id,
          name: fullUserData.full_name,
          role: fullUserData.role || "customer",
          store_id: fullUserData.store_id || null,
        };

        jwt.sign(
          payload,
          process.env.JWT_SECRET,
          { expiresIn: "1d" },
          (err, token) => {
            connection.release();

            if (err) {
              console.error(err);
              return res.redirect(`${frontendBase}/login?error=oauth_failed`);
            }

            // Kirim token ke frontend
            const redirectUrl = new URL(`${frontendBase}/google/callback`);
            redirectUrl.searchParams.set("token", token);
            redirectUrl.searchParams.set("name", fullUserData.full_name || "");
            res.redirect(redirectUrl.toString());
          }
        );
      } else {
        connection.release();
        return res.redirect(`${frontendBase}/login?error=user_not_found`);
      }
    } catch (error) {
      connection.release();
      console.error("Error fetching user details:", error);
      return res.redirect(`${frontendBase}/login?error=server_error`);
    }
  }
);

module.exports = router;
