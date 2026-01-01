"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ShippingInfoSectionProps {
  formData: any;
  setFormData: (data: any) => void;
}

export default function ShippingInfoSection({
  formData,
  setFormData,
}: ShippingInfoSectionProps) {
  const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
    isDimension = false
  ) => {
    const val = e.target.value;
    if (val === "") {
      if (isDimension) {
        setFormData((prev: any) => ({
          ...prev,
          dimensions: { ...prev.dimensions, [field]: "" },
        }));
      } else {
        setFormData((prev: any) => ({ ...prev, [field]: "" }));
      }
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num) && num < 0) return; // Prevent negative

    if (isDimension) {
      setFormData((prev: any) => ({
        ...prev,
        dimensions: { ...prev.dimensions, [field]: val },
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, [field]: val }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Berat Produk */}
      <div>
        <Label htmlFor="weight" className="block mb-2">
          Berat Produk (gram) <span className="text-red-500">*</span>
        </Label>
        <Input
          id="weight"
          type="number"
          min="0"
          value={formData.weight_gram}
          onChange={(e) => handleNumberInput(e, "weight_gram")}
          placeholder="500"
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          Berat produk termasuk kemasan untuk perhitungan ongkir
        </p>
      </div>

      {/* Ukuran Produk */}
      <div>
        <Label className="block mb-2">
          Ukuran Produk (cm) <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Input
              type="number"
              min="0"
              value={formData.dimensions.length}
              onChange={(e) => handleNumberInput(e, "length", true)}
              placeholder="Panjang"
              required
            />
          </div>
          <div>
            <Input
              type="number"
              min="0"
              value={formData.dimensions.width}
              onChange={(e) => handleNumberInput(e, "width", true)}
              placeholder="Lebar"
              required
            />
          </div>
          <div>
            <Input
              type="number"
              min="0"
              value={formData.dimensions.height}
              onChange={(e) => handleNumberInput(e, "height", true)}
              placeholder="Tinggi"
              required
            />
          </div>
        </div>
      </div>

      {/* Pre Order */}
      <div>
        <Label className="block mb-2">Pre Order</Label>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_preorder"
            checked={formData.is_preorder}
            onChange={(e) =>
              setFormData((prev: any) => ({
                ...prev,
                is_preorder: e.target.checked,
              }))
            }
            className="w-4 h-4"
          />
          <label htmlFor="is_preorder" className="text-sm cursor-pointer">
            Aktifkan Pre Order (produk dikirim setelah beberapa hari)
          </label>
        </div>
      </div>

      {/* Pengiriman Kurir Toko */}
      <div>
        <Label className="block mb-2">Pengiriman Kurir Toko</Label>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="use_store_courier"
            checked={formData.use_store_courier}
            onChange={(e) =>
              setFormData((prev: any) => ({
                ...prev,
                use_store_courier: e.target.checked,
              }))
            }
            className="w-4 h-4"
          />
          <label htmlFor="use_store_courier" className="text-sm cursor-pointer">
            Gunakan kurir toko untuk produk ini
          </label>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Pastikan Anda sudah mengatur kurir toko di Pengaturan
        </p>
      </div>

      {/* Asuransi Pengiriman */}
      <div>
        <Label className="block mb-2">
          Asuransi Pengiriman <span className="text-red-500">*</span>
        </Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="insurance"
              value="required"
              checked={formData.insurance === "required"}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  insurance: e.target.value,
                }))
              }
              className="w-4 h-4"
            />
            <span>Wajib</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="insurance"
              value="optional"
              checked={formData.insurance === "optional"}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  insurance: e.target.value,
                }))
              }
              className="w-4 h-4"
            />
            <span>Opsional</span>
          </label>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {formData.insurance === "required"
            ? "Pembeli wajib membeli asuransi pengiriman"
            : "Pembeli bisa memilih untuk membeli asuransi atau tidak"}
        </p>
      </div>
    </div>
  );
}
