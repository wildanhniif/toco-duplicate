import type { Metadata } from "next";
import ProductsView from "@/views/products";

export const metadata: Metadata = {
  title: "Daftar Produk | Tokoo",
};

export default function ProductsPage() {
  return <ProductsView />;
}
