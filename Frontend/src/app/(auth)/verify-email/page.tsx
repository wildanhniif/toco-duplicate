import { Metadata } from "next";
import EmailVerificationView from "@/views/auth/verify-email";

export const metadata: Metadata = {
  title: "Verifikasi Email - Tokoo",
  description: "Verifikasi email Anda untuk mengaktifkan akun",
};

export default function VerifyEmailPage() {
  return <EmailVerificationView />;
}
