const express = require('express');
const cors = require('cors');
const passport = require('passport');
require('dotenv').config();
require('./config/passport');


// Impor kedua file 
const userRoutes = require('./routes/userRoutes');
const authRegisterRoutes = require('./routes/authRegister');
const authLoginRoutes = require('./routes/authLogin');
const authGoogle = require('./routes/authGoogle');
const addressRoutes = require('./routes/addressRoutes');
const wilayahRoutes = require('./routes/wilayahRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/productRoutes');
const optionsRoutes = require('./routes/optionsRoutes');
const cartRoutes = require('./routes/cartRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/users', userRoutes); // <-- Tambahkan ini
app.use('/api/auth', authRegisterRoutes);
app.use('/api/auth', authLoginRoutes);
app.use('/api/auth', authGoogle);
app.use('/api/addresses', addressRoutes);
app.use('/api/wilayah', wilayahRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/options', optionsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
// Serve static uploads (product/store images)
app.use('/uploads', express.static('uploads'));

// Jalankan Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));