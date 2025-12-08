const http = require("http");

async function testSellerRegistrationWithDebug() {
  console.log("=== Testing Seller Registration API with Debug ===");

  const jwt = require("jsonwebtoken");
  require("dotenv").config();

  // Test dengan user_id 3 yang sudah punya store tapi role masih customer
  const googlePayload = {
    user_id: 3,
    name: "Fufus Fafas",
    role: "customer",
    store_id: null,
  };

  const googleToken = jwt.sign(googlePayload, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  console.log("Using Google token for user_id:", googlePayload.user_id);
  console.log("Current role in token:", googlePayload.role);

  try {
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
        console.log("\n=== API Response ===");
        console.log("Status:", res.statusCode);

        try {
          const response = JSON.parse(data);
          console.log("Response:", response);

          if (response.token) {
            const newPayload = jwt.decode(response.token);
            console.log("\n=== New Token Payload ===");
            console.log("Decoded:", newPayload);

            // Verify the new token
            try {
              const verified = jwt.verify(
                response.token,
                process.env.JWT_SECRET
              );
              console.log("New token verified:", verified);
              console.log("New role in token:", verified.role);
            } catch (e) {
              console.log("New token verification failed:", e.message);
            }
          }
        } catch (e) {
          console.log("Raw response:", data);
        }
      });
    });

    req.on("error", (error) => {
      console.error("API call failed:", error.message);
    });

    req.write(postData);
    req.end();
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

testSellerRegistrationWithDebug();
