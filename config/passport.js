const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./database'); // Sesuaikan path jika perlu
require('dotenv').config();

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/api/auth/google/callback', // Harus sama dengan di Google Console
            proxy: true
        },
        async (accessToken, refreshToken, profile, done) => {
            // Callback ini berjalan setelah user berhasil login di Google
            const googleId = profile.id;
            const email = profile.emails[0].value;
            const fullName = profile.displayName;

            try {
                // 1. Cek apakah user sudah ada berdasarkan google_id
                let [users] = await pool.query("SELECT * FROM users WHERE google_id = ?", [googleId]);

                if (users.length > 0) {
                    // User ditemukan, langsung login
                    return done(null, users[0]);
                }

                // 2. Jika tidak ada, cek berdasarkan email (mungkin user pernah daftar manual)
                [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

                if (users.length > 0) {
                    // User ada tapi belum terhubung dengan Google. Kita update google_id-nya.
                    await pool.query("UPDATE users SET google_id = ? WHERE email = ?", [googleId, email]);
                    const updatedUser = { ...users[0], google_id: googleId };
                    return done(null, updatedUser);
                }

                // 3. Jika user benar-benar baru
                const newUser = {
                    google_id: googleId,
                    email: email,
                    full_name: fullName,
                    is_new: true // Kita tambahkan flag ini untuk logika di router
                };
                return done(null, newUser);

            } catch (error) {
                return done(error, false);
            }
        }
    )
);