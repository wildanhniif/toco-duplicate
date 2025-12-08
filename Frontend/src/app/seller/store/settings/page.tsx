import { Metadata } from "next";
import SellerStoreSettingsView from "@/views/seller/store-settings";

export const metadata: Metadata = {
  title: "Pengaturan Toko - Toco Seller",
};

export default function SellerStoreSettingsPage() {
  return <SellerStoreSettingsView />;
}
