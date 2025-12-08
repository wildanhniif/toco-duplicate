import { Metadata } from "next";
import SellerLoginView from "@/views/seller/login";

export const metadata: Metadata = {
  title: "Login - Toco Seller",
  description: "Login untuk masuk ke dashboard seller Toco",
};

export default function SellerLoginPage() {
  return <SellerLoginView />;
}
