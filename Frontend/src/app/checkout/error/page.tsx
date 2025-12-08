"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderCode = searchParams.get("order");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Terjadi Kesalahan Pembayaran
        </h1>
        <p className="text-sm text-gray-600 mb-4">
          Maaf, terjadi masalah saat memproses pembayaranmu. Jangan khawatir,
          status pesanan tetap dapat kamu cek.
        </p>
        {orderCode && (
          <p className="text-sm text-gray-700 mb-4">
            Kode Pesanan: <span className="font-semibold">{orderCode}</span>
          </p>
        )}
        <p className="text-xs text-gray-500 mb-6">
          Jika saldo sudah terpotong namun status belum berubah, silakan tunggu
          beberapa saat atau hubungi layanan pelanggan.
        </p>

        <div className="flex flex-col gap-3">
          <Button
            className="w-full"
            onClick={() => router.push("/user/orders")}
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Lihat Daftar Pesanan
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/cart")}
          >
            Kembali ke Keranjang
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
