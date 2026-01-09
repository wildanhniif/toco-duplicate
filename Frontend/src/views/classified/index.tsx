"use client";

import { useEffect, useState } from "react";
import CardProduct from "@/components/composites/CardProduct";
import { PackageX } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ApiProduct {
  product_id: number;
  name: string;
  slug?: string;
  city?: string;
  stock_quantity?: number;
  price?: number;
  primary_image?: string;
  discount_percentage?: number;
}

export default function ClassifiedView() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ApiProduct[]>([]);

  useEffect(() => {
    const fetchClassified = async () => {
      setLoading(true);
      try {
        // Assuming 'classified' matches the backend 'classification' or 'product_type' logic
        const res = await fetch(`${API_BASE_URL}/api/products?classification=classified&status=active&limit=50`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setProducts(data);
        }
      } catch (error) {
        console.error("Error fetching classified:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassified();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 pt-40 pb-12">
      <div className="w-full max-w-[1440px] mx-auto px-[5%]">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Tokoo Classified <span className="text-xs bg-black text-white px-2 py-1 rounded-full">Iklan Baris</span>
          </h1>
          <p className="text-gray-500 mt-2">Temukan barang-barang unik dan penawaran menarik di sekitar Anda.</p>
        </div>

        {loading ? (
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-80 bg-gray-100 rounded-xl animate-pulse" />
              ))}
           </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
            {products.map((product) => (
              <CardProduct
                key={product.product_id}
                id={product.product_id}
                slug={product.slug}
                title={product.name}
                city={product.city ?? "Kota Jakarta"}
                stock={product.stock_quantity ?? 0}
                price={product.price ?? 0}
                img={product.primary_image || "/iphone-product.webp"}
                discountPercentage={product.discount_percentage}
              />
            ))}
          </div>
        ) : (
           <div className="flex flex-col items-center justify-center py-20 text-center min-h-[400px]">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                 <PackageX className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Belum ada Iklan Baris</h3>
              <p className="text-gray-500 mb-8 max-w-md">
                Jadilah yang pertama memasang iklan disini! Unggah produk preloved atau unikmu sekarang.
              </p>
           </div>
        )}
      </div>
    </main>
  );
}
