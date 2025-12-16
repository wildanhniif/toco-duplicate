"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CarFieldsProps {
  formData: any;
  setFormData: (data: any) => void;
}

export default function CarFields({ formData, setFormData }: CarFieldsProps) {
  const updateCarSpec = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      mobil_specs: {
        ...prev.mobil_specs,
        [field]: value,
      },
    }));
  };

  const updateLocation = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      mobil_specs: {
        ...prev.mobil_specs,
        location: {
          ...prev.mobil_specs.location,
          [field]: value,
        },
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Harga */}
      <div>
        <Label htmlFor="price" className="block mb-2">
          Harga <span className="text-red-500">*</span>
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

      {/* Spesifikasi */}
      <div>
        <h3 className="font-semibold mb-4">Spesifikasi</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="brand">
              Merek <span className="text-red-500">*</span>
            </Label>
            <Input
              id="brand"
              value={formData.mobil_specs.brand}
              onChange={(e) => updateCarSpec("brand", e.target.value)}
              placeholder="Toyota, Honda, dll"
              required
            />
          </div>
          <div>
            <Label htmlFor="model">
              Model <span className="text-red-500">*</span>
            </Label>
            <Input
              id="model"
              value={formData.mobil_specs.model}
              onChange={(e) => updateCarSpec("model", e.target.value)}
              placeholder="Avanza, CR-V, dll"
              required
            />
          </div>
          <div>
            <Label htmlFor="year">
              Tahun <span className="text-red-500">*</span>
            </Label>
            <Input
              id="year"
              type="number"
              value={formData.mobil_specs.year}
              onChange={(e) => updateCarSpec("year", e.target.value)}
              placeholder="2023"
              min="1900"
              max={new Date().getFullYear() + 1}
              required
            />
          </div>
        </div>
      </div>

      {/* Transmisi */}
      <div>
        <Label className="block mb-2">
          Transmisi <span className="text-red-500">*</span>
        </Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="car_transmission"
              value="manual"
              checked={formData.mobil_specs.transmission === "manual"}
              onChange={(e) => updateCarSpec("transmission", e.target.value)}
              className="w-4 h-4"
            />
            <span>Manual</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="car_transmission"
              value="automatic"
              checked={formData.mobil_specs.transmission === "automatic"}
              onChange={(e) => updateCarSpec("transmission", e.target.value)}
              className="w-4 h-4"
            />
            <span>Otomatis</span>
          </label>
        </div>
      </div>

      {/* Detail Lainnya */}
      <div>
        <h3 className="font-semibold mb-4">Detail Lainnya</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="mileage">Jarak Tempuh (km)</Label>
            <Input
              id="mileage"
              type="number"
              value={formData.mobil_specs.mileage}
              onChange={(e) => updateCarSpec("mileage", e.target.value)}
              placeholder="50000"
            />
          </div>
          <div>
            <Label htmlFor="license_plate">Plat Nomor</Label>
            <Input
              id="license_plate"
              value={formData.mobil_specs.license_plate}
              onChange={(e) => updateCarSpec("license_plate", e.target.value)}
              placeholder="B 1234 ABC"
            />
          </div>
          <div>
            <Label htmlFor="color">Warna</Label>
            <Input
              id="color"
              value={formData.mobil_specs.color}
              onChange={(e) => updateCarSpec("color", e.target.value)}
              placeholder="Putih, Hitam, dll"
            />
          </div>
          <div>
            <Label htmlFor="fuel_type">Bahan Bakar</Label>
            <select
              id="fuel_type"
              value={formData.mobil_specs.fuel_type}
              onChange={(e) => updateCarSpec("fuel_type", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Pilih</option>
              <option value="Bensin">Bensin</option>
              <option value="Diesel">Diesel</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Listrik">Listrik</option>
            </select>
          </div>
          <div>
            <Label htmlFor="engine_capacity">Kapasitas Mesin (cc)</Label>
            <Input
              id="engine_capacity"
              type="number"
              value={formData.mobil_specs.engine_capacity}
              onChange={(e) => updateCarSpec("engine_capacity", e.target.value)}
              placeholder="1500"
            />
          </div>
          <div>
            <Label htmlFor="seat_capacity">Jumlah Tempat Duduk</Label>
            <Input
              id="seat_capacity"
              type="number"
              value={formData.mobil_specs.seat_capacity}
              onChange={(e) => updateCarSpec("seat_capacity", e.target.value)}
              placeholder="7"
              min="1"
            />
          </div>
        </div>
      </div>

      {/* Pajak & Kelengkapan */}
      <div>
        <h3 className="font-semibold mb-4">Pajak & Kelengkapan</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tax_expiry_date">Tanggal Kadaluarsa Pajak</Label>
            <Input
              id="tax_expiry_date"
              type="date"
              value={formData.mobil_specs.tax_expiry_date}
              onChange={(e) => updateCarSpec("tax_expiry_date", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="completeness">Kelengkapan</Label>
            <Input
              id="completeness"
              value={formData.mobil_specs.completeness}
              onChange={(e) => updateCarSpec("completeness", e.target.value)}
              placeholder="STNK, BPKB, Buku Service"
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
              value={formData.mobil_specs.location.name}
              onChange={(e) => updateLocation("name", e.target.value)}
              placeholder="Jakarta Pusat"
              required
            />
          </div>
          <div>
            <Label htmlFor="lat">Latitude</Label>
            <Input
              id="lat"
              type="number"
              step="0.0000001"
              value={formData.mobil_specs.location.lat}
              onChange={(e) => updateLocation("lat", e.target.value)}
              placeholder="-6.2088"
              required
            />
          </div>
          <div>
            <Label htmlFor="lng">Longitude</Label>
            <Input
              id="lng"
              type="number"
              step="0.0000001"
              value={formData.mobil_specs.location.lng}
              onChange={(e) => updateLocation("lng", e.target.value)}
              placeholder="106.8456"
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
}
