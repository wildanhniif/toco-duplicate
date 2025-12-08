// SUPER AGGRESSIVE FIX SCRIPT - Copy paste ini di browser console
console.log("🔥 SUPER AGGRESSIVE FIX STARTING...");

async function forceFixSellerRole() {
  // Step 1: Clear semua cache dan storage
  console.log("🧹 Clearing all storage...");
  localStorage.clear();
  sessionStorage.clear();

  // Step 2: Force login ulang dengan Google OAuth
  console.log("🔐 Forcing fresh Google login...");

  // Set flag untuk seller registration
  localStorage.setItem("seller_registration_pending", "true");
  localStorage.setItem("force_seller_mode", "true");

  // Redirect ke Google login
  window.location.href = "http://localhost:5000/api/auth/google";
}

// Alternative: Direct token refresh jika sudah login
async function directTokenRefresh() {
  console.log("⚡ DIRECT TOKEN REFRESH...");

  try {
    // Cek user yang sedang login
    const currentToken = localStorage.getItem("auth_token");

    if (!currentToken) {
      console.log("❌ No token - using force login method");
      forceFixSellerRole();
      return;
    }

    const payload = JSON.parse(atob(currentToken.split(".")[1]));
    console.log("📋 Current user:", payload.user_id, payload.name);

    // Force fresh token dari backend
    const response = await fetch("http://localhost:5000/api/sellers/register", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${currentToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log("📡 API Response:", response.status, data);

    if (data.token) {
      // Clear old token
      localStorage.removeItem("auth_token");

      // Small delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Set new token
      localStorage.setItem("auth_token", data.token);
      console.log("✅ New token saved!");

      // Verify new token
      const newPayload = JSON.parse(atob(data.token.split(".")[1]));
      console.log("🎯 New token role:", newPayload.role);

      if (newPayload.role === "seller") {
        console.log("🎉 SUCCESS! Role is now seller!");

        // Force multiple refresh mechanisms
        console.log("🔄 Forcing UI refresh...");

        // 1. Storage event
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "auth_token",
            newValue: data.token,
            oldValue: currentToken,
          })
        );

        // 2. Custom event
        window.dispatchEvent(
          new CustomEvent("auth-changed", {
            detail: { token: data.token, user: newPayload },
          })
        );

        // 3. Force reload after delay
        setTimeout(() => {
          console.log("💥 FINAL: Reloading page...");
          window.location.reload();
        }, 2000);
      } else {
        console.log("❌ New token still not seller - using force login");
        forceFixSellerRole();
      }
    } else {
      console.log("❌ No new token - using force login");
      forceFixSellerRole();
    }
  } catch (error) {
    console.error("💥 Error:", error);
    console.log("🔐 Using force login method");
    forceFixSellerRole();
  }
}

// Jalankan direct refresh dulu
directTokenRefresh();
