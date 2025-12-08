"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SellerSidebar from "@/components/layouts/SellerSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, CalendarIcon } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type SellerOrderStatusTab =
  | "all"
  | "new" // Pesanan Baru
  | "to_ship" // Belum Dikirim / diproses
  | "shipped" // Dikirim
  | "delivered" // Selesai
  | "cancelled"; // Dibatalkan

interface SellerOrderListItem {
  order_id: number;
  order_code?: string;
  order_number?: string;
  status: string;
  total_amount?: number;
  subtotal_amount?: number;
  shipping_amount?: number;
  created_at: string;
  customer_name?: string;
  customer_email?: string;
  items_count?: number;
}

interface SellerOrdersResponse {
  orders: SellerOrderListItem[];
  total: number;
  page: number;
  limit: number;
}

export default function SellerOrdersView() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<SellerOrderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [activeTab, setActiveTab] = useState<SellerOrderStatusTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [period, setPeriod] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "seller") return;

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const authToken = window.localStorage.getItem("auth_token");
        if (!authToken) {
          setLoading(false);
          return;
        }

        const params = new URLSearchParams({
          status: activeTab,
          period,
          sort: sortBy,
          page: page.toString(),
          limit: limit.toString(),
        });

        if (searchQuery) {
          params.set("q", searchQuery);
        }

        const res = await fetch(
          `${API_BASE_URL}/api/orders/seller?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (!res.ok) {
          console.error("Failed to fetch seller orders", await res.text());
          setOrders([]);
          setTotal(0);
          return;
        }

        const data = (await res.json()) as SellerOrdersResponse;
        setOrders(data.orders || []);
        setTotal(data.total || 0);
      } catch (error) {
        console.error("Error fetching seller orders:", error);
        setOrders([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [
    activeTab,
    searchQuery,
    period,
    sortBy,
    page,
    limit,
    isAuthenticated,
    user?.role,
  ]);

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

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const formatCurrency = (value?: number | null) => {
    const num = typeof value === "number" ? value : 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatDateTime = (value: string) => {
    const d = new Date(value);
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
      case "new":
        return "Pesanan Baru";
      case "processing":
      case "to_ship":
        return "Belum Dikirim";
      case "shipped":
        return "Dikirim";
      case "delivered":
        return "Selesai";
      case "cancelled":
        return "Dibatalkan";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <SellerSidebar />

        <div className="flex-1 ml-64 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1">Daftar Pesanan</h1>
                <p className="text-gray-600 text-sm">
                  Kelola semua pesanan yang masuk ke tokomu.
                </p>
              </div>
            </div>

            {/* Tabs Status */}
            <div className="bg-white rounded-lg border">
              <div className="flex flex-wrap items-center gap-2 p-4 border-b text-sm">
                {[
                  { value: "all", label: "Daftar Pesanan" },
                  { value: "new", label: "Pesanan Baru" },
                  { value: "to_ship", label: "Belum Dikirim" },
                  { value: "shipped", label: "Dikirim" },
                  { value: "delivered", label: "Selesai" },
                  { value: "cancelled", label: "Dibatalkan" },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.value as SellerOrderStatusTab);
                      setPage(1);
                    }}
                    className={`px-4 py-2 rounded-full transition-colors ${
                      activeTab === tab.value
                        ? "bg-yellow-400 text-black"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search + Filters */}
              <div className="flex flex-wrap gap-4 p-4 border-b">
                <div className="flex-1 min-w-[220px] relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Cari invoice, nama pembeli, atau produk"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10"
                  />
                </div>

                <Select
                  value={period}
                  onValueChange={(val) => {
                    setPeriod(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-48 text-xs">
                    <SelectValue placeholder="Semua periode pesanan">
                      <span className="inline-flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        <span className="truncate">
                          {period === "all"
                            ? "Semua periode pesanan"
                            : period === "today"
                            ? "Hari ini"
                            : period === "7days"
                            ? "7 hari terakhir"
                            : period === "30days"
                            ? "30 hari terakhir"
                            : "Periode khusus"}
                        </span>
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua periode pesanan</SelectItem>
                    <SelectItem value="today">Hari ini</SelectItem>
                    <SelectItem value="7days">7 hari terakhir</SelectItem>
                    <SelectItem value="30days">30 hari terakhir</SelectItem>
                    <SelectItem value="this_month">Bulan ini</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={sortBy}
                  onValueChange={(val) => {
                    setSortBy(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-44 text-xs">
                    <SelectValue placeholder="Urutkan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Terbaru</SelectItem>
                    <SelectItem value="oldest">Terlama</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* List Pesanan */}
              <div className="p-4">
                {loading ? (
                  <p className="text-sm text-gray-600">Memuat pesanan...</p>
                ) : orders.length === 0 ? (
                  <p className="text-sm text-gray-600">
                    Belum ada pesanan untuk filter ini.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => {
                      const code =
                        order.order_number ||
                        order.order_code ||
                        `#${order.order_id}`;
                      const totalAmount =
                        order.total_amount ?? order.subtotal_amount ?? 0;

                      return (
                        <Card key={order.order_id} className="border-gray-200">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div>
                              <CardTitle className="text-sm font-semibold">
                                {code}
                              </CardTitle>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDateTime(order.created_at)}
                              </p>
                            </div>
                            <div className="text-right text-xs">
                              <p className="font-semibold text-gray-800">
                                {formatCurrency(totalAmount)}
                              </p>
                              <p className="mt-1 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">
                                {getStatusLabel(order.status)}
                              </p>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0 text-xs text-gray-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                            {order.customer_name && (
                              <span>Buyer: {order.customer_name}</span>
                            )}
                            {order.items_count != null && (
                              <span>{order.items_count} produk</span>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pagination sederhana */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 pb-4 text-xs text-gray-600">
                  <span>
                    Halaman {page} dari {totalPages} (total {total} pesanan)
                  </span>
                  <div className="space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page >= totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                    >
                      Berikutnya
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
