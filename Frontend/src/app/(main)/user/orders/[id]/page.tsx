"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  CreditCard,
  ArrowLeft,
  MapPin,
  Calendar,
  Phone,
  User,
  Copy,
  Clock,
  Store,
  ChevronRight,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface OrderItem {
  order_item_id: number;
  product_id: number;
  product_name?: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  variation?: string;
}

interface OrderShipping {
  recipient_name: string;
  phone_number: string;
  address_line: string;
  province: string;
  city: string;
  district: string;
  postal_code: string;
}

interface StatusLog {
  log_id: number;
  old_status: string | null;
  new_status: string;
  changed_by: string;
  note: string;
  created_at: string;
}

interface OrderDetail {
  order: {
    order_id: number;
    order_code: string;
    store_id: number;
    status: string;
    payment_status: string;
    subtotal_amount: number;
    shipping_amount: number;
    discount_amount: number;
    total_amount: number;
    shipping_courier_code: string;
    shipping_service_code: string;
    shipping_service_name: string;
    shipping_etd_min_days: number;
    shipping_etd_max_days: number;
    awb_number: string | null;
    created_at: string;
    paid_at: string | null;
    shipped_at: string | null;
    delivered_at: string | null;
    note: string | null;
  };
  items: OrderItem[];
  shipping: OrderShipping | null;
  logs: StatusLog[];
}

