"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Package,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  CreditCard,
  Search,
  ChevronRight,
  ShoppingBag,
  MapPin,
  Calendar,
  RefreshCw,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface OrderItem {
  order_item_id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  variation?: string;
}

interface Order {
  order_id: number;
  order_code: string;
  store_id: number;
  store_name: string;
  status: string;
  payment_status: string;
  subtotal_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  shipping_courier_code: string;
  shipping_service_name: string;
  shipping_etd_min_days: number;
  shipping_etd_max_days: number;
  awb_number: string | null;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  items?: OrderItem[];
  items_count?: number;
}

interface OrderStats {
  total: number;
  unpaid: number;
  ongoing: number;
  delivered: number;
  cancelled: number;
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ElementType; bgColor: string }
> = {
  pending_unpaid: {
    label: "Belum Dibayar",
    color: "text-yellow-700",
    icon: CreditCard,
    bgColor: "bg-yellow-100",
  },
  unpaid: {
    label: "Belum Dibayar",
    color: "text-yellow-700",
    icon: CreditCard,
    bgColor: "bg-yellow-100",
  },
  paid: {
    label: "Dibayar",
    color: "text-blue-700",
    icon: CheckCircle,
    bgColor: "bg-blue-100",
  },
  processing: {
    label: "Diproses",
    color: "text-blue-700",
    icon: Package,
    bgColor: "bg-blue-100",
  },
  shipped: {
    label: "Dikirim",
    color: "text-purple-700",
    icon: Truck,
    bgColor: "bg-purple-100",
  },
  delivered: {
    label: "Selesai",
    color: "text-green-700",
    icon: CheckCircle,
    bgColor: "bg-green-100",
  },
  cancelled: {
    label: "Dibatalkan",
    color: "text-red-700",
    icon: XCircle,
    bgColor: "bg-red-100",
  },
  refunded: {
    label: "Dikembalikan",
    color: "text-gray-700",
    icon: RefreshCw,
    bgColor: "bg-gray-100",
  },
};

