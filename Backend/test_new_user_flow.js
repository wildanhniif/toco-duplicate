const http = require("http");
const db = require("./config/database");

async function testWithNewUser() {
  console.log("=== Testing with New User ===");

  try {
    // Step 0: Create a new test user
    const connection = await db.getConnection();
    const [result] = await connection.execute(
      "INSERT INTO users (full_name, email, password_hash, role, is_verified, is_active) VALUES (?, ?, ?, ?, ?, ?)",
      [
        "Test Seller User",
        "testseller@example.com",
        "dummyhash",
        "customer",
        1,
        1,
      ]
    );

    const newUserId = result.insertId;
    console.log("Created new user with ID:", newUserId);
    connection.release();

    // Step 1: Create Google token for new user
    const jwt = require("jsonwebtoken");
    require("dotenv").config();

    const googlePayload = {
      user_id: newUserId,
      name: "Test Seller User",
      role: "customer",
      store_id: null,
    };

    const googleToken = jwt.sign(googlePayload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    console.log("Step 1 - Google Token created for user:", newUserId);

    // Step 2: Call seller registration
    const postData = JSON.stringify({});

    const options = {
      hostname: "localhost",
      port: 5000,
      path: "/api/sellers/register",
      method: "POST",
      headers: {
        Authorization: `Bearer ${googleToken}`,
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
        console.log("\nStep 2 - Seller Registration Response:");
        console.log("- Status:", res.statusCode);

        try {
          const response = JSON.parse(data);
          console.log("- Message:", response.message);

          if (response.token) {
            const newPayload = jwt.decode(response.token);
            console.log("\nStep 3 - New Token Analysis:");
            console.log("- User ID:", newPayload.user_id);
            console.log("- Role:", newPayload.role);
            console.log("- Store ID:", newPayload.store_id);

            const verified = jwt.verify(response.token, process.env.JWT_SECRET);
            console.log("\n✅ SUCCESS: New user flow completed!");
            console.log("- Final Role:", verified.role);
            console.log("- Final Store ID:", verified.store_id);
          }
        } catch (e) {
          console.log("❌ Response error:", data);
        }
      });
    });

    req.on("error", (error) => {
      console.error("❌ API call failed:", error.message);
    });

    req.write(postData);
    req.end();
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testWithNewUser();
