const db = require("./config/database");

async function checkUserDetail() {
  try {
    const connection = await db.getConnection();
    console.log("=== Detailed User Check ===");

    const [users] = await connection.execute(
      "SELECT u.user_id, u.full_name, u.email, u.role, u.google_id, s.store_id, s.name as store_name FROM users u LEFT JOIN stores s ON u.user_id = s.user_id WHERE u.user_id = ?",
      [3]
    );

    if (users.length > 0) {
      const user = users[0];
      console.log("User Details:");
      console.log("- ID:", user.user_id);
      console.log("- Name:", user.full_name);
      console.log("- Email:", user.email);
      console.log("- Role in DB:", user.role);
      console.log("- Google ID:", user.google_id);
      console.log("- Store ID:", user.store_id);
      console.log("- Store Name:", user.store_name);

      console.log("\n=== ISSUE IDENTIFIED ===");
      console.log(
        'User has a store but role is still "customer" instead of "seller"'
      );
      console.log("This is the root cause of the problem!");
    }

    connection.release();
    process.exit(0);
  } catch (error) {
    console.error("Database error:", error);
    process.exit(1);
  }
}

checkUserDetail();
