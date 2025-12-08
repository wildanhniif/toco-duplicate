// AUTO FIX SCRIPT - Copy paste ini di browser console
// Script ini akan otomatis mendeteksi dan memperbaiki masalah role

console.log("🔧 AUTO FIX SCRIPT STARTING...");

async function autoFixSellerRole() {
  const token = localStorage.getItem("auth_token");

  if (!token) {
    console.log("❌ No token found - please login first");
    return;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    console.log("📋 Current token role:", payload.role);

    // Check actual database state
    const response = await fetch(
      `http://localhost:5000/api/debug/user/${payload.user_id}`
    );
    const userData = await response.json();

    console.log("📊 Database state:", userData);

    if (userData.role === "seller" && payload.role === "customer") {
      console.log("🔥 PROBLEM: Database says seller but token says customer");
      console.log("🔧 FIXING: Getting fresh token from backend...");

      // Call seller registration to get fresh token
      const sellerResponse = await fetch(
        "http://localhost:5000/api/sellers/register",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const sellerData = await sellerResponse.json();
      console.log("📡 Seller API response:", sellerResponse.status, sellerData);

      if (sellerData.token) {
        // Save new token
        localStorage.setItem("auth_token", sellerData.token);
        console.log("✅ NEW TOKEN SAVED!");

        // Force page reload to refresh everything
        console.log("🔄 Reloading page...");
        window.location.reload();
      } else {
        console.log("❌ No new token received - need to login again");
        localStorage.removeItem("auth_token");
        window.location.href = "/seller/login";
      }
    } else if (userData.role === "seller" && payload.role === "seller") {
      console.log("✅ Token is correct - forcing frontend refresh...");

      // Force refresh useAuth hook
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "auth_token",
          newValue: token,
          oldValue: null,
        })
      );

      // Also force reload to be sure
      setTimeout(() => {
        console.log("🔄 Reloading page to refresh UI...");
        window.location.reload();
      }, 1000);
    } else {
      console.log("ℹ️ User is customer in database - no fix needed");
    }
  } catch (error) {
    console.error("❌ Auto fix failed:", error);
    console.log("🔧 Manual fix: Clear localStorage and login again");
  }
}

// Run the fix
autoFixSellerRole();
