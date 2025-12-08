"use client";

import { useParams } from "next/navigation";
import ProductFormView from "@/views/seller/products/ProductForm";

export default function EditProductPage() {
  const params = useParams();
  const productId = params?.id as string;

  return <ProductFormView productId={productId} />;
}
