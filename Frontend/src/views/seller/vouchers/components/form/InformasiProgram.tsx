import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, X } from "lucide-react";
import { VoucherFormData } from "../../add";
import ProductSelector from "./ProductSelector";

interface Props {
  formData: VoucherFormData;
  setFormData: React.Dispatch<React.SetStateAction<VoucherFormData>>;
}

export default function InformasiProgram({ formData, setFormData }: Props) {
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);

  // Fetch selected products details
  useEffect(() => {
    if (formData.product_ids.length > 0) {
      fetchProductDetails();
    }
  }, [formData.product_ids]);

  const fetchProductDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      // Fetch product details for selected IDs
      const response = await fetch(
        `http://localhost:5000/api/products?ids=${formData.product_ids.join(
          ","
        )}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSelectedProducts(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const removeProduct = (productId: number) => {
    setFormData({
      ...formData,
      product_ids: formData.product_ids.filter((id) => id !== productId),
    });
  };

  return (
    <div className="space-y-6">
      {/* Periode Promosi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Periode Dimulai *</Label>
          <Input
            id="start_date"
            type="datetime-local"
            value={formData.start_date}
            onChange={(e) =>
              setFormData({ ...formData, start_date: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">Periode Berakhir *</Label>
          <Input
            id="end_date"
            type="datetime-local"
            value={formData.end_date}
            onChange={(e) =>
              setFormData({ ...formData, end_date: e.target.value })
            }
          />
        </div>
      </div>

      {/* Kuota Promosi */}
      <div className="space-y-2">
        <Label htmlFor="quota">Kuota Promosi *</Label>
        <Input
          id="quota"
          type="number"
          placeholder="Contoh: 100"
          value={formData.quota || ""}
          onChange={(e) =>
            setFormData({ ...formData, quota: parseInt(e.target.value) || 0 })
          }
          min="1"
        />
        <p className="text-xs text-gray-500">
          Total jumlah voucher yang dapat digunakan
        </p>
      </div>

      {/* Limit per Pembeli */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Limit per Pembeli</Label>
        <RadioGroup
          value={formData.has_limit ? "limited" : "unlimited"}
          onValueChange={(value) =>
            setFormData({ ...formData, has_limit: value === "limited" })
          }
        >
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="unlimited" id="unlimited" />
            <Label htmlFor="unlimited" className="cursor-pointer">
              Tanpa Batas
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="limited" id="limited" />
            <Label htmlFor="limited" className="cursor-pointer">
              Limit Voucher
            </Label>
          </div>
        </RadioGroup>

        {formData.has_limit && (
          <div className="ml-6 space-y-2">
            <Input
              type="number"
              placeholder="Contoh: 1"
              value={formData.limit_per_user || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  limit_per_user: parseInt(e.target.value) || null,
                })
              }
              min="1"
            />
            <p className="text-xs text-gray-500">
              Maksimal voucher yang dapat digunakan per pembeli
            </p>
          </div>
        )}
      </div>

      {/* Target Pengguna */}
      <div className="space-y-2">
        <Label>Target Pengguna</Label>
        <div className="p-4 bg-gray-50 border rounded-lg">
          <p className="text-sm text-gray-900">Semua Pengguna</p>
          <p className="text-xs text-gray-500 mt-1">
            Fitur targeting khusus segera hadir
          </p>
        </div>
      </div>

      {/* Penerapan Voucher */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Penerapan Voucher *</Label>
        <RadioGroup
          value={formData.apply_to}
          onValueChange={(value: "all_products" | "specific_products") =>
            setFormData({ ...formData, apply_to: value })
          }
        >
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="all_products" id="all_products" />
            <Label htmlFor="all_products" className="cursor-pointer">
              Semua Product
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="specific_products" id="specific_products" />
            <Label htmlFor="specific_products" className="cursor-pointer">
              Product Tertentu
            </Label>
          </div>
        </RadioGroup>

        {formData.apply_to === "specific_products" && (
          <div className="ml-6 space-y-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowProductSelector(true)}
            >
              <Package className="w-4 h-4 mr-2" />
              Pilih Product
            </Button>

            {/* Selected Products */}
            {formData.product_ids.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {formData.product_ids.length} Product Terpilih:
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedProducts.map((product) => (
                    <Badge
                      key={product.product_id}
                      variant="secondary"
                      className="pl-3 pr-2 py-1.5 gap-2"
                    >
                      <span className="text-sm">{product.name}</span>
                      <button
                        type="button"
                        onClick={() => removeProduct(product.product_id)}
                        className="hover:bg-gray-300 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Selector Modal */}
      {showProductSelector && (
        <ProductSelector
          selectedIds={formData.product_ids}
          onSelect={(ids) => {
            setFormData({ ...formData, product_ids: ids });
            setShowProductSelector(false);
          }}
          onClose={() => setShowProductSelector(false)}
        />
      )}
    </div>
  );
}
