const db = require('./config/database');

async function checkSkuSchema() {
  try {
    const [rows] = await db.query("SHOW COLUMNS FROM product_skus LIKE 'image_url'");
    if (rows.length > 0) {
      console.log("✅ image_url exists in product_skus");
    } else {
      console.log("❌ image_url MISSING in product_skus");
      // Add it if missing
      await db.query("ALTER TABLE product_skus ADD COLUMN image_url VARCHAR(255) DEFAULT NULL");
       console.log("✅ Added image_url column to product_skus");
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSkuSchema();
