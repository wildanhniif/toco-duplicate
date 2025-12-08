"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function EmailVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Memverifikasi email Anda...");

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Token verifikasi tidak ditemukan.");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(
            data.message ||
              "Email berhasil diverifikasi! Anda sekarang dapat login."
          );
        } else {
          setStatus("error");
          setMessage(
            data.message || "Verifikasi gagal. Token mungkin sudah kedaluwarsa."
          );
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage("Terjadi kesalahan saat memverifikasi email.");
      }
    };

    verifyEmail();
  }, [searchParams]);

  const handleGoToLogin = () => {
    router.push("/login");
  };

  const handleGoToHome = () => {
    router.push("/");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === "loading" && (
              <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
            )}
            {status === "success" && (
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            )}
            {status === "error" && (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === "loading" && "Memverifikasi Email"}
            {status === "success" && "Verifikasi Berhasil!"}
            {status === "error" && "Verifikasi Gagal"}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {status === "success" && (
            <>
              <Button onClick={handleGoToLogin} className="w-full" size="lg">
                Login Sekarang
              </Button>
              <Button
                onClick={handleGoToHome}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Kembali ke Beranda
              </Button>
            </>
          )}
          {status === "error" && (
            <>
              <Button onClick={handleGoToHome} className="w-full" size="lg">
                Kembali ke Beranda
              </Button>
              <Button
                onClick={() => router.push("/register")}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Daftar Ulang
              </Button>
            </>
          )}
          {status === "loading" && (
            <p className="text-sm text-center text-gray-500">
              Mohon tunggu, proses ini mungkin memakan waktu beberapa detik...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function EmailVerificationView() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <EmailVerificationContent />
    </Suspense>
  );
}
