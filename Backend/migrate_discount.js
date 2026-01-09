const db = require('./config/database');

async function runMigration() {
  try {
    console.log("Checking if discount_percentage column exists...");
    const [columns] = await db.query("SHOW COLUMNS FROM products LIKE 'discount_percentage'");
    
    if (columns.length === 0) {
      console.log("Column not found. Adding discount_percentage...");
      await db.query("ALTER TABLE products ADD COLUMN discount_percentage DECIMAL(5,2) DEFAULT 0 AFTER price");
      console.log("Migration successful: discount_percentage added.");
    } else {
      console.log("Column discount_percentage already exists. Skipping.");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
