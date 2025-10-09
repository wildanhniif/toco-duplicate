const express = require('express');
const cors = require('cors');
const passport = require('passport');
require('dotenv').config();
require('./config/passport');


// Impor kedua file router
const authRegisterRoutes = require('./routes/authRegister');
const authLoginRoutes = require('./routes/authLogin');
const authGoogle = require('./routes/authGoogle');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRegisterRoutes);
app.use('/api/auth', authLoginRoutes);
app.use('/api/auth', authGoogle);

// Jalankan Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));