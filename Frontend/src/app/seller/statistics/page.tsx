import type { Metadata } from "next";
import SellerStatisticsView from "@/views/seller/statistics";

export const metadata: Metadata = {
  title: "Statistik Toko - Toco Seller",
};

export default function SellerStatisticsPage() {
  return <SellerStatisticsView />;
}
