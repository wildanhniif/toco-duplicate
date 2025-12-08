"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Filter, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import SellerSidebar from "@/components/layouts/SellerSidebar";
import VoucherCard from "./components/VoucherCard";
import VoucherFilters from "./components/VoucherFilters";
import VoucherStats from "./components/VoucherStats";
import PeriodFilter from "./components/PeriodFilter";
import { toast } from "sonner";

interface Voucher {
  voucher_id: number;
  title: string;
  voucher_code?: string;
  voucher_type: "discount" | "free_shipping";
  target_type: "public" | "private";
  discount_type: "percentage" | "fixed";
  discount_value: number;
  quota: number;
  quota_used: number;
  remaining_quota: number;
  start_date: string;
  end_date: string;
  status: "upcoming" | "active" | "ended" | "cancelled";
  current_status: string;
  min_transaction: number;
  max_discount?: number;
  product_count: number;
  usage_count: number;
}

export default function VouchersPage() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Filters
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({
    start: null,
    end: null,
  });
  const [sort, setSort] = useState("newest");
  const [filters, setFilters] = useState<string[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch vouchers
  const fetchVouchers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");

      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        status: activeTab === "all" ? "all" : activeTab,
        sort,
      });

      if (search) params.append("search", search);
      if (period) params.append("period", period);
      if (dateRange.start)
        params.append("start_date", dateRange.start.toISOString());
      if (dateRange.end) params.append("end_date", dateRange.end.toISOString());

      // Add type filters
      if (filters.includes("free_shipping"))
        params.append("type", "free_shipping");
      if (filters.includes("discount")) params.append("type", "discount");

      // Add target filters
      if (filters.includes("public")) params.append("target", "public");
      if (filters.includes("private")) params.append("target", "private");

      const response = await fetch(
        `http://localhost:5000/api/vouchers?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setVouchers(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching vouchers:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, sort, period, dateRange, filters, search]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== undefined) {
        fetchVouchers();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search, fetchVouchers]);

  const handleDuplicate = async (voucherId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/vouchers/${voucherId}/duplicate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        fetchVouchers();
        toast.success("Voucher berhasil diduplikasi!");
      }
    } catch (error) {
      console.error("Error duplicating voucher:", error);
      toast.error("Gagal menduplikasi voucher");
    }
  };

  const handleEnd = async (voucherId: number) => {
    if (!confirm("Yakin ingin mengakhiri voucher ini?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/vouchers/${voucherId}/end`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        fetchVouchers();
        toast.success("Voucher berhasil diakhiri!");
      }
    } catch (error) {
      console.error("Error ending voucher:", error);
      toast.error("Gagal mengakhiri voucher");
    }
  };

  const handleDelete = async (voucherId: number) => {
    if (!confirm("Yakin ingin menghapus voucher ini?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/vouchers/${voucherId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        fetchVouchers();
        toast.success("Voucher berhasil dihapus!");
      }
    } catch (error) {
      console.error("Error deleting voucher:", error);
      toast.error("Gagal menghapus voucher");
    }
  };

  return (
    <div className="flex">
      <SellerSidebar />

      <div className="flex-1 ml-64 min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Voucher Promosi
              </h1>
              <p className="text-gray-600 mt-1">
                Kelola voucher dan promo toko Anda
              </p>
            </div>
            <Button
              onClick={() => router.push("/seller/vouchers/add")}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Voucher
            </Button>
          </div>

          {/* Stats */}
          <VoucherStats />

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="all">Semua Voucher</TabsTrigger>
              <TabsTrigger value="upcoming">Mendatang</TabsTrigger>
              <TabsTrigger value="active">Berlangsung</TabsTrigger>
              <TabsTrigger value="ended">Berakhir</TabsTrigger>
            </TabsList>

            {/* Filters Bar */}
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap gap-3">
                {/* Search */}
                <div className="flex-1 min-w-[300px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Cari promo..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Period Filter */}
                <PeriodFilter
                  value={period}
                  onChange={setPeriod}
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                />

                {/* Sort */}
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-[180px]">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Urutkan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Terbaru</SelectItem>
                    <SelectItem value="oldest">Terlama</SelectItem>
                    <SelectItem value="quota_desc">Kuota Terbanyak</SelectItem>
                    <SelectItem value="quota_asc">Kuota Tersedikit</SelectItem>
                    <SelectItem value="a_z">A-Z</SelectItem>
                    <SelectItem value="z_a">Z-A</SelectItem>
                  </SelectContent>
                </Select>

                {/* Filters */}
                <VoucherFilters value={filters} onChange={setFilters} />
              </div>

              {/* Active Filters */}
              {(filters.length > 0 || search || period) && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-600">Filter aktif:</span>
                  {search && (
                    <Badge variant="secondary" className="gap-1">
                      Pencarian: {search}
                      <button onClick={() => setSearch("")} className="ml-1">
                        ×
                      </button>
                    </Badge>
                  )}
                  {period && (
                    <Badge variant="secondary" className="gap-1">
                      Periode: {period}
                      <button onClick={() => setPeriod(null)} className="ml-1">
                        ×
                      </button>
                    </Badge>
                  )}
                  {filters.map((filter) => (
                    <Badge key={filter} variant="secondary" className="gap-1">
                      {filter}
                      <button
                        onClick={() =>
                          setFilters(filters.filter((f) => f !== filter))
                        }
                        className="ml-1"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      setPeriod(null);
                      setFilters([]);
                      setDateRange({ start: null, end: null });
                    }}
                    className="text-orange-600"
                  >
                    Reset semua
                  </Button>
                </div>
              )}
            </div>

            {/* Voucher List */}
            <TabsContent value={activeTab} className="mt-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  <p className="text-gray-600 mt-4">Memuat voucher...</p>
                </div>
              ) : vouchers.length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <Filter className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Belum ada voucher
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Mulai buat voucher promosi untuk meningkatkan penjualan
                  </p>
                  <Button
                    onClick={() => router.push("/seller/vouchers/add")}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Buat Voucher Pertama
                  </Button>
                </Card>
              ) : (
                <div className="space-y-4">
                  {vouchers.map((voucher) => (
                    <VoucherCard
                      key={voucher.voucher_id}
                      voucher={voucher}
                      onDuplicate={handleDuplicate}
                      onEnd={handleEnd}
                      onDelete={handleDelete}
                      onEdit={(id) =>
                        router.push(`/seller/vouchers/edit/${id}`)
                      }
                    />
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {page} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
