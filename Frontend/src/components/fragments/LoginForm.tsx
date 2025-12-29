"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import InputGroupPassword from "../composites/Auth/InputGroupPassword";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  // Check if this is a redirect to seller registration
  const redirectToSeller = searchParams.get("redirect_to_seller") === "true";
  const redirectUrl = searchParams.get("redirect") || "/";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors (array format) similar to RegisterForm
        if (data?.errors && Array.isArray(data.errors)) {
          const newFieldErrors: { [key: string]: string } = {};
          data.errors.forEach((err: any) => {
            if (err.path === "identifier") {
              newFieldErrors["identifier"] = err.msg;
            } else if (err.path === "password") {
              newFieldErrors["password"] = err.msg;
            }
          });
          setFieldErrors(newFieldErrors);

          // Fallback global error if no specific fields match
          if (Object.keys(newFieldErrors).length === 0) {
            setError(data.errors[0]?.msg || "Login gagal.");
          }
        } else {
          const message =
            data?.message || "Login gagal. Silakan periksa kembali data Anda.";
          setError(message);
        }
        return;
      }

      const token = data?.token;
      if (token && typeof window !== "undefined") {
        localStorage.setItem("auth_token", token);
      }

      // If redirect_to_seller is true, redirect to seller login page
      if (redirectToSeller) {
        window.location.href = "/seller/login";
        return;
      }

      router.push(redirectUrl);
    } catch (error) {
      console.error(error);
      setError("Terjadi kesalahan pada server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="" onSubmit={handleSubmit}>
      <div className="mb-4">
        <Label htmlFor="identifier" className="block mb-3">
          Email atau Nomor HP
        </Label>
        <Input
          type="text"
          name="identifier"
          id="identifier"
          placeholder="Masukan email atau nomor HP anda"
          className="h-11"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
        />
        {fieldErrors.identifier && <p className="mt-1 text-sm text-red-500">{fieldErrors.identifier}</p>}
      </div>
      <InputGroupPassword
        name="password"
        id="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      >
        Password
      </InputGroupPassword>
      {fieldErrors.password && <p className="-mt-4 mb-4 text-sm text-red-500">{fieldErrors.password}</p>}
      {error && <p className="mb-2 text-sm text-red-500">{error}</p>}
      <Button
        type="submit"
        name="login-manual-trigger"
        id="login-manual-trigger"
        className="w-full h-11"
        disabled={loading}
      >
        {loading ? "Memproses..." : "Masuk Sekarang"}
      </Button>
    </form>
  );
}

export default function LoginForm() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center w-full h-11">
          <p>Loading...</p>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
