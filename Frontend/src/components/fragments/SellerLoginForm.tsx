"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function SellerLoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleActivateSeller = async () => {
    setError(null);
    setLoading(true);

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;

      if (!token) {
        const message =
          "Sesi login tidak ditemukan. Silakan login ulang sebagai pembeli.";
        setError(message);
        toast.error(message);
        window.location.href = "/login?redirect_to_seller=true";
        return;
      }

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
      console.log(
        "[SellerLogin] Seller registration response:",
        sellerResponse.status,
        sellerData
      );

      if (!sellerResponse.ok) {
        if (sellerResponse.status === 409) {
          // Sudah terdaftar sebagai seller, langsung ke dashboard
          window.location.href = "/seller/dashboard";
          return;
        }

        const message = sellerData?.message || "Gagal mendaftar sebagai seller";
        setError(message);
        toast.error(message);
        return;
      }

      // Jika backend mengirimkan token seller baru, simpan dan gunakan
      if (sellerData.token) {
        localStorage.setItem("auth_token", sellerData.token);
      }

      toast.success("Akun kamu berhasil diaktifkan sebagai seller");
      window.location.href = "/seller/dashboard";
      return;
    } catch (err) {
      console.error(err);
      const message = "Terjadi kesalahan pada server.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4 space-y-1">
        <Label className="block mb-1 font-semibold">Aktifkan akun seller</Label>
        <p className="text-sm text-muted-foreground">
          Akun kamu sudah login sebagai pembeli. Klik tombol di bawah untuk
          mendaftar sebagai seller dan mulai mengelola toko kamu.
        </p>
      </div>
      {error && <p className="mb-2 text-sm text-red-500">{error}</p>}
      <Button
        type="button"
        name="login-seller-trigger"
        id="login-seller-trigger"
        className="w-full h-11"
        disabled={loading}
        onClick={handleActivateSeller}
      >
        {loading ? "Memproses..." : "Mulai Jualan Sekarang"}
      </Button>
    </div>
  );
}
