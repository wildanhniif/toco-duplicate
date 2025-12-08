const http = require("http");

async function finalIntegrationTest() {
  console.log("=== FINAL INTEGRATION TEST ===");

  const jwt = require("jsonwebtoken");
  require("dotenv").config();

  // Test the exact scenario: user logs in via Google for seller registration
  console.log(
    "\n🎯 TESTING: Google login → Seller registration → Dashboard redirect"
  );

  // Step 1: Simulate Google token (what authGoogle.js should return)
  const googleToken = jwt.sign(
    {
      user_id: 7, // Use existing user 7
      name: "Fufus Fafas",
      role: "customer", // Initial role from Google (will be updated by backend)
      store_id: null,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  console.log("✅ Step 1 - Google token created (role: customer)");

  // Step 2: Call seller registration (what GoogleCallbackPage does)
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
      console.log("✅ Step 2 - Seller registration API called");
      console.log("   Status:", res.statusCode);

      try {
        const response = JSON.parse(data);
        console.log("   Message:", response.message);

        if (response.token) {
          const newPayload = jwt.decode(response.token);
          console.log("✅ Step 3 - New token received");
          console.log("   New Role:", newPayload.role);
          console.log("   Store ID:", newPayload.store_id);

          if (newPayload.role === "seller" && newPayload.store_id) {
            console.log("\n🎉 INTEGRATION TEST PASSED!");
            console.log("✅ Backend generates correct seller token");
            console.log("✅ Frontend should redirect to /seller/dashboard");
            console.log("✅ useAuth hook should recognize seller role");
            console.log("\n📋 NEXT STEPS:");
            console.log("1. Clear browser cache completely");
            console.log("2. Test in incognito mode");
            console.log("3. Check console logs for debugging");
            console.log("4. Verify localStorage has correct token");
          } else {
            console.log("\n❌ INTEGRATION TEST FAILED");
            console.log("Backend not generating correct token");
          }
        } else {
          console.log("\n❌ INTEGRATION TEST FAILED");
          console.log("No token in response");
        }
      } catch (e) {
        console.log("\n❌ INTEGRATION TEST FAILED");
        console.log("Response error:", data);
      }
    });
  });

  req.on("error", (error) => {
    console.error("❌ Test failed:", error.message);
  });

  req.write(postData);
  req.end();
}

finalIntegrationTest();
