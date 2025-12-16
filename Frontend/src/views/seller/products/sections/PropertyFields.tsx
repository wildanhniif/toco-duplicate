"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PropertyFieldsProps {
  formData: any;
  setFormData: (data: any) => void;
}

export default function PropertyFields({
  formData,
  setFormData,
}: PropertyFieldsProps) {
  const updatePropertySpec = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      property_specs: {
        ...prev.property_specs,
        [field]: value,
      },
    }));
  };

  const updateLocation = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      property_specs: {
        ...prev.property_specs,
        location: {
          ...prev.property_specs.location,
          [field]: value,
        },
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Dijual atau Disewakan */}
      <div>
        <Label className="block mb-2">
          Dijual atau Disewakan <span className="text-red-500">*</span>
        </Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="transaction_type"
              value="sale"
              checked={formData.property_specs.transaction_type === "sale"}
              onChange={(e) =>
                updatePropertySpec("transaction_type", e.target.value)
              }
              className="w-4 h-4"
            />
            <span>Dijual</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="transaction_type"
              value="rent"
              checked={formData.property_specs.transaction_type === "rent"}
              onChange={(e) =>
                updatePropertySpec("transaction_type", e.target.value)
              }
              className="w-4 h-4"
            />
            <span>Disewakan</span>
          </label>
        </div>
      </div>

      {/* Harga */}
      <div>
        <Label htmlFor="price" className="block mb-2">
          Harga{" "}
          {formData.property_specs.transaction_type === "rent" && "per Bulan"}{" "}
          <span className="text-red-500">*</span>
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

      {/* Tipe Property */}
      <div>
        <Label htmlFor="property_type" className="block mb-2">
          Tipe Properti
        </Label>
        <select
          id="property_type"
          value={formData.property_specs.property_type}
          onChange={(e) => updatePropertySpec("property_type", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="">Pilih Tipe</option>
          <option value="Rumah">Rumah</option>
          <option value="Kost">Kost</option>
          <option value="Apartemen">Apartemen</option>
          <option value="Ruko">Ruko</option>
          <option value="Tanah">Tanah</option>
        </select>
      </div>

      {/* Spesifikasi */}
      <div>
        <h3 className="font-semibold mb-4">Spesifikasi</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="building_area">Luas Bangunan (m²)</Label>
            <Input
              id="building_area"
              type="number"
              value={formData.property_specs.building_area}
              onChange={(e) =>
                updatePropertySpec("building_area", e.target.value)
              }
              placeholder="120"
            />
          </div>
          <div>
            <Label htmlFor="land_area">Luas Tanah (m²)</Label>
            <Input
              id="land_area"
              type="number"
              value={formData.property_specs.land_area}
              onChange={(e) => updatePropertySpec("land_area", e.target.value)}
              placeholder="150"
            />
          </div>
          <div>
            <Label htmlFor="bedrooms">Kamar Tidur</Label>
            <Input
              id="bedrooms"
              type="number"
              value={formData.property_specs.bedrooms}
              onChange={(e) => updatePropertySpec("bedrooms", e.target.value)}
              placeholder="3"
              min="0"
            />
          </div>
          <div>
            <Label htmlFor="bathrooms">Kamar Mandi</Label>
            <Input
              id="bathrooms"
              type="number"
              value={formData.property_specs.bathrooms}
              onChange={(e) => updatePropertySpec("bathrooms", e.target.value)}
              placeholder="2"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Jumlah Lantai */}
      <div>
        <Label htmlFor="floors" className="block mb-2">
          Jumlah Lantai
        </Label>
        <Input
          id="floors"
          type="number"
          value={formData.property_specs.floors}
          onChange={(e) => updatePropertySpec("floors", e.target.value)}
          placeholder="2"
          min="1"
          className="w-32"
        />
      </div>

      {/* Sertifikat & Fasilitas */}
      <div>
        <h3 className="font-semibold mb-4">Sertifikat & Fasilitas</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="certificate_type">Sertifikat</Label>
            <select
              id="certificate_type"
              value={formData.property_specs.certificate_type}
              onChange={(e) =>
                updatePropertySpec("certificate_type", e.target.value)
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Pilih Sertifikat</option>
              <option value="SHM">SHM (Sertifikat Hak Milik)</option>
              <option value="SHGB">SHGB (Sertifikat Hak Guna Bangunan)</option>
              <option value="AJB">AJB (Akta Jual Beli)</option>
              <option value="Girik">Girik</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div>
            <Label htmlFor="facilities">Fasilitas Lingkungan</Label>
            <Textarea
              id="facilities"
              value={formData.property_specs.facilities}
              onChange={(e) => updatePropertySpec("facilities", e.target.value)}
              placeholder="Contoh: Dekat sekolah, mall, transportasi umum, keamanan 24 jam"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Lokasi */}
      <div>
        <h3 className="font-semibold mb-4">
          Lokasi <span className="text-red-500">*</span>
        </h3>

        {/* DISABLED: Google Maps Placeholder - requires subscription */}
        {/* <div className="h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-4">
          <div className="text-center">
            <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Google Maps - Pilih Lokasi</p>
            <Button type="button" variant="outline" size="sm" className="mt-2">
              Pilih di Peta
            </Button>
          </div>
        </div> */}


        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-3">
            <Label htmlFor="location_name">Nama Lokasi</Label>
            <Input
              id="location_name"
              value={formData.property_specs.location.name}
              onChange={(e) => updateLocation("name", e.target.value)}
              placeholder="Bekasi Timur"
              required
            />
          </div>
          <div>
            <Label htmlFor="lat">Latitude</Label>
            <Input
              id="lat"
              type="number"
              step="0.0000001"
              value={formData.property_specs.location.lat}
              onChange={(e) => updateLocation("lat", e.target.value)}
              placeholder="-6.2376"
              required
            />
          </div>
          <div>
            <Label htmlFor="lng">Longitude</Label>
            <Input
              id="lng"
              type="number"
              step="0.0000001"
              value={formData.property_specs.location.lng}
              onChange={(e) => updateLocation("lng", e.target.value)}
              placeholder="107.0042"
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
}
