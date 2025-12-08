"use client";

import SellerAuthLayout from "@/components/layouts/SellerAuthLayout";
import SellerLoginForm from "@/components/fragments/SellerLoginForm";

export default function SellerLoginView() {
  return (
    <div className="relative flex justify-center items-center w-full h-dvh overflow-hidden">
      <SellerAuthLayout title="Selamat Datang, Seller!">
        <SellerLoginForm />
      </SellerAuthLayout>
      <div className="absolute -top-56 -right-28 w-120 h-120 md:w-200 md:h-200 bg-accent rounded-full z-0"></div>
      <div className="absolute -bottom-88 -left-20 -right-28 w-120 h-120 md:w-160 md:h-160 bg-accent rounded-full z-0"></div>
    </div>
  );
}
