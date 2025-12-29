
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createAdmin = async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  const email = 'admin@example.com';
  const password = 'password123';
  const fullName = 'Admin User';
  const phoneNumber = '081234567890';

  try {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Check if admin exists
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
      console.log('Admin user already exists.');
      process.exit(0);
    }

    // Insert admin
    await pool.query(
      `INSERT INTO users (full_name, email, password_hash, phone_number, role, is_active, is_verified, email_verified_at) 
       VALUES (?, ?, ?, ?, 'admin', 1, 1, NOW())`,
      [fullName, email, passwordHash, phoneNumber]
    );

    console.log('Admin user created successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    pool.end();
  }
};

createAdmin();
