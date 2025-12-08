const db = require("./config/database");

async function checkAllUsers() {
  try {
    const connection = await db.getConnection();
    console.log("=== All Users in Database ===");

    const [users] = await connection.execute(
      "SELECT user_id, full_name, email, role FROM users ORDER BY user_id"
    );
    console.log("Total users:", users.length);

    users.forEach((user) => {
      console.log(
        `ID: ${user.user_id}, Name: ${user.full_name}, Email: ${user.email}, Role: ${user.role}`
      );
    });

    // Check stores
    const [stores] = await connection.execute(
      "SELECT store_id, user_id, name FROM stores"
    );
    console.log("\n=== All Stores ===");
    console.log("Total stores:", stores.length);

    stores.forEach((store) => {
      console.log(
        `Store ID: ${store.store_id}, User ID: ${store.user_id}, Name: ${store.name}`
      );
    });

    connection.release();
    process.exit(0);
  } catch (error) {
    console.error("Database error:", error);
    process.exit(1);
  }
}

checkAllUsers();
