"use client";

import React, { useState } from "react";
import { Tag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Summary {
  total_items: number;
  subtotal: number;
  delivery: number;
  voucher_discount: number;
  total: number;
}

interface CartSummaryProps {
  summary: Summary;
  onCheckout: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function CartSummary({ summary, onCheckout }: CartSummaryProps) {
  const [voucherCode, setVoucherCode] = useState("");
  const [loadingVoucher, setLoadingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherError("Masukkan kode voucher");
      return;
    }

    setLoadingVoucher(true);
    setVoucherError("");

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_BASE_URL}/api/cart/voucher`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: voucherCode }),
      });

      if (response.ok) {
        setAppliedVoucher(true);
        setVoucherError("");
        // Refresh cart data
        window.location.reload();
      } else {
        const data = await response.json();
        setVoucherError(data.message || "Voucher tidak valid");
      }
    } catch (error) {
      setVoucherError("Gagal menerapkan voucher");
    } finally {
      setLoadingVoucher(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="font-bold text-lg mb-4">Ringkasan Belanja</h3>

      {/* Voucher Input */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Pakai Voucher
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Kode voucher"
              value={voucherCode}
              onChange={(e) => {
                setVoucherCode(e.target.value.toUpperCase());
                setVoucherError("");
              }}
              className="pl-10"
              disabled={appliedVoucher}
            />
          </div>
          <Button
            size="sm"
            onClick={handleApplyVoucher}
            disabled={loadingVoucher || appliedVoucher}
            className="shrink-0"
          >
            {loadingVoucher ? "..." : appliedVoucher ? "✓" : "Pakai"}
          </Button>
        </div>
        {voucherError && (
          <p className="text-xs text-red-600 mt-1">{voucherError}</p>
        )}
        {appliedVoucher && !voucherError && (
          <p className="text-xs text-green-600 mt-1">
            Voucher berhasil diterapkan!
          </p>
        )}
      </div>

      <div className="border-t pt-4 space-y-3">
        {/* Total Items */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            Total Belanja ({summary.total_items} item)
          </span>
          <span className="font-medium">{formatPrice(summary.subtotal)}</span>
        </div>

        {/* Delivery */}
        {summary.delivery > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Ongkir</span>
            <span className="font-medium">{formatPrice(summary.delivery)}</span>
          </div>
        )}

        {/* Voucher Discount */}
        {summary.voucher_discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Voucher</span>
            <span className="font-medium text-green-600">
              -{formatPrice(summary.voucher_discount)}
            </span>
          </div>
        )}

        {/* Total */}
        <div className="border-t pt-3 flex justify-between items-center">
          <span className="font-bold text-gray-900">Total Harga</span>
          <div className="text-right">
            <span className="text-2xl font-bold text-orange-600">
              {formatPrice(summary.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <Button
        className="w-full mt-6"
        size="lg"
        onClick={onCheckout}
        disabled={summary.total_items === 0}
      >
        Beli ({summary.total_items})
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>

      {/* Info */}
      <p className="text-xs text-gray-500 text-center mt-3">
        Dengan melanjutkan, Anda menyetujui syarat dan ketentuan yang berlaku
      </p>
    </Card>
  );
}
