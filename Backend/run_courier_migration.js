/**
 * Run courier codes migration
 * Usage: node run_courier_migration.js
 */

require("dotenv").config();
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Running courier codes migration...\n");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "digi_store",
    multipleStatements: true,
  });

  try {
    // Check if tables exist
    const [tables] = await connection.query("SHOW TABLES LIKE '%courier%'");
    if (tables.length === 0) {
      console.log(
        "⚠️  Courier tables not found. Running full shipping migration first...\n"
      );

      const shippingSql = fs.readFileSync(
        path.join(__dirname, "migrations", "create_shipping_tables_FIXED.sql"),
        "utf8"
      );
      await connection.query(shippingSql);
      console.log("✅ Shipping tables created\n");
    }

    // Run the fix migration
    const fixSql = fs.readFileSync(
      path.join(__dirname, "migrations", "fix_courier_codes.sql"),
      "utf8"
    );
    await connection.query(fixSql);
    console.log("✅ Courier codes fixed to lowercase\n");

    // Verify data
    const [services] = await connection.query(
      "SELECT code, name FROM courier_services ORDER BY code"
    );
    console.log("📦 Courier Services:");
    services.forEach((s) => console.log(`   - ${s.code}: ${s.name}`));

    const [types] = await connection.query(`
      SELECT cs.code as courier, cst.code as service_code, cst.name 
      FROM courier_service_types cst
      JOIN courier_services cs ON cs.id = cst.courier_service_id
      ORDER BY cs.code, cst.code
    `);
    console.log("\n📋 Service Types:");
    let lastCourier = "";
    types.forEach((t) => {
      if (t.courier !== lastCourier) {
        console.log(`\n   ${t.courier.toUpperCase()}:`);
        lastCourier = t.courier;
      }
      console.log(`     - ${t.service_code}: ${t.name}`);
    });

    console.log("\n✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Error running migration:", error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

main();
