"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(
    "Menghubungkan akun Google Anda, mohon tunggu..."
  );

  useEffect(() => {
    const handleCallback = async () => {
      // Check if we need to redirect after auth refresh
      const redirectAfterAuth = window.localStorage.getItem(
        "redirect_after_auth"
      );
      if (redirectAfterAuth) {
        console.log(
          "[GoogleCallback] Redirecting after auth refresh to:",
          redirectAfterAuth
        );
        window.localStorage.removeItem("redirect_after_auth");
        window.location.href = redirectAfterAuth;
        return;
      }

      const token = searchParams.get("token");
      const error = searchParams.get("error");

      console.log(
        "[GoogleCallback] token:",
        token ? token.substring(0, 20) + "..." : null
      );
      console.log("[GoogleCallback] error:", error);

      if (error) {
        router.replace(`/login?error=${encodeURIComponent(error)}`);
        return;
      }

      if (token && typeof window !== "undefined") {
        window.localStorage.setItem("auth_token", token);

        let debugPayload: {
          user_id?: number;
          name?: string;
          role?: string;
          store_id?: number | null;
          user?: {
            id?: number;
            name?: string;
            full_name?: string;
            role?: string;
          };
        } | null = null;
        try {
          debugPayload = JSON.parse(atob(token.split(".")[1]));
          console.log("[GoogleCallback] token payload:", debugPayload);
        } catch (e) {
          console.error("[GoogleCallback] Error decoding token:", e);
        }

        // Check if this is a seller registration flow
        const isSellerRegistration = window.localStorage.getItem(
          "seller_registration_pending"
        );
        // Check if there's a redirect URL from OAuth login
        const oauthRedirect = window.localStorage.getItem("oauth_redirect");
        console.log(
          "[GoogleCallback] isSellerRegistration:",
          isSellerRegistration
        );
        console.log("[GoogleCallback] oauthRedirect:", oauthRedirect);

        if (isSellerRegistration === "true") {
          // Clear the flag
          window.localStorage.removeItem("seller_registration_pending");
          setStatus("Mengatur akun seller Anda...");

          try {
            console.log(
              "[GoogleCallback] 🚀 STARTING SELLER REGISTRATION FLOW"
            );
            console.log(
              "[GoogleCallback] Initial token role:",
              debugPayload?.role
            );

            // ALWAYS call seller registration API - let backend handle all logic
            const sellerResponse = await fetch(
              `${API_BASE_URL}/api/sellers/register`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            const sellerData = await sellerResponse.json();
            console.log("[GoogleCallback] 📡 API RESPONSE:");
            console.log("   - Status:", sellerResponse.status);
            console.log("   - Message:", sellerData.message);
            console.log("   - Has token:", !!sellerData.token);

            // CASE 1: Success - got new seller token
            if (
              (sellerResponse.status === 201 ||
                sellerResponse.status === 200) &&
              sellerData.token
            ) {
              console.log("[GoogleCallback] ✅ SUCCESS: Got new seller token");
              window.localStorage.setItem("auth_token", sellerData.token);
              console.log(
                "[GoogleCallback] 💾 Token saved, redirecting to dashboard..."
              );
              window.location.href = "/seller/dashboard";
              return;
            }

            // CASE 2: Already seller - check if current token works
            if (sellerResponse.status === 409) {
              console.log("[GoogleCallback] ℹ️  User already seller");

              if (debugPayload?.role === "seller") {
                console.log(
                  "[GoogleCallback] ✅ Current token has seller role - redirecting"
                );
                window.location.href = "/seller/dashboard";
                return;
              } else {
                console.log(
                  "[GoogleCallback] ⚠️  Token role mismatch, getting fresh token..."
                );

                // Force fresh token by calling Google OAuth again or redirect to login
                window.location.href = "/seller/login?error=token_mismatch";
                return;
              }
            }

            // CASE 3: Any other response - treat as error
            console.log(
              "[GoogleCallback] ❌ Unexpected response:",
              sellerResponse.status
            );
            window.location.href = "/seller/login?error=registration_failed";
            return;
          } catch (e) {
            console.error(
              "[GoogleCallback] 💥 ERROR in seller registration:",
              e
            );
            window.location.href = "/seller/login?error=network_error";
            return;
          }
        }

        // Handle OAuth redirect (for normal login flow)
        if (oauthRedirect) {
          window.localStorage.removeItem("oauth_redirect");
          console.log("[GoogleCallback] Redirecting to:", oauthRedirect);
          window.location.href = oauthRedirect;
          return;
        }

        // Normal login flow - redirect ke halaman utama
        console.log("[GoogleCallback] Normal login flow");
        window.location.href = "/";
        return;
      }

      router.replace("/login");
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center w-full h-screen">
      <p className="text-sm text-muted-foreground">{status}</p>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center w-full h-screen">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
