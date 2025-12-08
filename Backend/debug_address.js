// Debug script untuk cek alamat di database
require("dotenv").config();
const mysql = require("mysql2/promise");

async function debug() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME,
  });

  console.log("\n=== STORE ADDRESS (store_id=34) ===");
  const [stores] = await db.query(
    "SELECT store_id, province, city, district, subdistrict, postal_code FROM stores WHERE store_id = 34"
  );
  console.log(stores[0] || "NOT FOUND");

  console.log("\n=== USER ADDRESSES ===");
  const [addresses] = await db.query(
    "SELECT address_id, province, city, district, subdistrict, postal_code FROM user_addresses LIMIT 5"
  );
  console.log(addresses);

  console.log("\n=== CART dengan shipping_address_id ===");
  const [carts] = await db.query(
    "SELECT cart_id, user_id, shipping_address_id FROM carts WHERE shipping_address_id IS NOT NULL LIMIT 5"
  );
  console.log(carts);

  await db.end();
}

debug().catch(console.error);
