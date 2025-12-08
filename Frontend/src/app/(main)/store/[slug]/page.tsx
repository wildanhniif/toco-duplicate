import type { Metadata } from "next";
import StorePublicView from "@/views/store-public";

export const metadata: Metadata = {
  title: "Toko | Tokoo",
};

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <StorePublicView slug={slug} />;
}
