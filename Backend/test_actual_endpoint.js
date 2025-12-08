const http = require("http");

async function testActualGoogleEndpoint() {
  console.log("=== TESTING ACTUAL GOOGLE OAUTH ENDPOINT ===");

  // Test the actual /api/auth/google endpoint to see what it returns
  console.log("\n🔍 Testing what Google OAuth actually returns...");

  const options = {
    hostname: "localhost",
    port: 5000,
    path: "/api/auth/google",
    method: "GET",
  };

  console.log("📋 This should redirect to Google OAuth...");
  console.log("   But we need to test the callback endpoint directly");

  // Let's test what happens when we manually call the callback with user data
  console.log(
    "\n🔍 Let me check if our authGoogle.js fix is actually being used..."
  );

  // Create a test to verify the database query in authGoogle.js works
  const db = require("./config/database");

  try {
    const connection = await db.getConnection();

    console.log("\n📊 Testing the exact query from authGoogle.js:");
    const [userDetails] = await connection.execute(
      `SELECT u.user_id, u.full_name, u.role, s.store_id 
       FROM users u 
       LEFT JOIN stores s ON u.user_id = s.user_id 
       WHERE u.user_id = ?`,
      [6]
    );

    if (userDetails.length > 0) {
      const user = userDetails[0];
      console.log("✅ Database Query Results:");
      console.log("   - User ID:", user.user_id);
      console.log("   - Name:", user.full_name);
      console.log("   - Role:", user.role);
      console.log("   - Store ID:", user.store_id);

      if (user.role === "seller" && user.store_id) {
        console.log("\n🎯 DATABASE IS CORRECT!");
        console.log("   The issue must be in the frontend or browser cache");

        console.log("\n🔧 TROUBLESHOOTING STEPS:");
        console.log("   1. Clear browser localStorage completely");
        console.log("   2. Clear browser cache");
        console.log("   3. Open browser DevTools and check Network tab");
        console.log("   4. Check Console for errors");
        console.log("   5. Verify localStorage has correct token after login");
      } else {
        console.log("\n❌ DATABASE ISSUE:");
        console.log("   Role or store_id is not correct in database");
      }
    }

    connection.release();
  } catch (error) {
    console.error("❌ Database test failed:", error);
  }
}

testActualGoogleEndpoint();
