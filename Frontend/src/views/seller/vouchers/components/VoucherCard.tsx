import React from "react";
import {
  MoreVertical,
  Ticket,
  Users,
  Package,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";

interface VoucherCardProps {
  voucher: {
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
    status: string;
    current_status: string;
    min_transaction: number;
    max_discount?: number;
    product_count: number;
    usage_count: number;
  };
  onDuplicate: (id: number) => void;
  onEnd: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
}

export default function VoucherCard({
  voucher,
  onDuplicate,
  onEnd,
  onDelete,
  onEdit,
}: VoucherCardProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      upcoming: { label: "Mendatang", className: "bg-blue-100 text-blue-700" },
      active: {
        label: "Berlangsung",
        className: "bg-green-100 text-green-700",
      },
      ended: { label: "Berakhir", className: "bg-gray-100 text-gray-700" },
      cancelled: { label: "Dibatalkan", className: "bg-red-100 text-red-700" },
    };
    const variant = variants[status] || variants.active;
    return (
      <Badge className={`${variant.className} font-medium`}>
        {variant.label}
      </Badge>
    );
  };

  const getVoucherTypeBadge = (type: string) => {
    return type === "free_shipping" ? (
      <Badge
        variant="outline"
        className="bg-purple-50 text-purple-700 border-purple-200"
      >
        Gratis Ongkir
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="bg-orange-50 text-orange-700 border-orange-200"
      >
        Diskon
      </Badge>
    );
  };

  const getTargetBadge = (target: string) => {
    return target === "private" ? (
      <Badge
        variant="outline"
        className="bg-amber-50 text-amber-700 border-amber-200"
      >
        Khusus
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="bg-sky-50 text-sky-700 border-sky-200"
      >
        Publik
      </Badge>
    );
  };

  const formatDiscount = () => {
    if (voucher.voucher_type === "free_shipping") {
      return "Gratis Ongkir";
    }
    if (voucher.discount_type === "percentage") {
      return `${voucher.discount_value}%`;
    }
    return `Rp ${voucher.discount_value.toLocaleString("id-ID")}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const quotaPercentage = (voucher.quota_used / voucher.quota) * 100;

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        {/* Left Content */}
        <div className="flex-1 space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Ticket className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {voucher.title}
                </h3>
                {getStatusBadge(voucher.current_status)}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {getVoucherTypeBadge(voucher.voucher_type)}
                {getTargetBadge(voucher.target_type)}
                {voucher.voucher_code && (
                  <Badge variant="outline" className="font-mono text-xs">
                    {voucher.voucher_code}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Nominal */}
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Nominal</p>
              <p className="text-lg font-bold text-orange-600">
                {formatDiscount()}
              </p>
              {voucher.max_discount &&
                voucher.discount_type === "percentage" && (
                  <p className="text-xs text-gray-500">
                    Max: Rp {voucher.max_discount.toLocaleString("id-ID")}
                  </p>
                )}
            </div>

            {/* Kuota */}
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Kuota</p>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-900">
                  {voucher.quota_used} / {voucher.quota}
                </p>
                <Progress value={quotaPercentage} className="h-2" />
                <p className="text-xs text-gray-500">
                  Sisa: {voucher.remaining_quota}
                </p>
              </div>
            </div>

            {/* Periode */}
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Periode Promo</p>
              <div className="flex items-center gap-1 text-sm text-gray-900">
                <Calendar className="w-3 h-3" />
                <span className="text-xs">
                  {formatDate(voucher.start_date)}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                s/d {formatDate(voucher.end_date)}
              </div>
            </div>

            {/* Usage Stats */}
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Penggunaan</p>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-lg font-bold text-gray-900">
                  {voucher.usage_count}x
                </span>
              </div>
              {voucher.product_count > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Package className="w-3 h-3" />
                  {voucher.product_count} produk
                </div>
              )}
            </div>
          </div>

          {/* Min Transaction */}
          {voucher.min_transaction > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
              <Users className="w-4 h-4" />
              <span>
                Min. transaksi: Rp{" "}
                {voucher.min_transaction.toLocaleString("id-ID")}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(voucher.voucher_id)}>
              Edit Voucher
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(voucher.voucher_id)}>
              Duplicate Voucher
            </DropdownMenuItem>
            {voucher.current_status === "active" && (
              <DropdownMenuItem
                onClick={() => onEnd(voucher.voucher_id)}
                className="text-orange-600"
              >
                Akhiri Voucher
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => onDelete(voucher.voucher_id)}
              className="text-red-600"
            >
              Hapus Voucher
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
