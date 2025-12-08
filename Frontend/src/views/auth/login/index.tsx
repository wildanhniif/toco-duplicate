"use client";

import AuthLayout from "@/components/layouts/AuthLayout";
import LoginForm from "@/components/fragments/LoginForm";

export default function LoginView() {
  const typeForm = "login"
  return (
    <div className="relative flex justify-center items-center w-full h-dvh overflow-hidden">
      <AuthLayout title="Halo, Selamat Datang!" typeForm={typeForm}>
        <LoginForm />
      </AuthLayout>
      <div className="absolute -top-56 -right-28 w-120 h-120 md:w-200 md:h-200 bg-accent rounded-full z-0"></div>
      <div className="absolute -bottom-88 -left-20 -right-28 w-120 h-120 md:w-160 md:h-160 bg-accent rounded-full z-0"></div>
    </div>
  );
}
