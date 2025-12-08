"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CalendarIcon, ChevronDown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SellerSidebar from "@/components/layouts/SellerSidebar";
import { useAuth } from "@/hooks/useAuth";

interface DashboardStats {
  pesanan_baru: number;
  pesanan_berlangsung: number;
  total_produk: number;
  chat_baru: number;
}

interface StoreInfo {
  store_id: number;
  name: string;
  slug: string;
  is_active: boolean;
  profile_image_url: string | null;
  description: string | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Format date range for display
const formatDateRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const formatDate = (d: Date) => {
    const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    return `${days[d.getDay()]}, ${d.getDate()} ${
      months[d.getMonth()]
    } ${d.getFullYear()}`;
  };

  return `${formatDate(start)} - ${formatDate(end)}`;
};

export default function SellerDashboardView() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    pesanan_baru: 0,
    pesanan_berlangsung: 0,
    total_produk: 0,
    chat_baru: 0,
  });
  const [totalTransaksi, setTotalTransaksi] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [dateRange] = useState(formatDateRange());
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [loadingStore, setLoadingStore] = useState(true);

  // Check if user is authenticated and is a seller
  useEffect(() => {
    // Tunggu sampai state auth selesai di-load
    if (isLoading) return;

    if (!isAuthenticated) {
      window.location.href = "/seller/login";
      return;
    }

    if (user?.role !== "seller") {
      window.location.href = "/";
      return;
    }
  }, [user, isAuthenticated, isLoading]);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!isAuthenticated || user?.role !== "seller") return;

      const authToken = localStorage.getItem("auth_token");
      if (!authToken) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/sellers/dashboard/stats`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
          setTotalTransaksi(data.total_transaksi || 0);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardStats();
  }, [isAuthenticated, user]);

  // Fetch store information
  useEffect(() => {
    const fetchStoreInfo = async () => {
      if (!isAuthenticated || user?.role !== "seller") return;

      const authToken = localStorage.getItem("auth_token");
      if (!authToken) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/sellers/stores/me`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStoreInfo(data.store);

          // Check if store is not active (setup incomplete)
          if (!data.store.is_active) {
            setShowSetupModal(true);
          }
        }
      } catch (error) {
        console.error("Error fetching store info:", error);
      } finally {
        setLoadingStore(false);
      }
    };

    fetchStoreInfo();
  }, [isAuthenticated, user]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || user?.role !== "seller") {
    // Redirect sudah di-trigger di useEffect
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Required Setup Modal */}
      <Dialog open={showSetupModal} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <DialogTitle className="text-center text-xl">
              Lengkapi Informasi Toko Anda
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              Sebelum memulai aktivitas penjualan, Anda wajib melengkapi
              informasi toko terlebih dahulu. Ini akan membantu pembeli mengenal
              toko Anda dengan lebih baik.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={() => {
                window.location.href = "/seller/store/setup";
              }}
              className="w-full"
            >
              Lengkapi Sekarang
            </Button>
            <p className="text-xs text-center text-gray-500">
              Anda tidak dapat mengakses fitur lain sebelum melengkapi informasi
              toko
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex">
        <SellerSidebar />

        {/* Main Content */}
        <div className="flex-1 ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Back to Home Button */}
            <div className="mb-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  ← Kembali ke Halaman Utama
                </Button>
              </Link>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">
                Hai, {user?.name || "testacct"}
              </h1>
              <p className="text-gray-600">
                Yuk, cek perkembangan tokomu hari ini.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Pesanan Baru
                  </CardTitle>
                  <div className="h-4 w-4 text-blue-600">📦</div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pesanan_baru}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Pesanan Berlangsung
                  </CardTitle>
                  <div className="h-4 w-4 text-orange-600">🚚</div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.pesanan_berlangsung}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Produk
                  </CardTitle>
                  <div className="h-4 w-4 text-green-600">📋</div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_produk}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Chat Baru
                  </CardTitle>
                  <div className="h-4 w-4 text-purple-600">💬</div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.chat_baru}</div>
                </CardContent>
              </Card>
            </div>

            {/* Total Transaksi Section */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Total Transaksi</CardTitle>
                  <Button variant="outline" className="text-sm">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {dateRange}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-4">
                  {loadingStats
                    ? "Loading..."
                    : `Rp ${totalTransaksi.toLocaleString("id-ID")}`}
                </div>
                <div className="h-64 flex items-center justify-center border border-dashed border-gray-300 rounded-lg">
                  {totalTransaksi > 0 ? (
                    <p className="text-gray-500">
                      Grafik transaksi akan ditampilkan di sini
                    </p>
                  ) : (
                    <p className="text-gray-500">Belum ada data transaksi</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Verification Banner - only show when store is not active */}
            {!loadingStore && storeInfo && !storeInfo.is_active && (
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-yellow-100 p-3 rounded-full">
                        <div className="h-8 w-8 bg-yellow-400 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">!</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-1">
                          Verifikasi akunmu dulu, yuk!
                        </h3>
                        <p className="text-gray-600 mb-2">
                          Supaya pelanggan semakin yakin sama pembelian mereka.
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Button asChild className="mb-2">
                        <Link href="/seller/store/setup">Verifikasi</Link>
                      </Button>
                      <p className="text-xs text-gray-500">Mulai Verifikasi</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
