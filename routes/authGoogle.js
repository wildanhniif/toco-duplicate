const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

// @route   GET api/auth/google
// @desc    Memulai proses autentikasi Google
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'], // Data yang kita minta dari Google
    session: false
}));

// @route   GET api/auth/google/callback
// @desc    URL yang dituju Google setelah user memberikan izin
router.get('/google/callback', passport.authenticate('google', {
    failureRedirect: '/login', // Arahkan ke halaman login frontend jika gagal
    session: false
}), (req, res) => {
    // req.user berasal dari callback 'done' di passport.js
    const user = req.user;

    // Logika sesuai permintaan:
    // Jika user baru (ditandai dengan flag is_new), kirim data profil ke frontend
    if (user.is_new) {
        return res.status(409).json({
            message: "User not registered. Please complete registration.",
            // Kita kirim data ini agar frontend bisa pre-fill form registrasi
            userData: {
                fullName: user.full_name,
                email: user.email,
                googleId: user.google_id
            }
        });
    }

    // Jika user sudah ada, buat JWT dan kirim ke frontend
    const payload = {
        user: {
            id: user.id,
            name: user.full_name
        }
    };

    jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '1h' },
        (err, token) => {
            if (err) throw err;
            // Kirim token ke frontend. Frontend bisa menyimpannya
            // dan redirect ke halaman dashboard.
            // Dalam prakteknya, seringkali token dikirim via query param
            // res.redirect(`http://yourfrontend.com/auth/callback?token=${token}`);
            // atau dikirim sebagai JSON
            res.json({
                message: "Login with Google successful!",
                token: token
            });
        }
    );
});

module.exports = router;