import { Metadata } from "next";
import SellerSettingsView from "@/views/seller/settings";

export const metadata: Metadata = {
  title: "Pengaturan - Toco Seller",
};

export default function SellerSettingsPage() {
  return <SellerSettingsView />;
}
