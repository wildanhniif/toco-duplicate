const http = require("http");

async function comprehensiveBackendTest() {
  console.log("=== COMPREHENSIVE BACKEND TEST ===");

  const jwt = require("jsonwebtoken");
  require("dotenv").config();

  // Test 1: Verify database state
  console.log("\n1️⃣ VERIFYING DATABASE STATE...");
  const db = require("./config/database");
  const connection = await db.getConnection();

  const [users] = await connection.execute(
    "SELECT user_id, full_name, role, google_id FROM users WHERE google_id IS NOT NULL"
  );

  console.log("Users with Google ID:", users);

  const [stores] = await connection.execute(
    "SELECT store_id, user_id, name FROM stores"
  );

  console.log("All stores:", stores);
  connection.release();

  // Test 2: Simulate EXACT Google OAuth flow
  console.log("\n2️⃣ TESTING GOOGLE OAUTH FLOW...");

  if (users.length > 0) {
    const user = users[0];
    console.log("Testing with user:", user);

    // Simulate what authGoogle.js should do
    const connection2 = await db.getConnection();
    const [userDetails] = await connection2.execute(
      `SELECT u.user_id, u.full_name, u.role, s.store_id 
       FROM users u 
       LEFT JOIN stores s ON u.user_id = s.user_id 
       WHERE u.user_id = ?`,
      [user.user_id]
    );

    if (userDetails.length > 0) {
      const fullUserData = userDetails[0];
      console.log("Full user data from DB:", fullUserData);

      // Generate token exactly like authGoogle.js
      const payload = {
        user_id: fullUserData.user_id,
        name: fullUserData.full_name,
        role: fullUserData.role || "customer",
        store_id: fullUserData.store_id || null,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      console.log("Generated token payload:", payload);

      // Test 3: Verify this token works with seller registration
      console.log("\n3️⃣ TESTING SELLER REGISTRATION WITH GOOGLE TOKEN...");

      const postData = JSON.stringify({});

      const options = {
        hostname: "localhost",
        port: 5000,
        path: "/api/sellers/register",
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
      };

      const req = http.request(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          console.log("Seller registration response:");
          console.log("- Status:", res.statusCode);
          console.log("- Data:", JSON.parse(data));

          console.log("\n🎯 BACKEND ANALYSIS COMPLETE");
          console.log("If backend is correct, the issue is 100% in frontend");
        });
      });

      req.on("error", (error) => {
        console.error("❌ API call failed:", error.message);
      });

      req.write(postData);
      req.end();

      connection2.release();
    }
  }
}

comprehensiveBackendTest().catch(console.error);
