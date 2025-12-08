import { Metadata } from "next";
import SellerStoreSetupView from "@/views/seller/store-setup";

export const metadata: Metadata = {
  title: "Setup Toko - Toco Seller",
};

export default function SellerStoreSetupPage() {
  return <SellerStoreSetupView />;
}
