// middleware/adminMiddleware.js

const isAdmin = (req, res, next) => {
    // TAMBAHKAN CONSOLE.LOG INI UNTUK MELIHAT ISI TOKEN
    console.log('User data from token:', req.user);

    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden. Admin access required.' });
    }
};

module.exports = { isAdmin };