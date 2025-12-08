const http = require("http");

async function testExistingUserFlow() {
  console.log("=== Testing Existing User with Store (ID: 6) ===");

  const jwt = require("jsonwebtoken");
  require("dotenv").config();

  // First, let's check if user 6 now has a store from previous test
  console.log("User 6 should now have store from previous registration...");

  // Step 1: Simulate Google login token for user ID 6 (now should be seller)
  const googlePayload = {
    user_id: 6,
    name: "Fufus Fafas",
    role: "customer", // Still customer in token
    store_id: null,
  };

  const googleToken = jwt.sign(googlePayload, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  console.log("Step 1 - Google Token (customer role):");
  console.log("- User ID:", googlePayload.user_id);
  console.log("- Role:", googlePayload.role);

  try {
    // Step 2: Call seller registration API
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
        console.log("\nStep 2 - Seller Registration API Response:");
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
            console.log("\n✅ Status 200 Flow Test Result:");
            console.log("- Final Role:", verified.role);
            console.log("- Final Store ID:", verified.store_id);

            if (res.statusCode === 200 && verified.role === "seller") {
              console.log(
                "\n🎉 SUCCESS: Status 200 flow works for existing user with store!"
              );
            } else {
              console.log("\n❌ FAILED: Status 200 flow not working correctly");
            }
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

testExistingUserFlow();
