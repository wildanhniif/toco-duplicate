const http = require("http");

async function testCompleteFlow() {
  console.log("=== Testing Complete Google Seller Login Flow ===");

  const jwt = require("jsonwebtoken");
  require("dotenv").config();

  // Step 1: Simulate Google login token (role: customer)
  const googlePayload = {
    user_id: 3,
    name: "Fufus Fafas",
    role: "customer",
    store_id: null,
  };

  const googleToken = jwt.sign(googlePayload, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  console.log("Step 1 - Google Token:");
  console.log("- User ID:", googlePayload.user_id);
  console.log("- Role:", googlePayload.role);
  console.log("- Store ID:", googlePayload.store_id);

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

            // Verify the new token
            try {
              const verified = jwt.verify(
                response.token,
                process.env.JWT_SECRET
              );
              console.log("\n✅ SUCCESS: Token verified and valid!");
              console.log("- Final Role:", verified.role);
              console.log("- Final Store ID:", verified.store_id);

              if (verified.role === "seller" && verified.store_id) {
                console.log("\n🎉 FLOW COMPLETED SUCCESSFULLY!");
                console.log("User is now a seller with store access.");
              } else {
                console.log("\n❌ FLOW FAILED: Role or store_id missing");
              }
            } catch (e) {
              console.log("❌ Token verification failed:", e.message);
            }
          }
        } catch (e) {
          console.log("❌ Failed to parse response:", data);
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

testCompleteFlow();
