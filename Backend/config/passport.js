const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const pool = require("./database"); // Sesuaikan path jika perlu
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
require("dotenv").config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback", // Harus sama dengan di Google Console
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      // Callback ini berjalan setelah user berhasil login di Google
      const googleId = profile.id;
      const email = profile.emails[0].value;
      const fullName = profile.displayName;

      try {
        // 1. Cek apakah user sudah ada berdasarkan google_id
        let [users] = await pool.query(
          "SELECT * FROM users WHERE google_id = ?",
          [googleId]
        );

        if (users.length > 0) {
          // User ditemukan, langsung login
          return done(null, users[0]);
        }

        // 2. Jika tidak ada, cek berdasarkan email (mungkin user pernah daftar manual)
        [users] = await pool.query("SELECT * FROM users WHERE email = ?", [
          email,
        ]);

        if (users.length > 0) {
          // User ada tapi belum terhubung dengan Google. Kita update google_id-nya.
          await pool.query("UPDATE users SET google_id = ? WHERE email = ?", [
            googleId,
            email,
          ]);
          const updatedUser = { ...users[0], google_id: googleId };
          return done(null, updatedUser);
        }

        // 3. Jika user benar-benar baru -> buat akun otomatis di DB
        const googleIdStr = String(googleId || "");
        const generatedPhone = `G${googleIdStr.slice(0, 19)}`; // phone dummy unik berbasis google_id
        const randomPassword = crypto.randomBytes(16).toString("hex");
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(randomPassword, salt);

        const insertSql = `
                    INSERT INTO users
                        (full_name, phone_number, email, password_hash, role, is_verified, is_active, google_id, email_verified_at)
                    VALUES (?, ?, ?, ?, 'customer', 1, 1, ?, NOW())
                `;
        const values = [
          fullName,
          generatedPhone,
          email,
          passwordHash,
          googleIdStr,
        ];
        const [result] = await pool.query(insertSql, values);

        const createdUser = {
          user_id: result.insertId,
          full_name: fullName,
          phone_number: generatedPhone,
          email,
          role: "customer",
          is_verified: 1,
          is_active: 1,
          google_id: googleIdStr,
        };
        return done(null, createdUser);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);
