"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import LocationPickerModal from "@/components/composites/LocationPicker/LocationPickerModal";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface AddressFormProps {
  onSuccess?: (addressId: number) => void;
  onCancel?: () => void;
  defaultIsPrimary?: boolean;
  submitLabel?: string;
}

interface LocationData {
  address_line: string;
  postal_code: string;
  province: string;
  city: string;
  district: string;
  subdistrict: string;
  province_id: string;
  city_id: string;
  district_id: string;
  subdistrict_id: string;
  latitude: string;
  longitude: string;
}

export default function AddressForm({
  onSuccess,
  onCancel,
  defaultIsPrimary = true,
  submitLabel = "Simpan Alamat",
}: AddressFormProps) {
  const [label, setLabel] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isPrimary, setIsPrimary] = useState(defaultIsPrimary);
  const [loading, setLoading] = useState(false);

  const handleLocationSelect = (loc: LocationData) => {
    setLocation(loc);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!label || !recipientName || !phoneNumber) {
      toast.error("Label, nama penerima, dan nomor telepon wajib diisi.");
      return;
    }

    if (!location) {
      toast.error("Silakan pilih lokasi alamat terlebih dahulu.");
      return;
    }

    setLoading(true);

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;

      if (!token) {
        toast.error("Silakan login terlebih dahulu.");
        setLoading(false);
        return;
      }

      const payload = {
        label,
        recipient_name: recipientName,
        phone_number: phoneNumber,
        address_line: location.address_line,
        postal_code: location.postal_code,
        province: location.province,
        city: location.city,
        district: location.district,
        subdistrict: location.subdistrict,
        is_primary: isPrimary,
      };

      const res = await fetch(`${API_BASE_URL}/api/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.message || "Gagal menyimpan alamat.");
        setLoading(false);
        return;
      }

      const newId: number | undefined = data?.data?.addressId;

      toast.success("Alamat berhasil disimpan.");

      if (onSuccess && typeof newId === "number") {
        onSuccess(newId);
      } else if (onSuccess) {
        onSuccess(-1);
      }
    } catch (error) {
      console.error("Error creating address:", error);
      toast.error("Terjadi kesalahan saat menyimpan alamat.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="address-label">Label Alamat</Label>
          <Input
            id="address-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Contoh: Rumah, Kantor"
            required
          />
        </div>
        <div>
          <Label htmlFor="recipient-name">Nama Penerima</Label>
          <Input
            id="recipient-name"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="Nama lengkap penerima"
            required
          />
        </div>
        <div>
          <Label htmlFor="phone-number">Nomor Telepon</Label>
          <Input
            id="phone-number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Nomor telepon aktif"
            required
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Lokasi Alamat</Label>
        <LocationPickerModal
          onLocationSelect={handleLocationSelect}
          currentLocation={location || undefined}
        />
        {location && (
          <div className="text-xs text-gray-600 space-y-1 border rounded-md p-2 bg-gray-50">
            <p className="font-medium">{location.address_line}</p>
            <p>
              {location.subdistrict}, {location.district}, {location.city}
            </p>
            <p>
              {location.province} {location.postal_code}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="primary-address"
          checked={isPrimary}
          onChange={(e) => setIsPrimary(e.target.checked)}
          className="w-4 h-4 text-orange-600 border-gray-300 rounded"
        />
        <Label htmlFor="primary-address" className="text-sm">
          Jadikan sebagai alamat utama
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Batal
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Menyimpan..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
