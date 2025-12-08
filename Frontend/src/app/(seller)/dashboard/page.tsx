import { Metadata } from "next";
import SellerDashboardView from "@/views/seller/dashboard";

export const metadata: Metadata = {
  title: "Dashboard - Toco Seller",
};

export default function SellerDashboardPage() {
  return <SellerDashboardView />;
}
