"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface MarketplaceFieldsProps {
  formData: any;
  setFormData: (data: any) => void;
}

export default function MarketplaceFields({
  formData,
  setFormData,
}: MarketplaceFieldsProps) {
  // Variant state
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [variantType, setVariantType] = useState("");
  const [variantValues, setVariantValues] = useState("");

  const handleAddVariant = () => {
    if (!variantType || !variantValues) return;

    const values = variantValues
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v);
    const newVariants = values.map((value) => ({
      variant_name: variantType,
      variant_value: value,
      stock: 0,
      sku: "",
    }));

    setFormData((prev: any) => ({
      ...prev,
      variants: [...prev.variants, ...newVariants],
    }));

    setVariantType("");
    setVariantValues("");
  };

  const handleRemoveVariant = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      variants: prev.variants.filter((_: any, i: number) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Pasarkan Produk */}
      <div>
        <Label className="block mb-2">
          Pasarkan Produk <span className="text-red-500">*</span>
        </Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="product_type"
              value="marketplace"
              checked={formData.product_type === "marketplace"}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  product_type: e.target.value,
                }))
              }
              className="w-4 h-4"
            />
            <span>Toco Marketplace</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="product_type"
              value="classified"
              checked={formData.product_type === "classified"}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  product_type: e.target.value,
                }))
              }
              className="w-4 h-4"
            />
            <span>Toco Classified</span>
          </label>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {formData.product_type === "marketplace"
            ? "Transaksi melalui platform Toco"
            : "Media promosi, transaksi di luar platform"}
        </p>
      </div>

      {/* Varian Produk */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Varian Produk (Opsional)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowVariantForm(!showVariantForm)}
          >
            {showVariantForm ? "Tutup" : "Tambah Varian"}
          </Button>
        </div>

        {showVariantForm && (
          <div className="border rounded-lg p-4 mb-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="variantType">Tipe Varian</Label>
                <Input
                  id="variantType"
                  value={variantType}
                  onChange={(e) => setVariantType(e.target.value)}
                  placeholder="Contoh: Size, Color"
                  list="variant-types"
                />
                <datalist id="variant-types">
                  <option value="Size" />
                  <option value="Color" />
                  <option value="Material" />
                </datalist>
              </div>
              <div>
                <Label htmlFor="variantValues">
                  Nilai Varian (pisahkan dengan koma)
                </Label>
                <Input
                  id="variantValues"
                  value={variantValues}
                  onChange={(e) => setVariantValues(e.target.value)}
                  placeholder="Contoh: S, M, L, XL"
                />
              </div>
            </div>
            <Button type="button" onClick={handleAddVariant} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Varian
            </Button>
          </div>
        )}

        {formData.variants.length > 0 && (
          <div className="space-y-2">
            {formData.variants.map((variant: any, index: number) => (
              <div
                key={index}
                className="flex items-center gap-4 p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <span className="font-medium">{variant.variant_name}:</span>{" "}
                  {variant.variant_value}
                </div>
                <Input
                  type="number"
                  placeholder="Stok"
                  value={variant.stock}
                  onChange={(e) => {
                    const newVariants = [...formData.variants];
                    newVariants[index].stock = parseInt(e.target.value) || 0;
                    setFormData((prev: any) => ({
                      ...prev,
                      variants: newVariants,
                    }));
                  }}
                  className="w-24"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveVariant(index)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Harga */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price" className="block mb-2">
            Harga Produk <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              Rp
            </span>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData((prev: any) => ({ ...prev, price: e.target.value }))
              }
              placeholder="0"
              className="pl-10"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="discount" className="block mb-2">
            Diskon (%)
          </Label>
          <Input
            id="discount"
            type="number"
            value={formData.discount_percentage}
            onChange={(e) =>
              setFormData((prev: any) => ({
                ...prev,
                discount_percentage: e.target.value,
              }))
            }
            placeholder="0"
            min="0"
            max="100"
          />
        </div>
      </div>

      {/* Stok & SKU */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="stock" className="block mb-2">
            Stok Produk <span className="text-red-500">*</span>
          </Label>
          <Input
            id="stock"
            type="number"
            value={formData.stock_quantity}
            onChange={(e) =>
              setFormData((prev: any) => ({
                ...prev,
                stock_quantity: e.target.value,
              }))
            }
            placeholder="0"
            min="0"
            required
            disabled={formData.variants.length > 0}
          />
          {formData.variants.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">Stok diatur per varian</p>
          )}
        </div>

        <div>
          <Label htmlFor="sku" className="block mb-2">
            SKU
          </Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) =>
              setFormData((prev: any) => ({ ...prev, sku: e.target.value }))
            }
            placeholder="Contoh: PRD-001"
          />
        </div>
      </div>

      {/* Kondisi & Brand */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="condition" className="block mb-2">
            Kondisi Produk <span className="text-red-500">*</span>
          </Label>
          <select
            id="condition"
            value={formData.condition}
            onChange={(e) =>
              setFormData((prev: any) => ({
                ...prev,
                condition: e.target.value,
              }))
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            required
          >
            <option value="new">Baru</option>
            <option value="used">Bekas</option>
          </select>
        </div>

        <div>
          <Label htmlFor="brand" className="block mb-2">
            Brand
          </Label>
          <Input
            id="brand"
            value={formData.brand}
            onChange={(e) =>
              setFormData((prev: any) => ({ ...prev, brand: e.target.value }))
            }
            placeholder="Contoh: Nike, Adidas"
          />
        </div>
      </div>
    </div>
  );
}
