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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSuccess(null);
    setLoading(true);

    // Client-side password check removed to allow backend to validate all fields simultaneously
    // as requested by user ("langsung ketahuan, ga perlu satu2 check")
    /* 
    if (password !== confirmPassword) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: "Password dan Konfirmasi Password tidak cocok." }));
      setLoading(false);
      return;
    }
    */

    try {
      const payload = {
        fullName,
        phoneNumber,
        email,
        password,
        confirmPassword, // Send this to backend for server-side validation
      };
      
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors (array format)
        if (data?.errors && Array.isArray(data.errors)) {
           const newFieldErrors: { [key: string]: string } = {};
           data.errors.forEach((err: any) => {
             if (err.path === "password") { 
                 newFieldErrors["password"] = err.msg;
             } else if (err.path === "phoneNumber") {
                 newFieldErrors["phoneNumber"] = err.msg;
             } else if (err.path === "email") {
                 newFieldErrors["email"] = err.msg;
             } else if (err.path === "fullName") {
                 newFieldErrors["fullName"] = err.msg;
             } else if (err.path === "confirmPassword") {
                 newFieldErrors["confirmPassword"] = err.msg;
             }
           });
           setFieldErrors(newFieldErrors);
           
           // Fallback global error if array exists but no specific fields match or generic message needed
           if (Object.keys(newFieldErrors).length === 0) {
               setError(data.errors[0]?.msg || "Registrasi gagal.");
           }
        } else {
            setError(data?.message || "Registrasi gagal. Silakan periksa kembali data Anda.");
        }
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
        {fieldErrors.fullName && <p className="mt-1 text-sm text-red-500">{fieldErrors.fullName}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
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
          {fieldErrors.phoneNumber && <p className="mt-1 text-sm text-red-500">{fieldErrors.phoneNumber}</p>}
        </div>
        <div>
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
          {fieldErrors.email && <p className="mt-1 text-sm text-red-500">{fieldErrors.email}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
           <InputGroupPassword
            name="password"
            id="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          >
            Password
          </InputGroupPassword>
          {fieldErrors.password && <p className="-mt-4 mb-4 text-sm text-red-500">{fieldErrors.password}</p>}
        </div>
        
        <div>
          <InputGroupPassword
            name="confirmPassword"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          >
            Konfirmasi Password
          </InputGroupPassword>
          {fieldErrors.confirmPassword && <p className="-mt-4 mb-4 text-sm text-red-500">{fieldErrors.confirmPassword}</p>}
        </div>
      </div>
      
      <div className="mt-4">
      {error && <p className="mb-2 text-sm text-red-500">{error}</p>}
      {success && <p className="mb-2 text-sm text-green-600">{success}</p>}
      </div>
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
