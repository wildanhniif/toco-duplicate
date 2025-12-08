"use client";

import { Label } from "@/components/ui/label";

interface ProductStatusSectionProps {
  formData: any;
  setFormData: (data: any) => void;
}

export default function ProductStatusSection({
  formData,
  setFormData,
}: ProductStatusSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) =>
            setFormData((prev: any) => ({
              ...prev,
              is_active: e.target.checked,
            }))
          }
          className="w-5 h-5 mt-1"
        />
        <div>
          <Label htmlFor="is_active" className="cursor-pointer font-semibold">
            Aktifkan Produk
          </Label>
          <p className="text-sm text-gray-600 mt-1">
            Produk dapat dilihat oleh pembeli di halaman Toco jika status aktif.
            Nonaktifkan jika Anda ingin menyimpan produk sebagai draft.
          </p>
        </div>
      </div>

      {!formData.is_active && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ Produk ini akan disimpan sebagai draft dan tidak terlihat oleh
            pembeli
          </p>
        </div>
      )}
    </div>
  );
}
