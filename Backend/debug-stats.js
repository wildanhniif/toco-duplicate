
const mysql = require('mysql2/promise');
require('dotenv').config();

const debugStats = async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log("Checking users table...");
    // Check if table exists and show structure
    const [columns] = await pool.query(`SHOW COLUMNS FROM users`);
    console.log("Columns:", columns.map(c => c.Field));

    // Simple count
    const [allUsers] = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log("Total users (simple count):", allUsers[0].count);

    // Check with deleted_at condition
    // First check if deleted_at exists
    const hasDeletedAt = columns.some(c => c.Field === 'deleted_at');
    if (hasDeletedAt) {
        const [validUsers] = await pool.query('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL');
        console.log("Total users (deleted_at IS NULL):", validUsers[0].count);
    } else {
        console.log("Column 'deleted_at' does NOT exist!");
    }

    // Check sellers
    const [sellers] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'seller'");
    console.log("Total sellers:", sellers[0].count);

    console.log("Checking orders table...");
    const [orderColumns] = await pool.query(`SHOW COLUMNS FROM orders`);
    console.log("Order Columns:", orderColumns.map(c => c.Field));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
};

debugStats();
