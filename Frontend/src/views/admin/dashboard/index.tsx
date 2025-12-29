"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShoppingBag, DollarSign, Store, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils"; // Assuming this utility exists, otherwise I'll implement inline
import { toast } from "sonner";

interface DashboardStats {
  users: {
    total: number;
    sellers: number;
  };
  orders: {
    total: number;
    revenue: number;
    recent: any[];
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Dashboard Stats Data:", data);
        setStats(data);
      } else {
        toast.error("Gagal memuat data dashboard");
      }
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
     return (
        <AdminLayout>
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        </AdminLayout>
     )
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500">Selamat datang di panel admin.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total User"
          value={stats?.users?.total?.toString() || "0"}
          icon={<Users className="w-4 h-4 text-blue-600" />}
          description="Total pengguna terdaftar"
        />
        <StatsCard
          title="Total Penjual"
          value={stats?.users?.sellers?.toString() || "0"}
          icon={<Store className="w-4 h-4 text-orange-600" />}
          description="Toko aktif beroperasi"
        />
        <StatsCard
          title="Total Pesanan (Paid)"
          value={stats?.orders?.total?.toString() || "0"}
          icon={<ShoppingBag className="w-4 h-4 text-purple-600" />}
          description="Pesanan berhasil dibayar"
        />
        <StatsCard
          title="Pendapatan (GMV)"
          value={formatCurrency(stats?.orders?.revenue || 0)}
          icon={<DollarSign className="w-4 h-4 text-green-600" />}
          description="Total nilai transaksi selesai"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pesanan Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.orders.recent && stats.orders.recent.length > 0 ? (
                <div className="space-y-4">
                    {stats.orders.recent.map((order: any) => (
                        <div key={order.order_id} className="flex items-center justify-between border-b pb-2 last:border-0">
                            <div>
                                <p className="font-medium text-sm">{order.user_name}</p>
                                <p className="text-xs text-slate-500">{order.order_code}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-sm text-green-600">{formatCurrency(order.total_amount)}</p>
                                <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleDateString("id-ID")}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-slate-500">Belum ada data pesanan.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fitur Admin</CardTitle>
          </CardHeader>
           <CardContent>
            <p className="text-sm text-slate-500 mb-4">Gunakan sidebar untuk mengelola:</p>
            <ul className="list-disc list-inside text-sm space-y-2 text-slate-700">
                <li><b>Pengguna:</b> Lihat daftar user dan ban user bermasalah.</li>
                <li><b>Kategori:</b> Tambah atau edit kategori produk.</li>
                <li><b>Banner:</b> Update banner halaman depan.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function StatsCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-slate-500">{description}</p>
      </CardContent>
    </Card>
  );
}
