"use client";

import React from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProductVariant {
  variant_id: number;
  variant_name: string;
  variant_value: string;
  price_adjustment: number;
  image_url: string | null;
  stock_quantity: number;
  sku: string | null;
}

interface ProductVariantSelectorProps {
  variants: ProductVariant[];
  selectedVariantId: number | null;
  onVariantSelect: (variantId: number | null) => void;
  basePrice: number;
}

export default function ProductVariantSelector({
  variants,
  selectedVariantId,
  onVariantSelect,
  basePrice,
}: ProductVariantSelectorProps) {
  if (!variants || variants.length === 0) {
    return null;
  }

  // Group variants by variant_name
  const variantGroups = variants.reduce((acc, variant) => {
    if (!acc[variant.variant_name]) {
      acc[variant.variant_name] = [];
    }
    acc[variant.variant_name].push(variant);
    return acc;
  }, {} as { [key: string]: ProductVariant[] });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const selectedVariant = variants.find((v) => v.variant_id === selectedVariantId);

  return (
    <div className="space-y-4">
      {Object.entries(variantGroups).map(([groupName, groupVariants]) => (
        <div key={groupName} className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">{groupName}</h3>
            {selectedVariant && selectedVariant.variant_name === groupName && (
              <span className="text-sm text-gray-600">
                {selectedVariant.variant_value}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {groupVariants.map((variant) => {
              const isSelected = selectedVariantId === variant.variant_id;
              const isOutOfStock = variant.stock_quantity === 0;
              const finalPrice = basePrice + variant.price_adjustment;

              return (
                <button
                  key={variant.variant_id}
                  type="button"
                  onClick={() =>
                    !isOutOfStock && onVariantSelect(variant.variant_id)
                  }
                  disabled={isOutOfStock}
                  className={`relative rounded-lg border-2 p-2 transition-all ${
                    isSelected
                      ? "border-yellow-500 bg-yellow-50 ring-2 ring-yellow-300"
                      : isOutOfStock
                      ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-50"
                      : "border-gray-200 hover:border-yellow-400 hover:bg-yellow-50/50"
                  }`}
                >
                  {/* Variant Image (if available) */}
                  {variant.image_url && (
                    <div className="relative w-full aspect-square mb-2 rounded overflow-hidden bg-gray-100">
                      <Image
                        src={variant.image_url}
                        alt={variant.variant_value}
                        fill
                        sizes="100px"
                        className="object-cover"
                      />
                    </div>
                  )}

                  {/* Variant Value */}
                  <p
                    className={`text-xs font-medium text-center ${
                      isSelected ? "text-yellow-700" : "text-gray-700"
                    }`}
                  >
                    {variant.variant_value}
                  </p>

                  {/* Price Adjustment */}
                  {variant.price_adjustment !== 0 && (
                    <p className="text-[10px] text-gray-500 text-center mt-1">
                      {variant.price_adjustment > 0 ? "+" : ""}
                      {formatPrice(variant.price_adjustment)}
                    </p>
                  )}

                  {/* Selected Check Mark */}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}

                  {/* Out of Stock Badge */}
                  {isOutOfStock && (
                    <Badge
                      variant="destructive"
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px]"
                    >
                      Habis
                    </Badge>
                  )}

                  {/* Low Stock Warning */}
                  {!isOutOfStock && variant.stock_quantity < 5 && (
                    <p className="text-[9px] text-orange-600 text-center mt-0.5">
                      Sisa {variant.stock_quantity}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