const statusSteps = [
  { key: "pending_unpaid", label: "Menunggu Pembayaran", icon: CreditCard },
  { key: "paid", label: "Pembayaran Diterima", icon: CheckCircle },
  { key: "processing", label: "Diproses Penjual", icon: Package },
  { key: "shipped", label: "Dalam Pengiriman", icon: Truck },
  { key: "delivered", label: "Pesanan Selesai", icon: CheckCircle },
];

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Fix: Mapped to /api/orders/my/:id
      const res = await fetch(`${API_BASE_URL}/api/orders/my/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Order not found");
      }

      const data = await res.json();
      setOrderDetail(data);
    } catch (e) {
      console.error("Error fetching order:", e);
      setError("Pesanan tidak ditemukan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  const handleSyncStatus = async () => {
    try {
        const token = localStorage.getItem("auth_token");
        const loadingToast = toast.loading("Memperbarui status...");
        
        const res = await fetch(`${API_BASE_URL}/api/payments/sync/${orderId}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
        
        toast.dismiss(loadingToast);

        if (res.ok) {
            toast.success("Status berhasil diperbarui");
            fetchOrderDetail(); // Refresh data
        } else {
             const d = await res.json();
             toast.error(d.message || "Gagal memperbarui status");
        }
    } catch(e) {
        toast.error("Gagal koneksi ke server");
    }
  };

  const handleCopyOrderCode = () => {
    if (orderDetail?.order.order_code) {
      navigator.clipboard.writeText(orderDetail.order.order_code);
      toast.success("Kode pesanan disalin");
    }
  };

  const handleCopyAwb = () => {
    if (orderDetail?.order.awb_number) {
      navigator.clipboard.writeText(orderDetail.order.awb_number);
      toast.success("Nomor resi disalin");
    }
  };

  const handlePayNow = async () => {
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
        }
      } else {
        toast.error("Gagal memulai pembayaran");
      }
    } catch (e) {
      console.error("Error:", e);
      toast.error("Terjadi kesalahan");
    }
  };

  const getCurrentStepIndex = () => {
    if (!orderDetail) return -1;
    const status = orderDetail.order.status;
    if (status === "cancelled") return -1;
    return statusSteps.findIndex((s) => s.key === status);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <span className="ml-3 text-gray-500">Memuat detail pesanan...</span>
      </div>
    );
  }

  if (error || !orderDetail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Pesanan Tidak Ditemukan
          </h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => router.push("/user/orders")}>
            Kembali ke Daftar Pesanan
          </Button>
        </div>
      </div>
    );
  }

  const { order, items, shipping, logs } = orderDetail;
  const currentStep = getCurrentStepIndex();
  const isCancelled = order.status === "cancelled";
  const isUnpaid =
    order.payment_status === "unpaid" || order.status === "pending_unpaid";

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="w-full max-w-[1000px] mx-auto px-4 pt-24 lg:pt-32">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/user/orders")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Daftar Pesanan
          </Button>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Detail Pesanan
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">
                  {order.order_code}
                </span>
                <button
                  onClick={handleCopyOrderCode}
                  className="text-orange-500 hover:text-orange-600"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex gap-2">
                 {isUnpaid && (
                    <Button
                        variant="outline"
                        onClick={handleSyncStatus}
                        className="border-orange-500 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Cek Payment
                    </Button>
                )}
                {isUnpaid && (
                <Button
                    onClick={handlePayNow}
                    className="bg-orange-500 hover:bg-orange-600"
                >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Bayar Sekarang
                </Button>
                )}
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        {!isCancelled && (
          <Card className="p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Status Pesanan</h3>
            <div className="relative">
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200" />
              <div
                className="absolute top-5 left-5 h-0.5 bg-orange-500 transition-all"
                style={{ width: `${Math.max(0, currentStep) * 25}%` }}
              />
              <div className="relative flex justify-between">
                {statusSteps.map((step, idx) => {
                  const StepIcon = step.icon;
                  const isCompleted = idx <= currentStep;
                  const isCurrent = idx === currentStep;

                  return (
                    <div
                      key={step.key}
                      className="flex flex-col items-center w-1/5"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                          isCompleted
                            ? "bg-orange-500 text-white"
                            : "bg-gray-200 text-gray-400"
                        } ${isCurrent ? "ring-4 ring-orange-200" : ""}`}
                      >
                        <StepIcon className="w-5 h-5" />
                      </div>
                      <p
                        className={`text-xs mt-2 text-center ${
                          isCompleted
                            ? "text-gray-900 font-medium"
                            : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {/* Cancelled Banner */}
        {isCancelled && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <div className="flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-500" />
              <div>
                <p className="font-semibold text-red-700">Pesanan Dibatalkan</p>
                <p className="text-sm text-red-600">
                  Pesanan ini telah dibatalkan
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Products */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Store className="w-5 h-5 text-gray-400" />
                <h3 className="font-semibold text-gray-900">Produk Dipesan</h3>
              </div>

              <div className="divide-y">
                {items.map((item) => (
                  <div
                    key={item.order_item_id}
                    className="py-4 first:pt-0 last:pb-0 flex gap-4"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      {item.product_image ? (
                        <Image
                          src={item.product_image}
                          alt={item.product_name || "Product"}
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

                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {item.product_name || `Product #${item.product_id}`}
                      </p>
                      {item.variation && (
                        <p className="text-xs text-gray-500">
                          {item.variation}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {item.quantity}x {formatPrice(item.unit_price)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatPrice(item.total_price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Shipping Info */}
            {shipping && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900">
                    Informasi Pengiriman
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {shipping.recipient_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {shipping.phone_number}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-700">
                        {shipping.address_line}
                      </p>
                      <p className="text-sm text-gray-500">
                        {shipping.district}, {shipping.city},{" "}
                        {shipping.province} {shipping.postal_code}
                      </p>
                    </div>
                  </div>

                  {order.shipping_courier_code && (
                    <div className="flex items-start gap-3 pt-3 border-t">
                      <Truck className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {order.shipping_courier_code.toUpperCase()} -{" "}
                          {order.shipping_service_name}
                        </p>
                        {order.awb_number && (
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-gray-500">
                              Resi: {order.awb_number}
                            </p>
                            <button
                              onClick={handleCopyAwb}
                              className="text-orange-500 hover:text-orange-600"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        {order.shipping_etd_min_days && (
                          <p className="text-xs text-gray-400 mt-1">
                            Estimasi: {order.shipping_etd_min_days}-
                            {order.shipping_etd_max_days} hari
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Status History */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-gray-400" />
                <h3 className="font-semibold text-gray-900">Riwayat Status</h3>
              </div>

              <div className="space-y-4">
                {logs.map((log, idx) => (
                  <div key={log.log_id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          idx === 0 ? "bg-orange-500" : "bg-gray-300"
                        }`}
                      />
                      {idx < logs.length - 1 && (
                        <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium text-gray-900 text-sm capitalize">
                        {log.new_status.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-gray-500">{log.note}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(log.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Ringkasan Pembayaran
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal Produk</span>
                  <span>{formatPrice(order.subtotal_amount)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Ongkos Kirim</span>
                  <span>{formatPrice(order.shipping_amount)}</span>
                </div>

                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Diskon</span>
                    <span className="text-green-600">
                      -{formatPrice(order.discount_amount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between pt-3 border-t">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-orange-600 text-lg">
                    {formatPrice(order.total_amount)}
                  </span>
                </div>
              </div>

              {/* Payment Status */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Status Pembayaran
                  </span>
                  <Badge
                    className={
                      isUnpaid
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }
                  >
                    {isUnpaid ? "Belum Dibayar" : "Sudah Dibayar"}
                  </Badge>
                </div>
                {order.paid_at && (
                  <p className="text-xs text-gray-400 mt-1">
                    Dibayar: {formatDate(order.paid_at)}
                  </p>
                )}
              </div>
            </Card>

            {/* Order Info */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Info Pesanan</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tanggal Pesan</span>
                  <span>{formatDate(order.created_at)}</span>
                </div>

                {order.shipped_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tanggal Kirim</span>
                    <span>{formatDate(order.shipped_at)}</span>
                  </div>
                )}

                {order.delivered_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tanggal Diterima</span>
                    <span>{formatDate(order.delivered_at)}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Actions */}
            <div className="space-y-2">
              {isUnpaid && (
                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  onClick={handlePayNow}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Bayar Sekarang
                </Button>
              )}

              {order.status === "shipped" && order.awb_number && (
                <Button variant="outline" className="w-full">
                  <Truck className="w-4 h-4 mr-2" />
                  Lacak Pengiriman
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/user/orders")}
              >
                Kembali ke Daftar Pesanan
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
