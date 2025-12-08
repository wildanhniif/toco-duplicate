import { Metadata } from "next";
import StoreCourierConfigView from "@/views/seller/settings/StoreCourierConfig";

export const metadata: Metadata = {
  title: "Atur Kurir Toko - Toco Seller",
};

export default function StoreCourierConfigPage() {
  return <StoreCourierConfigView />;
}
