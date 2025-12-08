"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import InputGroupPassword from "../composites/Auth/InputGroupPassword";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          phoneNumber,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          data?.message ||
          (Array.isArray(data?.errors) && data.errors.length > 0
            ? data.errors[0].msg
            : null) ||
          "Registrasi gagal. Silakan periksa kembali data Anda.";
        setError(message);
        return;
      }

      const message =
        data?.message ||
        "Registrasi berhasil. Silakan cek email Anda untuk verifikasi.";
      setSuccess(message);

      // Redirect to home page after 2 seconds
      setTimeout(() => {
        router.push("/");
      }, 2000);
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
        <Label htmlFor="fullname" className="block mb-3">
          Nama Lengkap
        </Label>
        <Input
          type="text"
          name="fullName"
          id="fullname"
          placeholder="Masukan nama lengkap anda"
          className="h-11"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
      </div>
      <div className="mb-4">
        <Label htmlFor="phone-number" className="block mb-3">
          Nomor Telepon
        </Label>
        <Input
          type="tel"
          name="phoneNumber"
          id="phone-number"
          placeholder="Masukan nomor telepon anda"
          className="h-11"
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
        />
      </div>
      <div className="mb-4">
        <Label htmlFor="email-address" className="block mb-3">
          Email address
        </Label>
        <Input
          type="email"
          name="email"
          id="email-address"
          placeholder="Masukan email anda"
          className="h-11"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <InputGroupPassword
        name="password"
        id="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      >
        Password
      </InputGroupPassword>
      {error && <p className="mb-2 text-sm text-red-500">{error}</p>}
      {success && <p className="mb-2 text-sm text-green-600">{success}</p>}
      <Button
        type="submit"
        name="login-manual-trigger"
        id="login-manual-trigger"
        className="w-full h-11"
        disabled={loading}
      >
        {loading ? "Memproses..." : "Daftar Sekarang"}
      </Button>
    </form>
  );
}
