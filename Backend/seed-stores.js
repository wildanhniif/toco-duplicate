require('dotenv').config();
const db = require('./config/database');

async function seedStores() {
  try {
    // 1. Get a user
    const [users] = await db.query("SELECT user_id FROM users LIMIT 1");
    if (users.length === 0) {
      console.error("No users found to attach stores to!");
      process.exit(1);
    }
    // 2. Stores to add
    const stores = [
      { name: "Toko iPhone", slug: "toko-iphone-unique", city: "Kota Bandung", email: "store1@test.com" },
      { name: "Agung Iphone", slug: "agung-iphone-unique", city: "Kabupaten Bogor", email: "store2@test.com" },
      { name: "Cahaya Iphone", slug: "cahaya-iphone-unique", city: "Kota Palembang", email: "store3@test.com" }
    ];

    for (const store of stores) {
      // Check if store exists
      const [exists] = await db.query("SELECT store_id FROM stores WHERE slug = ?", [store.slug]);
      if (exists.length > 0) {
        console.log(`Store ${store.name} already exists.`);
        continue;
      }

      // Create dummy user for this store (check if exists first)
      let storeUserId;
      const [existingUser] = await db.query("SELECT user_id FROM users WHERE email = ?", [store.email]);
      
      if (existingUser.length > 0) {
          storeUserId = existingUser[0].user_id;
      } else {
          // Insert User (Correct schema: full_name, password_hash, phone_number)
           const randomPhone = '08' + Math.floor(100000000 + Math.random() * 900000000);
           const [uRes] = await db.query(
              "INSERT INTO users (email, password_hash, full_name, phone_number, role, is_active, is_verified, created_at) VALUES (?, 'hash_dummy', ?, ?, 'seller', 1, 1, NOW())",
              [store.email, 'User ' + store.name, randomPhone]
           );
           storeUserId = uRes.insertId;
      }

      // Check if this user already has a store (to avoid duplicate entry error)
      const [userStore] = await db.query("SELECT store_id FROM stores WHERE user_id = ?", [storeUserId]);
      if (userStore.length > 0) {
          console.log(`User ${store.email} already has a store. Skipping.`);
          continue;
      }

      // Insert Store
      const sql = `
        INSERT INTO stores (
          user_id, name, slug, city, is_active, is_verified, 
          description, address_line, province, district, subdistrict, 
          business_phone, created_at
        ) VALUES (?, ?, ?, ?, 1, 1, 'Toko mock untuk testing', 'Jalan Test', 'Jawa Barat', 'District Test', 'Subdistrict Test', '08123456789', NOW())
      `;
      
      await db.query(sql, [storeUserId, store.name, store.slug, store.city]);
      console.log(`Inserted ${store.name}`);
    }

    console.log("Seeding done!");
    process.exit(0);

  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seedStores();