export default function UserOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "all";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fetchOrderStats = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE_URL}/api/orders/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Error fetching order stats:", e);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        router.push("/login");
        return;
      }

      let statusFilter = "";
      switch (activeTab) {
        case "unpaid":
          statusFilter = "pending_unpaid";
          break;
        case "ongoing":
          statusFilter = "processing,shipped";
          break;
        case "delivered":
          statusFilter = "delivered";
          break;
        case "cancelled":
          statusFilter = "cancelled";
          break;
        default:
          statusFilter = "all";
      }

      const params = new URLSearchParams({
        status: statusFilter,
        page: String(page),
        limit: "10",
      });
      if (searchQuery) {
        params.append("q", searchQuery);
      }

      const res = await fetch(`${API_BASE_URL}/api/orders/my?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await res.json();
      setOrders(data.orders || []);
      setTotalOrders(data.total || 0);
    } catch (e) {
      console.error("Error fetching orders:", e);
      toast.error("Gagal memuat pesanan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderStats();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [activeTab, page, searchQuery]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPage(1);
    router.push(`/user/orders?tab=${value}`, { scroll: false });
  };

  const handlePayNow = async (orderId: number) => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE_URL}/api/payment/init`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ order_id: orderId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.redirect_url) {
          window.location.href = data.redirect_url;
        } else {
          toast.info("Silakan selesaikan pembayaran");
        }
      } else {
        toast.error("Gagal memulai pembayaran");
      }
    } catch (e) {
      console.error("Error initiating payment:", e);
      toast.error("Terjadi kesalahan");
    }
  };

  const getStatusInfo = (status: string, paymentStatus: string) => {
    if (paymentStatus === "unpaid" || status === "pending_unpaid") {
      return statusConfig.unpaid;
    }
    return statusConfig[status] || statusConfig.processing;
  };

  const renderOrderCard = (order: Order) => {
    const statusInfo = getStatusInfo(order.status, order.payment_status);
    const StatusIcon = statusInfo.icon;

    return (
      <Card
        key={order.order_id}
        className="mb-4 overflow-hidden hover:shadow-md transition-shadow"
      >
        {/* Order Header */}
        <div className="bg-gray-50 px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-sm">
                {order.store_name || `Store #${order.store_id}`}
              </span>
            </div>
            <span className="text-gray-300">|</span>
            <span className="text-xs text-gray-500">{order.order_code}</span>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              className={`${statusInfo.bgColor} ${statusInfo.color} text-xs flex items-center gap-1`}
            >
              <StatusIcon className="w-3 h-3" />
              {statusInfo.label}
            </Badge>
          </div>
        </div>

        {/* Order Content */}
        <div className="p-4">
          {/* Items Preview */}
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
              {order.items?.[0]?.product_image ? (
                <Image
                  src={order.items[0].product_image}
                  alt="Product"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm line-clamp-1">
                {order.items?.[0]?.product_name || "Produk"}
              </p>
              {order.items?.[0]?.variation && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {order.items[0].variation}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {order.items?.[0]?.quantity || 1}x{" "}
                {formatPrice(order.items?.[0]?.unit_price || 0)}
              </p>
              {(order.items_count || order.items?.length || 0) > 1 && (
                <p className="text-xs text-orange-600 mt-1">
                  +{(order.items_count || order.items?.length || 1) - 1} produk
                  lainnya
                </p>
              )}
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-500">Total Pesanan</p>
              <p className="font-bold text-orange-600">
                {formatPrice(order.total_amount)}
              </p>
            </div>
          </div>

          {/* Order Info */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(order.created_at)}</span>
            </div>
            {order.shipping_courier_code && (
              <div className="flex items-center gap-1">
                <Truck className="w-3 h-3" />
                <span>
                  {order.shipping_courier_code.toUpperCase()} -{" "}
                  {order.shipping_service_name}
                </span>
              </div>
            )}
            {order.awb_number && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>Resi: {order.awb_number}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/user/orders/${order.order_id}`)}
              className="text-xs"
            >
              Lihat Detail
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>

            <div className="flex items-center gap-2">
              {(order.payment_status === "unpaid" ||
                order.status === "pending_unpaid") && (
                <Button
                  size="sm"
                  onClick={() => handlePayNow(order.order_id)}
                  className="bg-orange-500 hover:bg-orange-600 text-xs"
                >
                  <CreditCard className="w-3 h-3 mr-1" />
                  Bayar Sekarang
                </Button>
              )}
              {order.status === "delivered" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(
                      `/product/${order.items?.[0]?.product_id}?review=true`
                    )
                  }
                  className="text-xs"
                >
                  Beri Ulasan
                </Button>
              )}
              {order.status === "shipped" && order.awb_number && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toast.info("Fitur lacak pengiriman segera hadir")
                  }
                  className="text-xs"
                >
                  <Truck className="w-3 h-3 mr-1" />
                  Lacak
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="w-full max-w-[1200px] mx-auto px-4 pt-32">
        {/* Header */}
        <div className="mb-6">
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Pesanan Saya</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="mb-4 pl-0 hover:pl-2 transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Pesanan Saya</h1>
          <p className="text-gray-600 mt-1">
            Kelola dan pantau semua pesanan Anda
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <Card
              className={`p-4 cursor-pointer transition-all ${
                activeTab === "all"
                  ? "ring-2 ring-orange-500"
                  : "hover:shadow-md"
              }`}
              onClick={() => handleTabChange("all")}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Package className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                  <p className="text-xs text-gray-500">Semua</p>
                </div>
              </div>
            </Card>

            <Card
              className={`p-4 cursor-pointer transition-all ${
                activeTab === "unpaid"
                  ? "ring-2 ring-orange-500"
                  : "hover:shadow-md"
              }`}
              onClick={() => handleTabChange("unpaid")}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <CreditCard className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.unpaid}
                  </p>
                  <p className="text-xs text-gray-500">Belum Bayar</p>
                </div>
              </div>
            </Card>

            <Card
              className={`p-4 cursor-pointer transition-all ${
                activeTab === "ongoing"
                  ? "ring-2 ring-orange-500"
                  : "hover:shadow-md"
              }`}
              onClick={() => handleTabChange("ongoing")}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.ongoing}
                  </p>
                  <p className="text-xs text-gray-500">Berlangsung</p>
                </div>
              </div>
            </Card>

            <Card
              className={`p-4 cursor-pointer transition-all ${
                activeTab === "delivered"
                  ? "ring-2 ring-orange-500"
                  : "hover:shadow-md"
              }`}
              onClick={() => handleTabChange("delivered")}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.delivered}
                  </p>
                  <p className="text-xs text-gray-500">Selesai</p>
                </div>
              </div>
            </Card>

            <Card
              className={`p-4 cursor-pointer transition-all ${
                activeTab === "cancelled"
                  ? "ring-2 ring-orange-500"
                  : "hover:shadow-md"
              }`}
              onClick={() => handleTabChange("cancelled")}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.cancelled}
                  </p>
                  <p className="text-xs text-gray-500">Dibatalkan</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Cari nomor pesanan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Orders List */}
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              <span className="ml-3 text-gray-500">Memuat pesanan...</span>
            </div>
          ) : orders.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {activeTab === "all"
                  ? "Belum ada pesanan"
                  : `Tidak ada pesanan ${
                      statusConfig[activeTab]?.label?.toLowerCase() || ""
                    }`}
              </h3>
              <p className="text-gray-500 mb-6">
                {activeTab === "all"
                  ? "Mulai belanja dan temukan produk menarik!"
                  : "Pesanan dengan status ini tidak ditemukan"}
              </p>
              <Button
                onClick={() => router.push("/products")}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Mulai Belanja
              </Button>
            </Card>
          ) : (
            <>
              {orders.map((order) => renderOrderCard(order))}

              {/* Pagination */}
              {totalOrders > 10 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Sebelumnya
                  </Button>
                  <span className="text-sm text-gray-500">
                    Halaman {page} dari {Math.ceil(totalOrders / 10)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= Math.ceil(totalOrders / 10)}
                    onClick={() => setPage(page + 1)}
                  >
                    Selanjutnya
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
