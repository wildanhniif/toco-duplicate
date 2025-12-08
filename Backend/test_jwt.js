const jwt = require("jsonwebtoken");
require("dotenv").config();

console.log("=== JWT Token Analysis ===");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "EXISTS" : "MISSING");

// Test 1: Simulate Google login token
const googleTokenPayload = {
  user_id: 3,
  name: "Test User",
  role: "customer", // This is the issue - Google always gives 'customer'
  store_id: null,
};

const googleToken = jwt.sign(googleTokenPayload, process.env.JWT_SECRET, {
  expiresIn: "1h",
});
console.log("\n=== Google Token ===");
console.log("Payload:", googleTokenPayload);
console.log("Token:", googleToken);

// Test 2: Simulate seller registration token
const sellerTokenPayload = {
  user_id: 3,
  name: "Test User",
  role: "seller", // This should be the result after registration
  store_id: 123,
};

const sellerToken = jwt.sign(sellerTokenPayload, process.env.JWT_SECRET, {
  expiresIn: "1h",
});
console.log("\n=== Seller Token ===");
console.log("Payload:", sellerTokenPayload);
console.log("Token:", sellerToken);

// Test 3: Decode both tokens to verify
console.log("\n=== Decoded Tokens ===");
console.log("Google token decoded:", jwt.decode(googleToken));
console.log("Seller token decoded:", jwt.decode(sellerToken));

// Test 4: Check if tokens are valid
console.log("\n=== Token Validation ===");
try {
  console.log(
    "Google token valid:",
    jwt.verify(googleToken, process.env.JWT_SECRET)
  );
} catch (e) {
  console.log("Google token invalid:", e.message);
}

try {
  console.log(
    "Seller token valid:",
    jwt.verify(sellerToken, process.env.JWT_SECRET)
  );
} catch (e) {
  console.log("Seller token invalid:", e.message);
}
