import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Info } from "lucide-react";
import { VoucherFormData } from "../../add";

interface Props {
  formData: VoucherFormData;
  setFormData: React.Dispatch<React.SetStateAction<VoucherFormData>>;
}

export default function InformasiVoucher({ formData, setFormData }: Props) {
  return (
    <div className="space-y-6">
      {/* Tipe Voucher */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Tipe Voucher *</Label>
        <RadioGroup
          value={formData.voucher_type}
          onValueChange={(value: "discount" | "free_shipping") =>
            setFormData({ ...formData, voucher_type: value })
          }
        >
          <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
            <RadioGroupItem value="discount" id="discount" />
            <Label htmlFor="discount" className="flex-1 cursor-pointer">
              <div>
                <p className="font-medium">Voucher Diskon</p>
                <p className="text-sm text-gray-500">
                  Berikan diskon untuk produk
                </p>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
            <RadioGroupItem value="free_shipping" id="free_shipping" />
            <Label htmlFor="free_shipping" className="flex-1 cursor-pointer">
              <div>
                <p className="font-medium">Gratis Ongkir</p>
                <p className="text-sm text-gray-500">Gratis biaya pengiriman</p>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Target Voucher */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Target Voucher *</Label>
        <RadioGroup
          value={formData.target_type}
          onValueChange={(value: "public" | "private") =>
            setFormData({ ...formData, target_type: value })
          }
        >
          <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
            <RadioGroupItem value="public" id="public" />
            <Label htmlFor="public" className="flex-1 cursor-pointer">
              <div>
                <p className="font-medium">Publik</p>
                <div className="flex items-start gap-2 mt-1">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-gray-600">
                    Promo dapat langsung digunakan semua pengguna yang
                    bertransaksi di toco
                  </p>
                </div>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
            <RadioGroupItem value="private" id="private" />
            <Label htmlFor="private" className="flex-1 cursor-pointer">
              <div>
                <p className="font-medium">Khusus</p>
                <div className="flex items-start gap-2 mt-1">
                  <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-gray-600">
                    Promo hanya dapat digunakan pembeli yang menerima kode
                    khusus dari kupon yang kamu buat
                  </p>
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Kode Voucher (conditional) */}
      {formData.target_type === "private" && (
        <div className="space-y-2">
          <Label htmlFor="voucher_code">Kode Voucher *</Label>
          <Input
            id="voucher_code"
            placeholder="Contoh: DISC20"
            value={formData.voucher_code}
            onChange={(e) =>
              setFormData({
                ...formData,
                voucher_code: e.target.value.toUpperCase(),
              })
            }
            className="font-mono"
          />
          <p className="text-xs text-gray-500">
            Kode voucher harus unik dan mudah diingat
          </p>
        </div>
      )}

      {/* Judul Promosi */}
      <div className="space-y-2">
        <Label htmlFor="title">Judul Promosi *</Label>
        <Input
          id="title"
          placeholder="Nama promosi akan menjadi judul utama yang dilihat oleh pembeli"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          maxLength={255}
        />
        <p className="text-xs text-gray-500">
          {formData.title.length}/255 karakter
        </p>
      </div>

      {/* Deskripsi Promosi */}
      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi Promosi</Label>
        <Textarea
          id="description"
          placeholder="Jelaskan detail promosi, syarat & ketentuan..."
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-gray-500">
          {formData.description.length}/500 karakter
        </p>
      </div>
    </div>
  );
}
