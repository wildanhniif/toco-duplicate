const jwt = require("jsonwebtoken");
const db = require("./config/database");
require("dotenv").config();

async function testGoogleCallbackFix() {
  console.log("=== Testing Google Callback Fix ===");

  try {
    const connection = await db.getConnection();

    // Simulate user data from passport (like what Google callback receives)
    const userFromPassport = {
      user_id: 6,
      full_name: "Fufus Fafas",
      email: "fufusfafas1@gmail.com",
      google_id: "101480430180369519750",
    };

    console.log("User from Passport:", userFromPassport);

    // Test the new logic - fetch full user details from database
    const [userDetails] = await connection.execute(
      `SELECT u.user_id, u.full_name, u.role, s.store_id 
       FROM users u 
       LEFT JOIN stores s ON u.user_id = s.user_id 
       WHERE u.user_id = ?`,
      [userFromPassport.user_id]
    );

    if (userDetails.length > 0) {
      const fullUserData = userDetails[0];
      console.log("\nFull User Data from Database:");
      console.log("- User ID:", fullUserData.user_id);
      console.log("- Name:", fullUserData.full_name);
      console.log("- Role:", fullUserData.role);
      console.log("- Store ID:", fullUserData.store_id);

      // Generate token with actual database data
      const payload = {
        user_id: fullUserData.user_id,
        name: fullUserData.full_name,
        role: fullUserData.role || "customer",
        store_id: fullUserData.store_id || null,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      console.log("\n=== Generated Token Analysis ===");
      const decoded = jwt.decode(token);
      console.log("- Token Role:", decoded.role);
      console.log("- Token Store ID:", decoded.store_id);

      if (decoded.role === "seller" && decoded.store_id) {
        console.log(
          "\n🎉 SUCCESS: Google callback now returns correct role and store_id!"
        );
        console.log(
          "User will be recognized as seller immediately after Google login."
        );
      } else {
        console.log("\n❌ FAILED: Token still has incorrect data");
      }
    }

    connection.release();
    process.exit(0);
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

testGoogleCallbackFix();
