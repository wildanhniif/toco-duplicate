"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import CheckoutAddressCard from "./components/CheckoutAddressCard";
import CheckoutItemCard from "./components/CheckoutItemCard";
import ShippingSelector from "./components/ShippingSelector";
import OrderSummary from "./components/OrderSummary";
import { toast } from "sonner";

interface CheckoutItem {
  cart_item_id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  sku_id: number | null;
  variation: string | null;
  quantity: number;
  unit_price: number;
  original_price: number;
  discount_percent: number;
  weight_gram: number;
}

interface StoreGroup {
  store_id: number;
  store_name: string;
  items: CheckoutItem[];
  shipping: any;
}

interface Address {
  address_id: number;
  label: string;
  recipient_name: string;
  phone_number: string;
  address_line: string;
  province: string;
  city: string;
  district: string;
  subdistrict: string;
  postal_code: string;
}

interface CheckoutData {
  address: Address | null;
  voucher: any;
  groups: StoreGroup[];
  stock_errors: any[];
  summary: {
    total_items: number;
    subtotal: number;
    delivery: number;
    voucher_discount: number;
    total: number;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function CheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [notes, setNotes] = useState<{ [storeId: number]: string }>({});
  const [creatingOrder, setCreatingOrder] = useState(false);

  const fetchCheckout = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_BASE_URL}/api/checkout/summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCheckoutData(data);

        // Check stock errors
        if (data.stock_errors && data.stock_errors.length > 0) {
          toast.error(
            "Beberapa produk stoknya tidak mencukupi. Silakan kembali ke keranjang."
          );
          router.push("/cart");
        }
      }
    } catch (error) {
      console.error("Error fetching checkout:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckout();
  }, []);

  const handleCreateOrder = async () => {
    if (!checkoutData?.address) {
      toast.error("Pilih alamat pengiriman terlebih dahulu");
      return;
    }

    if (
      !window.confirm(
        `Lanjutkan pembayaran sebesar ${formatPrice(
          checkoutData.summary.total
        )}?`
      )
    ) {
      return;
    }

    setCreatingOrder(true);

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `${API_BASE_URL}/api/checkout/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success("Pesanan berhasil dibuat!");

        const firstOrder = data.orders?.[0];

        if (firstOrder && firstOrder.order_id) {
          try {
            const paymentResponse = await fetch(
              `${API_BASE_URL}/api/payments/init`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ order_id: firstOrder.order_id }),
              }
            );

            if (paymentResponse.ok) {
              const payData = await paymentResponse.json();
              if (payData.redirect_url) {
                window.location.href = payData.redirect_url;
                return;
              }
              if (payData.snap_token) {
                // Jika hanya ada snap_token tanpa redirect_url,
                // fallback ke halaman pesanan pengguna.
                toast.info(
                  "Pembayaran berhasil diinisiasi. Silakan cek halaman pesanan Anda."
                );
              }
            } else {
              const payError = await paymentResponse.json().catch(() => null);
              toast.error(
                payError?.message ||
                  "Gagal memulai pembayaran, cek pesanan Anda."
              );
            }
          } catch (e) {
            console.error("Error initializing payment:", e);
            toast.error(
              "Pesanan dibuat tetapi gagal memulai pembayaran. Cek halaman pesanan."
            );
          }
        } else {
          toast.error(
            "Pesanan dibuat tetapi data order tidak lengkap. Cek halaman pesanan."
          );
        }

        // Fallback: jika tidak redirect ke Midtrans, arahkan ke halaman pesanan user
        router.push("/user/orders?tab=unpaid");
      } else {
        const error = await response.json();
        toast.error(error.message || "Gagal membuat pesanan");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Terjadi kesalahan saat membuat pesanan");
    } finally {
      setCreatingOrder(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-gray-400 animate-pulse" />
          <p className="mt-4 text-gray-600">Memuat checkout...</p>
        </div>
      </div>
    );
  }

  if (!checkoutData || checkoutData.groups.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-24 h-24 mx-auto text-gray-300" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Tidak Ada Produk untuk Checkout
          </h2>
          <p className="mt-2 text-gray-600">
            Silakan pilih produk di keranjang terlebih dahulu
          </p>
          <Button className="mt-6" onClick={() => router.push("/cart")}>
            Kembali ke Keranjang
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="w-full max-w-[1440px] mx-auto px-[5%] pt-32 lg:pt-40">
        {/* Header */}
        <nav className="text-sm text-gray-600 mb-4 flex flex-wrap items-center gap-1">
          <span className="cursor-pointer" onClick={() => router.push("/")}>
            Beranda
          </span>
          <span>/</span>
          <span className="truncate max-w-[140px] md:max-w-xs">Checkout</span>
        </nav>
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Address */}
            <CheckoutAddressCard
              address={checkoutData.address}
              onAddressChange={fetchCheckout}
            />

            {/* Products by Store */}
            {checkoutData.groups.map((group) => (
              <Card key={group.store_id} className="p-6">
                {/* Store Name */}
                <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                  <Package className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-gray-900">
                    {group.store_name}
                  </h3>
                </div>

                {/* Store Items */}
                <div className="space-y-4 mb-6">
                  {group.items.map((item, idx) => (
                    <CheckoutItemCard key={idx} item={item} />
                  ))}
                </div>

                {/* Shipping Selector */}
                <ShippingSelector
                  storeId={group.store_id}
                  shipping={group.shipping}
                  onShippingChange={fetchCheckout}
                />

                {/* Notes */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catatan untuk Penjual (Opsional)
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows={3}
                    placeholder="Contoh: Warna merah, ukuran L"
                    value={notes[group.store_id] || ""}
                    onChange={(e) =>
                      setNotes({ ...notes, [group.store_id]: e.target.value })
                    }
                  />
                </div>
              </Card>
            ))}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <OrderSummary
                summary={checkoutData.summary}
                voucher={checkoutData.voucher}
                onCheckout={handleCreateOrder}
                loading={creatingOrder}
                onVoucherApplied={fetchCheckout}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
