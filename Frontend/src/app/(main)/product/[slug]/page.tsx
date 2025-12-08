import type { Metadata } from "next";
import ProductDetailView from "@/views/product-detail";

export const metadata: Metadata = {
  title: "Detail Produk | Tokoo",
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <ProductDetailView slug={slug} />;
}
