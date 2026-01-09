const db = require('./config/database');

async function checkVariantSchema() {
  try {
    const [rows] = await db.query("SHOW COLUMNS FROM product_variants LIKE 'image_url'");
    if (rows.length > 0) {
      console.log("✅ image_url exists in product_variants");
    } else {
      console.log("❌ image_url MISSING in product_variants");
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkVariantSchema();
