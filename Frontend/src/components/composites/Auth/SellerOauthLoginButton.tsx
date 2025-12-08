"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function SellerOauthLoginButton() {
  const handleGoogleLogin = () => {
    if (typeof window !== "undefined") {
      // Store a flag to indicate this is a seller registration flow
      localStorage.setItem("seller_registration_pending", "true");
      // Redirect to Google OAuth
      window.location.href = `${API_BASE_URL}/api/auth/google`;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
      <Button
        variant="outline"
        type="button"
        name="login-google-seller"
        id="login-google-seller"
        className="h-11"
        onClick={handleGoogleLogin}
      >
        <Image src="/google.svg" alt="Google Icon" width={27} height={27} />{" "}
        Google
      </Button>
      <Button
        variant="outline"
        type="button"
        name="login-facebook-seller"
        id="login-facebook-seller"
        className="h-11"
        disabled
      >
        <Image src="/facebook.svg" alt="Facebook Icon" width={27} height={27} />{" "}
        Facebook
      </Button>
    </div>
  );
}
