"use client";

import React from "react";
import Image from "next/image";
import { Minus, Plus, Trash2, AlertCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface CartItem {
  cart_item_id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  sku_id: number | null;
  variation: string | null;
  stock: number;
  quantity: number;
  unit_price: number;
  original_price: number;
  discount_percent: number;
  is_selected: boolean;
  weight_gram: number;
  subtotal: number;
}

interface CartItemCardProps {
  item: CartItem;
  onToggleSelect: (cartItemId: number, isSelected: boolean) => void;
  onUpdateQuantity: (cartItemId: number, quantity: number) => void;
  onDelete: (cartItemId: number) => void;
}

export default function CartItemCard({
  item,
  onToggleSelect,
  onUpdateQuantity,
  onDelete,
}: CartItemCardProps) {
  const isLowStock = item.stock < 10 && item.stock > 0;
  const isOutOfStock = item.stock === 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="flex gap-4 py-4 border-b last:border-b-0">
      {/* Checkbox */}
      <div className="flex-shrink-0 pt-1">
        <Checkbox
          checked={item.is_selected}
          onCheckedChange={(checked) =>
            onToggleSelect(item.cart_item_id, checked as boolean)
          }
          disabled={isOutOfStock}
        />
      </div>

      {/* Product Image */}
      <div className="flex-shrink-0">
        <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
          {item.product_image ? (
            <Image
              src={item.product_image}
              alt={item.product_name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Package className="w-8 h-8" />
            </div>
          )}
        </div>
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">
          {item.product_name}
        </h4>

        {/* Variation */}
        {item.variation && (
          <p className="text-sm text-gray-600 mt-1">
            Variasi: {item.variation}
          </p>
        )}

        {/* Stock Warning */}
        {isLowStock && (
          <div className="flex items-center gap-1 mt-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-xs text-yellow-600">
              Stok tinggal {item.stock}
            </span>
          </div>
        )}

        {isOutOfStock && (
          <Badge variant="destructive" className="mt-2">
            Stok Habis
          </Badge>
        )}

        {/* Price Section */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(item.unit_price)}
          </span>

          {item.discount_percent > 0 && (
            <>
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(item.original_price)}
              </span>
              <Badge variant="secondary" className="bg-red-100 text-red-700">
                {item.discount_percent}% OFF
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-end justify-between">
        {/* Delete Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(item.cart_item_id)}
          className="text-gray-400 hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() =>
              onUpdateQuantity(item.cart_item_id, item.quantity - 1)
            }
            disabled={item.quantity <= 1 || isOutOfStock}
          >
            <Minus className="w-4 h-4" />
          </Button>

          <span className="min-w-[32px] text-center font-medium">
            {item.quantity}
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() =>
              onUpdateQuantity(item.cart_item_id, item.quantity + 1)
            }
            disabled={item.quantity >= item.stock || isOutOfStock}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Subtotal */}
        <div className="text-right mt-2">
          <p className="text-xs text-gray-500">Subtotal</p>
          <p className="font-bold text-orange-600">
            {formatPrice(item.subtotal)}
          </p>
        </div>
      </div>
    </div>
  );
}
