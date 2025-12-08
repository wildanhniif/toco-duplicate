"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Suspense } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function OauthLoginButtonContent() {
  const handleGoogleLogin = () => {
    if (typeof window !== "undefined") {
      window.location.href = `${API_BASE_URL}/api/auth/google`;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
      <Button
        variant="outline"
        type="button"
        name="login-google"
        id="login-google"
        className="h-11"
        onClick={handleGoogleLogin}
      >
        <Image src="/google.svg" alt="Google Icon" width={27} height={27} />{" "}
        Google
      </Button>
      <Button
        variant="outline"
        type="button"
        name="login-facebook"
        id="login-facebook"
        className="h-11"
        disabled
      >
        <Image src="/facebook.svg" alt="Facebook Icon" width={27} height={27} />{" "}
        Facebook
      </Button>
    </div>
  );
}

export default function OauthLoginButton() {
  return (
    <Suspense
      fallback={
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
          <div className="h-11 animate-pulse bg-gray-200 rounded-md"></div>
          <div className="h-11 animate-pulse bg-gray-200 rounded-md"></div>
        </div>
      }
    >
      <OauthLoginButtonContent />
    </Suspense>
  );
}
