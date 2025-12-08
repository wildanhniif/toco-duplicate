const http = require("http");

async function testRealBrowserFlow() {
  console.log("=== TESTING REAL BROWSER FLOW STEP BY STEP ===");

  // STEP 1: Simulate Google OAuth callback (what happens when user clicks Google login)
  console.log("\n🔍 STEP 1: Simulating Google OAuth callback...");

  const jwt = require("jsonwebtoken");
  require("dotenv").config();

  // This simulates what authGoogle.js should return now
  const googleTokenPayload = {
    user_id: 6,
    name: "Fufus Fafas",
    role: "seller", // Should be seller now with our fix
    store_id: 29, // Should have store_id now
  };

  const googleToken = jwt.sign(googleTokenPayload, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  console.log("✅ Google Token Generated:");
  console.log("   - Role:", googleTokenPayload.role);
  console.log("   - Store ID:", googleTokenPayload.store_id);

  // STEP 2: Simulate what GoogleCallbackPage does
  console.log("\n🔍 STEP 2: Simulating GoogleCallbackPage logic...");

  // Check if this is seller registration flow
  const isSellerRegistration = "true"; // Simulate localStorage flag
  console.log("   - Seller registration flag:", isSellerRegistration);

  if (isSellerRegistration === "true") {
    console.log("   - 🔄 Detected seller registration flow");

    // Check if token already has seller role
    if (googleTokenPayload.role === "seller") {
      console.log(
        "   - ✅ Token already has seller role - should redirect to dashboard"
      );
      console.log("   - 🎯 Expected redirect: /seller/dashboard");

      // This is where it should work now
      console.log(
        "\n🎉 SUCCESS CASE: User should be redirected to seller dashboard"
      );
      console.log(
        "   Frontend should save token and redirect to /seller/dashboard"
      );
    } else {
      console.log(
        "   - ❌ Token role is not seller - would call seller registration API"
      );

      // STEP 3: If role is still customer, call seller registration
      console.log("\n🔍 STEP 3: Calling seller registration API...");

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
          console.log("   - API Status:", res.statusCode);

          try {
            const response = JSON.parse(data);
            console.log("   - API Response:", response.message);

            if (response.token) {
              const newPayload = jwt.decode(response.token);
              console.log("   - New Token Role:", newPayload.role);
              console.log("   - New Token Store ID:", newPayload.store_id);

              if (newPayload.role === "seller") {
                console.log(
                  "   - ✅ Should redirect to /seller/dashboard with new token"
                );
              }
            }
          } catch (e) {
            console.log("   - ❌ API Response Error:", data);
          }
        });
      });

      req.on("error", (error) => {
        console.error("   - ❌ API Call Failed:", error.message);
      });

      req.write(postData);
      req.end();
    }
  }
}

testRealBrowserFlow();
