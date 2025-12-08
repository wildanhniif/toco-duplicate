// Script untuk debug exact problem
// Copy paste ini di browser console saat di halaman utama

console.log("=== DEBUG EXACT PROBLEM ===");

// 1. Check current token
const token = localStorage.getItem("auth_token");
console.log(
  "1. Current token:",
  token ? token.substring(0, 50) + "..." : "NONE"
);

if (token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    console.log("2. Token payload:", payload);
    console.log("   - User ID:", payload.user_id);
    console.log("   - Name:", payload.name);
    console.log("   - Role:", payload.role);
    console.log("   - Store ID:", payload.store_id);

    // 3. Check if this is a Google user
    if (payload.user_id) {
      console.log("3. Checking database for user ID:", payload.user_id);

      // Call API to check actual database state
      fetch(`http://localhost:5000/api/debug/user/${payload.user_id}`)
        .then((response) => response.json())
        .then((data) => {
          console.log("4. Database state:", data);

          if (data.role === "seller" && payload.role === "customer") {
            console.log(
              "❌ PROBLEM FOUND: Database role is 'seller' but token role is 'customer'"
            );
            console.log("🔧 SOLUTION: Need to refresh token from Google OAuth");

            // Force fresh token
            localStorage.removeItem("auth_token");
            console.log("✅ Old token cleared. Please login again via Google.");
          } else if (data.role === "seller" && payload.role === "seller") {
            console.log(
              "✅ Token is correct - frontend should show seller options"
            );
            console.log(
              "🔧 PROBLEM: Frontend not updating - need to refresh useAuth hook"
            );

            // Force refresh useAuth hook
            window.dispatchEvent(
              new StorageEvent("storage", {
                key: "auth_token",
                newValue: token,
                oldValue: null,
              })
            );
          } else {
            console.log("ℹ️ User is customer in database");
          }
        })
        .catch((error) => {
          console.log("❌ API call failed:", error);
          console.log("🔧 Manual fix needed");
        });
    }
  } catch (e) {
    console.log("❌ Error parsing token:", e);
  }
} else {
  console.log("❌ No token - user not logged in");
}
