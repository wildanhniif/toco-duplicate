"use client";

import React from "react";
import Image from "next/image";
import { Package, Weight, Tag, Percent } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

interface CheckoutItemCardProps {
  item: CheckoutItem;
}

export default function CheckoutItemCard({ item }: CheckoutItemCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatWeight = (gram: number) => {
    if (gram >= 1000) {
      return `${(gram / 1000).toFixed(1)} kg`;
    }
    return `${gram} gram`;
  };

  const subtotal = item.unit_price * item.quantity;
  const totalWeight = (item.weight_gram || 0) * item.quantity;
  const discountAmount =
    item.discount_percent > 0
      ? (item.original_price - item.unit_price) * item.quantity
      : 0;

  return (
    <div className="flex gap-4 py-4 border-b last:border-b-0">
      {/* Product Image */}
      <div className="shrink-0">
        <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
          {item.product_image ? (
            <Image
              src={item.product_image}
              alt={item.product_name}
              fill
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.parentElement?.classList.add(
                  "flex",
                  "items-center",
                  "justify-center"
                );
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
              <Package className="w-8 h-8" />
            </div>
          )}
        </div>
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2">
          {item.product_name}
        </h4>

        {/* Variation */}
        {item.variation && (
          <div className="flex items-center gap-1 mb-1">
            <Tag className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
              {item.variation}
            </span>
          </div>
        )}

        {/* Weight & Quantity Info */}
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Weight className="w-3 h-3" />
            <span>{formatWeight(item.weight_gram || 0)} /pcs</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Package className="w-3 h-3" />
            <span>Total: {formatWeight(totalWeight)}</span>
          </div>
        </div>

        {/* Discount Badge */}
        {item.discount_percent > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0.5">
              <Percent className="w-2.5 h-2.5 mr-0.5" />
              HEMAT {item.discount_percent}%
            </Badge>
            <span className="text-xs text-green-600 font-medium">
              -{formatPrice(discountAmount)}
            </span>
          </div>
        )}
      </div>

      {/* Price Section */}
      <div className="text-right shrink-0 min-w-[120px]">
        {/* Unit Price */}
        <div className="mb-1">
          <span className="text-sm font-semibold text-gray-900">
            {formatPrice(item.unit_price)}
          </span>
          {item.discount_percent > 0 && (
            <p className="text-xs text-gray-400 line-through">
              {formatPrice(item.original_price)}
            </p>
          )}
        </div>

        {/* Quantity */}
        <div className="text-xs text-gray-500 mb-2">× {item.quantity} pcs</div>

        {/* Subtotal */}
        <div className="pt-2 border-t border-dashed border-gray-200">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">
            Subtotal
          </p>
          <p className="text-base font-bold text-orange-600">
            {formatPrice(subtotal)}
          </p>
        </div>
      </div>
    </div>
  );
}
