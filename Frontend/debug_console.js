// Console debugging commands - copy paste ini di browser console
console.log("=== DEBUG AUTH STATE ===");
console.log("Current token:", localStorage.getItem("auth_token"));
console.log("Redirect flag:", localStorage.getItem("redirect_after_auth"));

// Parse token to see role
const token = localStorage.getItem("auth_token");
if (token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    console.log("Token payload:", payload);
    console.log("User role:", payload.role);
    console.log("Store ID:", payload.store_id);
  } catch (e) {
    console.log("Error parsing token:", e);
  }
}

// Check if useAuth hook is working
console.log("=== CHECKING USEAUTH HOOK ===");
// This will show what React sees
window.dispatchEvent(new Event("storage"));
