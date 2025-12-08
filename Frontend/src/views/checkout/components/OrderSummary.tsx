"use client";

import React, { useState } from "react";
import {
  ShoppingBag,
  Tag,
  Truck,
  Package,
  Percent,
  Shield,
  ChevronDown,
  ChevronUp,
  Receipt,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Summary {
  total_items: number;
  subtotal: number;
  delivery: number;
  voucher_discount: number;
  total: number;
  // Extended fields
  product_discount?: number;
  service_fee?: number;
  insurance_fee?: number;
  handling_fee?: number;
}

interface VoucherData {
  voucher_id: number;
  code?: string;
  discount_amount: number;
}

interface OrderSummaryProps {
  summary: Summary;
  voucher: VoucherData | null;
  onCheckout: () => void;
  loading: boolean;
  onVoucherApplied?: () => void;
}

export default function OrderSummary({
  summary,
  voucher,
  onCheckout,
  loading,
  onVoucherApplied,
}: OrderSummaryProps) {
  const [showDetails, setShowDetails] = useState(true);
  const [voucherCode, setVoucherCode] = useState("");
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Calculate service fee (biaya layanan) - typically 1% of subtotal
  const serviceFee = summary.service_fee ?? Math.round(summary.subtotal * 0.01);

  // Calculate handling fee (biaya penanganan) - flat fee
  const handlingFee = summary.handling_fee ?? 1000;

  // Calculate insurance (optional)
  const insuranceFee = summary.insurance_fee ?? 0;

  // Calculate product discount from original prices
  const productDiscount = summary.product_discount ?? 0;

  // Calculate total savings
  const totalSavings = (summary.voucher_discount || 0) + productDiscount;

  // Calculate grand total with all fees
  const grandTotal =
    summary.subtotal +
    summary.delivery +
    serviceFee +
    handlingFee +
    insuranceFee -
    summary.voucher_discount;

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      toast.error("Masukkan kode voucher");
      return;
    }

    setApplyingVoucher(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE_URL}/api/cart/voucher`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: voucherCode.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Voucher tidak valid");
        return;
      }

      toast.success(
        `Voucher berhasil diterapkan! Hemat ${formatPrice(data.discount)}`
      );
      setVoucherCode("");
      onVoucherApplied?.();
    } catch (e) {
      console.error("Error applying voucher:", e);
      toast.error("Gagal menerapkan voucher");
    } finally {
      setApplyingVoucher(false);
    }
  };

  return (
    <Card className="p-6 sticky top-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-orange-600" />
          <h3 className="font-bold text-lg">Ringkasan Belanja</h3>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          {showDetails ? "Sembunyikan" : "Detail"}
          {showDetails ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      </div>

      <div className="space-y-3">
        {/* Product Subtotal */}
        <div className="flex justify-between text-sm">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              Subtotal Produk ({summary.total_items} barang)
            </span>
          </div>
          <span className="font-medium">{formatPrice(summary.subtotal)}</span>
        </div>

        {showDetails && (
          <>
            {/* Product Discount */}
            {productDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">Diskon Produk</span>
                </div>
                <span className="font-medium text-green-600">
                  -{formatPrice(productDiscount)}
                </span>
              </div>
            )}

            {/* Delivery Fee */}
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Biaya Pengiriman</span>
              </div>
              <span className="font-medium">
                {summary.delivery > 0 ? (
                  formatPrice(summary.delivery)
                ) : (
                  <span className="text-gray-400">Pilih kurir</span>
                )}
              </span>
            </div>

            {/* Service Fee */}
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Biaya Layanan</span>
              </div>
              <span className="font-medium">{formatPrice(serviceFee)}</span>
            </div>

            {/* Handling Fee */}
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Biaya Penanganan</span>
              </div>
              <span className="font-medium">{formatPrice(handlingFee)}</span>
            </div>

            {/* Insurance Fee (if applicable) */}
            {insuranceFee > 0 && (
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-600">Asuransi Pengiriman</span>
                </div>
                <span className="font-medium">{formatPrice(insuranceFee)}</span>
              </div>
            )}
          </>
        )}

        {/* Voucher Section */}
        <div className="border-t pt-3 mt-3">
          {voucher && summary.voucher_discount > 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-green-600" />
                  <div>
                    <span className="text-sm font-medium text-green-900">
                      Voucher Diterapkan
                    </span>
                    {voucher.code && (
                      <p className="text-xs text-green-600">{voucher.code}</p>
                    )}
                  </div>
                </div>
                <span className="text-sm font-bold text-green-600">
                  -{formatPrice(summary.voucher_discount)}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-gray-700">
                  Punya Kode Voucher?
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Masukkan kode"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  className="text-sm"
                  disabled={applyingVoucher}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleApplyVoucher}
                  disabled={applyingVoucher || !voucherCode.trim()}
                  className="shrink-0"
                >
                  {applyingVoucher ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Pakai"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Total Savings */}
        {totalSavings > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-orange-800">
                Total Hemat
              </span>
              <span className="text-sm font-bold text-orange-600">
                {formatPrice(totalSavings)}
              </span>
            </div>
          </div>
        )}

        {/* Grand Total */}
        <div className="border-t pt-4 mt-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-900">Total Pembayaran</span>
            <div className="text-right">
              <span className="text-2xl font-bold text-orange-600">
                {formatPrice(grandTotal)}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 text-right mt-1">
            Termasuk pajak dan biaya lainnya
          </p>
        </div>
      </div>

      {/* Checkout Button */}
      <Button
        className="w-full mt-6 h-12 text-base font-semibold bg-orange-500 hover:bg-orange-600"
        size="lg"
        onClick={onCheckout}
        disabled={
          loading || summary.total_items === 0 || summary.delivery === 0
        }
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Memproses Pesanan...
          </>
        ) : summary.delivery === 0 ? (
          <>
            <Truck className="w-5 h-5 mr-2" />
            Pilih Metode Pengiriman
          </>
        ) : (
          <>
            <ShoppingBag className="w-5 h-5 mr-2" />
            Beli & Bayar
          </>
        )}
      </Button>

      {/* Payment Methods */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 font-medium mb-2">
          Metode Pembayaran:
        </p>
        <div className="flex flex-wrap gap-2">
          {["BCA", "Mandiri", "BNI", "GoPay", "OVO", "QRIS"].map((method) => (
            <span
              key={method}
              className="text-[10px] bg-white border border-gray-200 rounded px-2 py-1 text-gray-600"
            >
              {method}
            </span>
          ))}
        </div>
      </div>

      {/* Terms */}
      <p className="text-xs text-gray-500 text-center mt-4">
        Dengan melakukan pembelian, Anda menyetujui{" "}
        <a href="/terms" className="text-orange-600 hover:underline">
          Syarat & Ketentuan
        </a>{" "}
        dan{" "}
        <a href="/privacy" className="text-orange-600 hover:underline">
          Kebijakan Privasi
        </a>
      </p>
    </Card>
  );
}
