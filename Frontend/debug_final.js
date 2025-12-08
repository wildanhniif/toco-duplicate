// Copy paste ini di browser console setelah login gagal
console.log("=== DEBUG SCRIPT ===");

// Check current token
const token = localStorage.getItem("auth_token");
console.log("Current token:", token);

if (token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    console.log("Token payload:", payload);
    console.log("User role:", payload.role);
    console.log("Store ID:", payload.store_id);

    if (payload.role === "seller") {
      console.log("✅ Token is correct - should show seller dashboard");
    } else {
      console.log("❌ Token role is wrong - need seller registration");
    }
  } catch (e) {
    console.log("❌ Error parsing token:", e);
  }
} else {
  console.log("❌ No token found");
}

// Check localStorage flags
console.log(
  "Seller registration flag:",
  localStorage.getItem("seller_registration_pending")
);
console.log("OAuth redirect:", localStorage.getItem("oauth_redirect"));

// Test useAuth hook manually
console.log("=== TESTING USEAUTH HOOK ===");
window.dispatchEvent(
  new StorageEvent("storage", {
    key: "auth_token",
    newValue: token,
    oldValue: null,
  })
);
