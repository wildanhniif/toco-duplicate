import { Metadata } from "next";
import ProductFormView from "@/views/seller/products/ProductForm";

export const metadata: Metadata = {
  title: "Tambah Produk - Toco Seller",
};

export default function AddProductPage() {
  return <ProductFormView />;
}
