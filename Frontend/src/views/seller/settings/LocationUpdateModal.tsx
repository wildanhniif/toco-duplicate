"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, ChevronRight } from "lucide-react";
// import GoogleMapsPicker from "@/components/composites/GoogleMapsPicker"; // DISABLED: Google Maps requires subscription

interface LocationData {
  address_line: string;
  province: string;
  city: string;
  district: string;
  subdistrict: string;
  postal_code: string;
  latitude: string;
  longitude: string;
  business_phone: string;
}

interface LocationUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: LocationData | null;
  onSave: (data: LocationData) => void;
  loading: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface WilayahItem {
  id: string;
  name: string;
}

export default function LocationUpdateModal({
  isOpen,
  onClose,
  currentLocation,
  onSave,
  loading,
}: LocationUpdateModalProps) {
  const [formData, setFormData] = useState<LocationData>({
    address_line: "",
    province: "",
    city: "",
    district: "",
    subdistrict: "",
    postal_code: "",
    latitude: "",
    longitude: "",
    business_phone: "",
  });

  const [provinces, setProvinces] = useState<WilayahItem[]>([]);
  const [cities, setCities] = useState<WilayahItem[]>([]);
  const [districts, setDistricts] = useState<WilayahItem[]>([]);
  const [subdistricts, setSubdistricts] = useState<WilayahItem[]>([]);

  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  // const [showMapPicker, setShowMapPicker] = useState(false); // DISABLED: Google Maps requires subscription

  useEffect(() => {
    if (currentLocation) {
      setFormData(currentLocation);
    }
  }, [currentLocation]);

  // Fetch provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/wilayah/provinces`);
        if (response.ok) {
          const data = await response.json();
          setProvinces(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching provinces:", error);
      }
    };
    loadProvinces();
  }, []);

  const fetchCities = async (provinceId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/wilayah/cities?id_provinsi=${provinceId}`
      );
      if (response.ok) {
        const data = await response.json();
        setCities(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  const fetchDistricts = async (cityId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/wilayah/districts?id_kabupaten=${cityId}`
      );
      if (response.ok) {
        const data = await response.json();
        setDistricts(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching districts:", error);
    }
  };

  const fetchSubdistricts = async (districtId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/wilayah/subdistricts?id_kecamatan=${districtId}`
      );
      if (response.ok) {
        const data = await response.json();
        setSubdistricts(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching subdistricts:", error);
    }
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceId = e.target.value;
    const provinceName = provinces.find((p) => p.id === provinceId)?.name || "";

    setSelectedProvinceId(provinceId);
    setFormData((prev) => ({
      ...prev,
      province: provinceName,
      city: "",
      district: "",
      subdistrict: "",
    }));
    setSelectedCityId("");
    setSelectedDistrictId("");
    setCities([]);
    setDistricts([]);
    setSubdistricts([]);

    if (provinceId) {
      fetchCities(provinceId);
    }
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityId = e.target.value;
    const cityName = cities.find((c) => c.id === cityId)?.name || "";

    setSelectedCityId(cityId);
    setFormData((prev) => ({
      ...prev,
      city: cityName,
      district: "",
      subdistrict: "",
    }));
    setSelectedDistrictId("");
    setDistricts([]);
    setSubdistricts([]);

    if (cityId) {
      fetchDistricts(cityId);
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtId = e.target.value;
    const districtName = districts.find((d) => d.id === districtId)?.name || "";

    setSelectedDistrictId(districtId);
    setFormData((prev) => ({
      ...prev,
      district: districtName,
      subdistrict: "",
    }));
    setSubdistricts([]);

    if (districtId) {
      fetchSubdistricts(districtId);
    }
  };

  const handleSubdistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subdistrictId = e.target.value;
    const subdistrictName =
      subdistricts.find((s) => s.id === subdistrictId)?.name || "";

    setFormData((prev) => ({
      ...prev,
      subdistrict: subdistrictName,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lokasi Toko</DialogTitle>
          <DialogDescription>
            Pastikan alamat dan pin point lokasi sesuai agar kurir tidak salah
            pick up.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* Row 1: Kode Pos */}
          {/* DISABLED: Google Maps Pin Point - requires subscription */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* <div>
              <Label htmlFor="pinpoint" className="block mb-2 text-sm">
                Lokasi Toko (Pin Poin Lokasi)
                <span className="text-red-500">*</span>
              </Label>
              <div
                onClick={() => setShowMapPicker(true)}
                className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2.5 bg-white cursor-pointer hover:bg-gray-50"
              >
                <MapPin className="h-5 w-5 text-gray-400" />
                <span className="flex-1 text-sm text-gray-700">
                  {formData.subdistrict || formData.district || "Pilih lokasi"}
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </div> */}
            <div>
              <Label htmlFor="postal_code" className="block mb-2 text-sm">
                Kode Pos<span className="text-red-500">*</span>
              </Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    postal_code: e.target.value,
                  }))
                }
                placeholder="40283"
                required
              />
            </div>
          </div>

          {/* Row 2: Provinsi & Nomor Telepon */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="province" className="block mb-2 text-sm">
                Provinsi<span className="text-red-500">*</span>
              </Label>
              <select
                id="province"
                value={selectedProvinceId}
                onChange={handleProvinceChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white"
                required
              >
                <option value="">Pilih Provinsi</option>
                {provinces.map((province) => (
                  <option key={province.id} value={province.id}>
                    {province.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="business_phone" className="block mb-2 text-sm">
                Nomor Telepon Usaha<span className="text-red-500">*</span>
              </Label>
              <Input
                id="business_phone"
                type="tel"
                value={formData.business_phone}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    business_phone: e.target.value,
                  }))
                }
                placeholder="6285369827385"
                required
              />
            </div>
          </div>

          {/* Row 3: Kota & Detail Alamat */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="city" className="block mb-2 text-sm">
                  Kota/Kabupaten<span className="text-red-500">*</span>
                </Label>
                <select
                  id="city"
                  value={selectedCityId}
                  onChange={handleCityChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white"
                  required
                  disabled={!selectedProvinceId}
                >
                  <option value="">Pilih Kota/Kabupaten</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="district" className="block mb-2 text-sm">
                  Kecamatan<span className="text-red-500">*</span>
                </Label>
                <select
                  id="district"
                  value={selectedDistrictId}
                  onChange={handleDistrictChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white"
                  required
                  disabled={!selectedCityId}
                >
                  <option value="">Pilih Kecamatan</option>
                  {districts.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="subdistrict" className="block mb-2 text-sm">
                  Kelurahan<span className="text-red-500">*</span>
                </Label>
                <select
                  id="subdistrict"
                  value={
                    subdistricts.find((s) => s.name === formData.subdistrict)
                      ?.id || ""
                  }
                  onChange={handleSubdistrictChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white"
                  required
                  disabled={!selectedDistrictId}
                >
                  <option value="">Pilih Kelurahan</option>
                  {subdistricts.map((subdistrict) => (
                    <option key={subdistrict.id} value={subdistrict.id}>
                      {subdistrict.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="address_line" className="block mb-2 text-sm">
                Detail Alamat<span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="address_line"
                value={formData.address_line}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    address_line: e.target.value,
                  }))
                }
                placeholder="antapani"
                rows={8}
                className="resize-none"
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="min-w-[120px]"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="min-w-[160px] bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* DISABLED: Google Maps Picker Modal - requires subscription */}
      {/* <GoogleMapsPicker
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onSelectLocation={(location) => {
          setFormData((prev) => ({
            ...prev,
            address_line: location.address,
            province: location.province || prev.province,
            city: location.city || prev.city,
            district: location.district || prev.district,
            subdistrict: location.subdistrict || prev.subdistrict,
            postal_code: location.postal_code || prev.postal_code,
            latitude: String(location.latitude),
            longitude: String(location.longitude),
          }));
          setShowMapPicker(false);
        }}
        initialLocation={
          formData.latitude && formData.longitude
            ? {
                lat: parseFloat(formData.latitude),
                lng: parseFloat(formData.longitude),
              }
            : undefined
        }
      /> */}
    </Dialog>
  );
}
