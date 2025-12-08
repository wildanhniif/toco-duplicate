"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SellerSidebar from "@/components/layouts/SellerSidebar";
import { useAuth } from "@/hooks/useAuth";
import {
  CalendarIcon,
  TrendingUp,
  ShoppingBag,
  Package,
  Star,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function SellerStatisticsView() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push("/seller/login");
      return;
    }
    if (user?.role !== "seller") {
      router.push("/");
      return;
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "seller") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <SellerSidebar />

        <div className="flex-1 ml-64 p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1">Statistik Toko</h1>
                <p className="text-gray-600 text-sm">
                  Lihat performa penjualan, produk, dan kepuasan pelanggan
                  tokomu.
                </p>
              </div>
              <Button variant="outline" size="sm">
                <CalendarIcon className="w-4 h-4 mr-2" />
                30 hari terakhir
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Penjualan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">Rp 0</p>
                  <p className="text-xs text-gray-500 mt-1">
                    +0% dibanding periode sebelumnya
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Pesanan Selesai
                  </CardTitle>
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Dalam 30 hari terakhir
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Produk Terjual
                  </CardTitle>
                  <Package className="w-4 h-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Jumlah item terjual
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Rating Rata-rata
                  </CardTitle>
                  <Star className="w-4 h-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">0.0</p>
                  <p className="text-xs text-gray-500 mt-1">Belum ada ulasan</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Tren Penjualan</CardTitle>
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center border border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500 text-sm">
                      Grafik penjualan akan ditampilkan di sini setelah data
                      transaksi tersedia.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Produk Terlaris</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-2">
                    Belum ada data produk terlaris.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>- Produk akan muncul di sini setelah ada penjualan.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
