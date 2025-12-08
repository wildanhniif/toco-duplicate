import { Metadata } from "next";
import SellerOrdersView from "@/views/seller/orders";

export const metadata: Metadata = {
  title: "Pesanan - Toco Seller",
};

export default function SellerOrdersPage() {
  return <SellerOrdersView />;
}
