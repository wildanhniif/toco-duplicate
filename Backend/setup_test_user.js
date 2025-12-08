const db = require("./config/database");

async function setupTestUser() {
  try {
    const connection = await db.getConnection();
    console.log("=== SETTING UP TEST USER ===");

    // Check existing users
    const [users] = await connection.execute(
      "SELECT user_id, full_name, email, role, google_id FROM users ORDER BY user_id DESC LIMIT 5"
    );
    console.log("Recent users:", users);

    // If no users with Google ID, create one
    const googleUsers = users.filter((u) => u.google_id);
    if (googleUsers.length === 0) {
      console.log("Creating test user with Google ID...");
      const [result] = await connection.execute(
        "INSERT INTO users (full_name, email, password_hash, role, is_verified, is_active, google_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          "Test Google User",
          "testgoogle@example.com",
          "dummyhash",
          "customer",
          1,
          1,
          "123456789",
        ]
      );

      const newUserId = result.insertId;
      console.log("Created test user with ID:", newUserId);

      // Also create a store for this user to test the role update logic
      const [storeResult] = await connection.execute(
        "INSERT INTO stores (user_id, name, slug, is_active) VALUES (?, ?, ?, ?)",
        [newUserId, `Test Store ${newUserId}`, `test-store-${newUserId}`, false]
      );

      console.log("Created store with ID:", storeResult.insertId);

      // Update user role to seller
      await connection.execute("UPDATE users SET role = ? WHERE user_id = ?", [
        "seller",
        newUserId,
      ]);
      console.log("Updated user role to seller");

      console.log("\n✅ Test user setup complete!");
      console.log(
        `User ID: ${newUserId}, Role: seller, Store ID: ${storeResult.insertId}`
      );
    } else {
      const user = googleUsers[0];
      console.log("Using existing Google user:", user);

      // Check if user has store
      const [stores] = await connection.execute(
        "SELECT store_id, name FROM stores WHERE user_id = ?",
        [user.user_id]
      );
      if (stores.length > 0) {
        console.log("User has store:", stores[0]);
      } else {
        console.log("User has no store");
      }
    }

    connection.release();
    process.exit(0);
  } catch (error) {
    console.error("Setup failed:", error);
    process.exit(1);
  }
}

setupTestUser();
