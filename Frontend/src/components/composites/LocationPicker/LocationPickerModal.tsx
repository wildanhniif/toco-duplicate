"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MapPin, Search } from "lucide-react";
import { toast } from "sonner";

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

interface LocationPickerProps {
  onLocationSelect: (location: LocationData) => void;
  currentLocation?: LocationData;
}

interface WilayahItem {
  id: string;
  name: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function LocationPickerModal({
  onLocationSelect,
  currentLocation,
}: LocationPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [provinces, setProvinces] = useState<WilayahItem[]>([]);
  const [cities, setCities] = useState<WilayahItem[]>([]);
  const [districts, setDistricts] = useState<WilayahItem[]>([]);
  const [subdistricts, setSubdistricts] = useState<WilayahItem[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<WilayahItem | null>(
    null
  );
  const [selectedCity, setSelectedCity] = useState<WilayahItem | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<WilayahItem | null>(
    null
  );
  const [selectedSubdistrict, setSelectedSubdistrict] =
    useState<WilayahItem | null>(null);

  const [addressLine, setAddressLine] = useState(
    currentLocation?.address_line || ""
  );
  const [postalCode, setPostalCode] = useState(
    currentLocation?.postal_code || ""
  );

  // Load provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/wilayah/provinces`);
        const data = await response.json();

        if (data.value && Array.isArray(data.value)) {
          const provinceList = data.value.map((item: any) => ({
            id: item.id,
            name: item.name,
          }));
          setProvinces(provinceList);
        }
      } catch (error) {
        console.error("Error fetching provinces:", error);
      }
    };

    fetchProvinces();
  }, []);

  // Load cities when province changes
  useEffect(() => {
    const fetchCities = async () => {
      if (!selectedProvince) {
        setCities([]);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/wilayah/cities?id_provinsi=${selectedProvince.id}`
        );
        const data = await response.json();

        if (data.value && Array.isArray(data.value)) {
          const cityList = data.value.map((item: any) => ({
            id: item.id,
            name: item.name,
          }));
          setCities(cityList);
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
      }
    };

    fetchCities();
  }, [selectedProvince]);

  // Load districts when city changes
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!selectedCity) {
        setDistricts([]);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/wilayah/districts?id_kabupaten=${selectedCity.id}`
        );
        const data = await response.json();

        if (data.value && Array.isArray(data.value)) {
          const districtList = data.value.map((item: any) => ({
            id: item.id,
            name: item.name,
          }));
          setDistricts(districtList);
        }
      } catch (error) {
        console.error("Error fetching districts:", error);
      }
    };

    fetchDistricts();
  }, [selectedCity]);

  // Load subdistricts when district changes
  useEffect(() => {
    const fetchSubdistricts = async () => {
      if (!selectedDistrict) {
        setSubdistricts([]);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/wilayah/subdistricts?id_kecamatan=${selectedDistrict.id}`
        );
        const data = await response.json();

        if (data.value && Array.isArray(data.value)) {
          const subdistrictList = data.value.map((item: any) => ({
            id: item.id,
            name: item.name,
          }));
          setSubdistricts(subdistrictList);
        }
      } catch (error) {
        console.error("Error fetching subdistricts:", error);
      }
    };

    fetchSubdistricts();
  }, [selectedDistrict]);

  const handleSaveLocation = () => {
    if (
      !selectedProvince ||
      !selectedCity ||
      !selectedDistrict ||
      !selectedSubdistrict
    ) {
      toast.error("Mohon lengkapi semua data lokasi");
      return;
    }

    const locationData: LocationData = {
      address_line: addressLine,
      postal_code: postalCode,
      province: selectedProvince.name,
      city: selectedCity.name,
      district: selectedDistrict.name,
      subdistrict: selectedSubdistrict.name,
      province_id: selectedProvince.id,
      city_id: selectedCity.id,
      district_id: selectedDistrict.id,
      subdistrict_id: selectedSubdistrict.id,
      latitude: "", // Would be populated with Google Maps API
      longitude: "", // Would be populated with Google Maps API
    };

    onLocationSelect(locationData);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <MapPin className="h-4 w-4 mr-2" />
          Pilih Lokasi
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Pilih Lokasi Toko
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* DISABLED: Google Maps Placeholder - requires subscription */}
          {/* <div className="h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">
                Google Maps akan ditampilkan di sini
              </p>
              <p className="text-sm text-gray-400">
                Klik untuk memilih lokasi di peta
              </p>
            </div>
          </div> */}


          {/* Address Input */}
          <div>
            <Label htmlFor="address-detail" className="block mb-2">
              Detail Alamat
            </Label>
            <Textarea
              id="address-detail"
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              placeholder="Masukkan alamat lengkap (nama jalan, nomor, RT/RW, dll)"
              rows={3}
            />
          </div>

          {/* Postal Code */}
          <div>
            <Label htmlFor="postal-code-input" className="block mb-2">
              Kode Pos
            </Label>
            <Input
              id="postal-code-input"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="Masukkan kode pos"
            />
          </div>

          {/* Province Selection */}
          <div>
            <Label className="block mb-2">Provinsi</Label>
            <select
              className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={selectedProvince?.id || ""}
              onChange={(e) => {
                const province = provinces.find((p) => p.id === e.target.value);
                setSelectedProvince(province || null);
                setSelectedCity(null);
                setSelectedDistrict(null);
                setSelectedSubdistrict(null);
              }}
            >
              <option value="">Pilih Provinsi</option>
              {provinces.map((province) => (
                <option key={province.id} value={province.id}>
                  {province.name}
                </option>
              ))}
            </select>
          </div>

          {/* City Selection */}
          {selectedProvince && (
            <div>
              <Label className="block mb-2">Kota/Kabupaten</Label>
              <select
                className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedCity?.id || ""}
                onChange={(e) => {
                  const city = cities.find((c) => c.id === e.target.value);
                  setSelectedCity(city || null);
                  setSelectedDistrict(null);
                  setSelectedSubdistrict(null);
                }}
              >
                <option value="">Pilih Kota/Kabupaten</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* District Selection */}
          {selectedCity && (
            <div>
              <Label className="block mb-2">Kecamatan</Label>
              <select
                className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedDistrict?.id || ""}
                onChange={(e) => {
                  const district = districts.find(
                    (d) => d.id === e.target.value
                  );
                  setSelectedDistrict(district || null);
                  setSelectedSubdistrict(null);
                }}
              >
                <option value="">Pilih Kecamatan</option>
                {districts.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subdistrict Selection */}
          {selectedDistrict && (
            <div>
              <Label className="block mb-2">Kelurahan</Label>
              <select
                className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedSubdistrict?.id || ""}
                onChange={(e) => {
                  const subdistrict = subdistricts.find(
                    (s) => s.id === e.target.value
                  );
                  setSelectedSubdistrict(subdistrict || null);
                }}
              >
                <option value="">Pilih Kelurahan</option>
                {subdistricts.map((subdistrict) => (
                  <option key={subdistrict.id} value={subdistrict.id}>
                    {subdistrict.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveLocation}>Simpan Lokasi</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
