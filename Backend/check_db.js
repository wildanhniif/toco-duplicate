const db = require("./config/database");

async function checkDatabase() {
  try {
    const connection = await db.getConnection();
    console.log("=== Checking Database Schema ===");

    // Check users table structure
    const [usersDesc] = await connection.execute("DESCRIBE users");
    console.log("Users table structure:");
    usersDesc.forEach((col) => console.log(`- ${col.Field}: ${col.Type}`));

    // Check stores table structure
    const [storesDesc] = await connection.execute("DESCRIBE stores");
    console.log("\nStores table structure:");
    storesDesc.forEach((col) => console.log(`- ${col.Field}: ${col.Type}`));

    // Check sample data
    const [users] = await connection.execute(
      "SELECT user_id, full_name, email, role FROM users LIMIT 5"
    );
    console.log("\nSample users:");
    users.forEach((user) =>
      console.log(
        `ID: ${user.user_id}, Name: ${user.full_name}, Role: ${user.role}`
      )
    );

    connection.release();
    process.exit(0);
  } catch (error) {
    console.error("Database error:", error);
    process.exit(1);
  }
}

checkDatabase();
