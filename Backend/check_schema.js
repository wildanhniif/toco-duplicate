const db = require('./config/database');

async function checkSchema() {
  try {
    const [rows] = await db.query("SHOW COLUMNS FROM products LIKE 'view_count'");
    if (rows.length > 0) {
      console.log("✅ view_count exists");
    } else {
      console.log("❌ view_count MISSING");
      // Add it if missing
      await db.query("ALTER TABLE products ADD COLUMN view_count INT DEFAULT 0");
      console.log("✅ Added view_count column");
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
