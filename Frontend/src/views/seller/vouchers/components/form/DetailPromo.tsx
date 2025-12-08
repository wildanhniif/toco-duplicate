import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Info, DollarSign } from "lucide-react";
import { VoucherFormData } from "../../add";

interface Props {
  formData: VoucherFormData;
  setFormData: React.Dispatch<React.SetStateAction<VoucherFormData>>;
  estimatedCost: number;
}

export default function DetailPromo({
  formData,
  setFormData,
  estimatedCost,
}: Props) {
  const isDiscount = formData.voucher_type === "discount";

  return (
    <div className="space-y-6">
      {isDiscount ? (
        <>
          {/* Nominal Diskon */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Nominal Diskon *</Label>
            <RadioGroup
              value={formData.discount_type}
              onValueChange={(value: "percentage" | "fixed") =>
                setFormData({ ...formData, discount_type: value })
              }
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage" className="cursor-pointer">
                  Presentase (%)
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="fixed" id="fixed" />
                <Label htmlFor="fixed" className="cursor-pointer">
                  Potongan (Rp)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Percentage Input */}
          {formData.discount_type === "percentage" && (
            <div className="space-y-4 ml-6">
              <div className="space-y-2">
                <Label htmlFor="discount_value">Masukan Presentase *</Label>
                <div className="relative">
                  <Input
                    id="discount_value"
                    type="number"
                    placeholder="Contoh: 20"
                    value={formData.discount_value || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_value: parseFloat(e.target.value) || 0,
                      })
                    }
                    min="1"
                    max="100"
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    %
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_discount">Maksimum Diskon (Rp) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    Rp
                  </span>
                  <Input
                    id="max_discount"
                    type="number"
                    placeholder="Contoh: 50000"
                    value={formData.max_discount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_discount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="pl-12"
                    min="1000"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Batas maksimal potongan harga yang diberikan
                </p>
              </div>
            </div>
          )}

          {/* Fixed Amount Input */}
          {formData.discount_type === "fixed" && (
            <div className="space-y-2 ml-6">
              <Label htmlFor="discount_value">Masukan Nominal *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  Rp
                </span>
                <Input
                  id="discount_value"
                  type="number"
                  placeholder="Contoh: 10000"
                  value={formData.discount_value || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount_value: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="pl-12"
                  min="1000"
                />
              </div>
              <p className="text-xs text-gray-500">
                Jumlah potongan harga yang diberikan
              </p>
            </div>
          )}

          {/* Minimum Transaction */}
          <div className="space-y-2">
            <Label htmlFor="min_transaction">Minimum Transaksi (Rp)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                Rp
              </span>
              <Input
                id="min_transaction"
                type="number"
                placeholder="Contoh: 100000"
                value={formData.min_transaction || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    min_transaction: parseFloat(e.target.value) || 0,
                  })
                }
                className="pl-12"
                min="0"
              />
            </div>
            <p className="text-xs text-gray-500">
              Minimum nilai belanja untuk dapat menggunakan voucher
            </p>
          </div>

          {/* Estimated Cost */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Estimasi Pengeluaran
                </p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  Rp {estimatedCost.toLocaleString("id-ID")}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Dihitung otomatis dari hasil kuota ×{" "}
                  {formData.discount_type === "percentage"
                    ? "maksimum diskon"
                    : "nominal diskon"}
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Free Shipping Info */}
          <div className="p-6 bg-purple-50 border border-purple-200 rounded-lg text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Gratis Ongkir
            </h3>
            <p className="text-sm text-gray-600">
              Pembeli mendapatkan gratis biaya pengiriman untuk semua produk
              yang dipilih
            </p>
          </div>

          {/* Minimum Transaction for Free Shipping */}
          <div className="space-y-2">
            <Label htmlFor="min_transaction">Minimum Transaksi (Rp)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                Rp
              </span>
              <Input
                id="min_transaction"
                type="number"
                placeholder="Contoh: 50000"
                value={formData.min_transaction || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    min_transaction: parseFloat(e.target.value) || 0,
                  })
                }
                className="pl-12"
                min="0"
              />
            </div>
            <p className="text-xs text-gray-500">
              Minimum nilai belanja untuk dapat gratis ongkir
            </p>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-700">
              Gratis ongkir berlaku untuk semua metode pengiriman yang tersedia
            </p>
          </div>
        </>
      )}
    </div>
  );
}
