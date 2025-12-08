"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Truck, CheckCircle, AlertCircle } from "lucide-react";
import LocationUpdateModal from "./LocationUpdateModal";
import { useAuth } from "@/hooks/useAuth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface StoreLocation {
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

interface CourierService {
  service_id: number;
  service_code: string;
  service_name: string;
  logo_url: string | null;
  types: CourierServiceType[];
}

interface CourierServiceType {
  type_id: number;
  type_code: string;
  type_name: string;
  type_description: string | null;
}

export default function ShippingSettings() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [storeLocation, setStoreLocation] = useState<StoreLocation | null>(
    null
  );
  const [courierServices, setCourierServices] = useState<CourierService[]>([]);
  const [selectedServiceTypeIds, setSelectedServiceTypeIds] = useState<
    number[]
  >([]);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Fetch store location
  useEffect(() => {
    fetchStoreLocation();
    fetchCourierServices();
    fetchSelectedServices();
  }, []);

  const fetchStoreLocation = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_BASE_URL}/api/sellers/stores/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStoreLocation({
          address_line: data.store.address_line || "",
          province: data.store.province || "",
          city: data.store.city || "",
          district: data.store.district || "",
          subdistrict: data.store.subdistrict || "",
          postal_code: data.store.postal_code || "",
          latitude: data.store.latitude || "",
          longitude: data.store.longitude || "",
          business_phone: data.store.business_phone || "",
        });
      }
    } catch (error) {
      console.error("Error fetching store location:", error);
    }
  };

  const fetchCourierServices = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `${API_BASE_URL}/api/sellers/shipping/courier-services`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCourierServices(data.services || []);
      }
    } catch (error) {
      console.error("Error fetching courier services:", error);
    }
  };

  const fetchSelectedServices = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `${API_BASE_URL}/api/sellers/shipping/store-services`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSelectedServiceTypeIds(data.selected_service_type_ids || []);
      }
    } catch (error) {
      console.error("Error fetching selected services:", error);
    }
  };

  const handleLocationUpdate = async (locationData: StoreLocation) => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_BASE_URL}/api/sellers/stores/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(locationData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Lokasi toko berhasil diperbarui!");
        setStoreLocation(locationData);
        setShowLocationModal(false);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || "Gagal memperbarui lokasi");
      }
    } catch (error) {
      console.error("Error updating location:", error);
      setError("Terjadi kesalahan saat memperbarui lokasi");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleServiceType = (typeId: number) => {
    setSelectedServiceTypeIds((prev) => {
      if (prev.includes(typeId)) {
        return prev.filter((id) => id !== typeId);
      } else {
        return [...prev, typeId];
      }
    });
  };

  const handleSaveServices = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `${API_BASE_URL}/api/sellers/shipping/store-services`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            selected_service_type_ids: selectedServiceTypeIds,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess("Layanan pengiriman berhasil diperbarui!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || "Gagal memperbarui layanan pengiriman");
      }
    } catch (error) {
      console.error("Error saving services:", error);
      setError("Terjadi kesalahan saat menyimpan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Lokasi Toko - Compact Version */}
      <Card className="bg-gray-50 border-0 shadow-sm">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium text-sm">Lokasi Toko</p>
                <p className="text-sm text-yellow-600">
                  {storeLocation?.subdistrict ||
                    storeLocation?.district ||
                    storeLocation?.city ||
                    "Belum diatur"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLocationModal(true)}
              className="gap-2"
            >
              <MapPin className="h-4 w-4" />
              Ubah Lokasi
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Kurir Toko */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Kurir Toko
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Aktifkan kurir toko jika kamu punya kurir tokomu sendiri atau jika
            produkmu tidak membutuhkan pengiriman seperti layanan pulsa, voucher
            game, dsb.
          </p>

          <Button
            variant="default"
            onClick={() => router.push("/seller/settings/courier-config")}
          >
            Atur Kurir
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Jasa Pengiriman */}
      <Card>
        <CardHeader>
          <CardTitle>Layanan Pengiriman</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-6">
            Pilih jasa pengiriman yang ingin kamu gunakan untuk toko Anda
          </p>

          <div className="space-y-6">
            {courierServices.map((service) => (
              <div key={service.service_code} className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">
                  {service.service_name}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {service.types.map((type) => (
                    <label
                      key={type.type_id}
                      className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedServiceTypeIds.includes(type.type_id)}
                        onChange={() => handleToggleServiceType(type.type_id)}
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {type.type_name}
                        </div>
                        {type.type_description && (
                          <div className="text-xs text-gray-500 mt-1">
                            {type.type_description}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                fetchSelectedServices();
                setError(null);
                setSuccess(null);
              }}
            >
              Batalkan
            </Button>
            <Button onClick={handleSaveServices} disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Location Update Modal */}
      <LocationUpdateModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        currentLocation={storeLocation}
        onSave={handleLocationUpdate}
        loading={loading}
      />
    </div>
  );
}
