"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";

interface DistancePricing {
  id?: number;
  distance_from: number;
  distance_to: number;
  price: number;
}

interface WeightPricing {
  id?: number;
  weight_from: number;
  additional_price: number;
  description: string;
}

interface CourierConfig {
  is_active: boolean;
  max_delivery_distance: number;
  distance_pricing: DistancePricing[];
  weight_pricing: WeightPricing[];
}

export default function StoreCourierConfigView() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [config, setConfig] = useState<CourierConfig>({
    is_active: false,
    max_delivery_distance: 10,
    distance_pricing: [
      { distance_from: 0, distance_to: 5, price: 10000 },
      { distance_from: 6, distance_to: 10, price: 15000 },
    ],
    weight_pricing: [
      {
        weight_from: 1000,
        additional_price: 2000,
        description: "Per 1kg tambahan",
      },
    ],
  });

  // Auth check
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || user?.role !== "seller") {
        router.push("/login");
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Fetch config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/seller/store-courier-config`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            setConfig({
              is_active: data.data.is_active || false,
              max_delivery_distance: data.data.max_delivery_distance || 10,
              distance_pricing: data.data.distance_pricing || [],
              weight_pricing: data.data.weight_pricing || [],
            });
          }
        }
      } catch (err) {
        console.error("Error fetching courier config:", err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user?.role === "seller") {
      fetchConfig();
    }
  }, [isAuthenticated, user]);

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/seller/store-courier-config`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(config),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess("Konfigurasi kurir toko berhasil disimpan!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Gagal menyimpan konfigurasi");
      }
    } catch (err) {
      setError("Terjadi kesalahan saat menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const addDistancePricing = () => {
    const lastDistance =
      config.distance_pricing.length > 0
        ? config.distance_pricing[config.distance_pricing.length - 1]
            .distance_to
        : 0;

    setConfig({
      ...config,
      distance_pricing: [
        ...config.distance_pricing,
        {
          distance_from: lastDistance + 1,
          distance_to: lastDistance + 5,
          price: 10000,
        },
      ],
    });
  };

  const removeDistancePricing = (index: number) => {
    setConfig({
      ...config,
      distance_pricing: config.distance_pricing.filter((_, i) => i !== index),
    });
  };

  const updateDistancePricing = (
    index: number,
    field: string,
    value: number
  ) => {
    const updated = [...config.distance_pricing];
    updated[index] = { ...updated[index], [field]: value };
    setConfig({ ...config, distance_pricing: updated });
  };

  const addWeightPricing = () => {
    setConfig({
      ...config,
      weight_pricing: [
        ...config.weight_pricing,
        {
          weight_from: 1000,
          additional_price: 2000,
          description: "Per kg tambahan",
        },
      ],
    });
  };

  const removeWeightPricing = (index: number) => {
    setConfig({
      ...config,
      weight_pricing: config.weight_pricing.filter((_, i) => i !== index),
    });
  };

  const updateWeightPricing = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const updated = [...config.weight_pricing];
    updated[index] = { ...updated[index], [field]: value };
    setConfig({ ...config, weight_pricing: updated });
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/seller/settings")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold">Atur Kurir Toko Sendiri</h1>
          <p className="text-gray-600 mt-1">
            Kelola pengiriman menggunakan kurir toko Anda sendiri
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {/* Aktifkan Kurir Toko */}
        <Card className="p-6 mb-6">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={config.is_active}
              onChange={(e) =>
                setConfig({ ...config, is_active: e.target.checked })
              }
              className="w-5 h-5 mt-1"
            />
            <div className="flex-1">
              <Label
                htmlFor="is_active"
                className="cursor-pointer font-semibold"
              >
                Aktifkan Kurir Toko
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Jika aktif, pembeli dapat memilih opsi pengiriman menggunakan
                kurir toko Anda
              </p>
            </div>
          </div>

          {config.is_active && (
            <div className="mt-6 pt-6 border-t">
              <Label htmlFor="max_distance">
                Batas Maksimal Pengiriman (km)
              </Label>
              <Input
                id="max_distance"
                type="number"
                value={config.max_delivery_distance}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    max_delivery_distance: parseInt(e.target.value) || 0,
                  })
                }
                className="mt-2 w-40"
                min="1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Pembeli di luar radius ini tidak bisa memilih kurir toko
              </p>
            </div>
          )}
        </Card>

        {config.is_active && (
          <>
            {/* Pengaturan Jarak */}
            <Card className="p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-lg">
                    Pengaturan Berdasarkan Jarak
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Tentukan harga ongkir berdasarkan jarak pengiriman
                  </p>
                </div>
                <Button onClick={addDistancePricing} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah
                </Button>
              </div>

              <div className="space-y-3">
                {config.distance_pricing.map((pricing, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs">Dari (km)</Label>
                        <Input
                          type="number"
                          value={pricing.distance_from}
                          onChange={(e) =>
                            updateDistancePricing(
                              index,
                              "distance_from",
                              parseInt(e.target.value) || 0
                            )
                          }
                          min="0"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Sampai (km)</Label>
                        <Input
                          type="number"
                          value={pricing.distance_to}
                          onChange={(e) =>
                            updateDistancePricing(
                              index,
                              "distance_to",
                              parseInt(e.target.value) || 0
                            )
                          }
                          min="0"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Harga (Rp)</Label>
                        <Input
                          type="number"
                          value={pricing.price}
                          onChange={(e) =>
                            updateDistancePricing(
                              index,
                              "price",
                              parseInt(e.target.value) || 0
                            )
                          }
                          min="0"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDistancePricing(index)}
                      className="text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {config.distance_pricing.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    Belum ada pengaturan jarak. Klik "Tambah" untuk menambahkan.
                  </p>
                )}
              </div>
            </Card>

            {/* Pengaturan Berat */}
            <Card className="p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-lg">
                    Pengaturan Berdasarkan Berat
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Biaya tambahan untuk berat di atas batas tertentu
                  </p>
                </div>
                <Button onClick={addWeightPricing} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah
                </Button>
              </div>

              <div className="space-y-3">
                {config.weight_pricing.map((pricing, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs">Berat Dari (gram)</Label>
                        <Input
                          type="number"
                          value={pricing.weight_from}
                          onChange={(e) =>
                            updateWeightPricing(
                              index,
                              "weight_from",
                              parseInt(e.target.value) || 0
                            )
                          }
                          min="0"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Biaya Tambahan (Rp)</Label>
                        <Input
                          type="number"
                          value={pricing.additional_price}
                          onChange={(e) =>
                            updateWeightPricing(
                              index,
                              "additional_price",
                              parseInt(e.target.value) || 0
                            )
                          }
                          min="0"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Keterangan</Label>
                        <Input
                          type="text"
                          value={pricing.description}
                          onChange={(e) =>
                            updateWeightPricing(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Per kg tambahan"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWeightPricing(index)}
                      className="text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {config.weight_pricing.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    Belum ada pengaturan berat. Klik "Tambah" untuk menambahkan.
                  </p>
                )}
              </div>
            </Card>
          </>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/seller/settings")}
          >
            Batal
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </div>
      </div>
    </div>
  );
}
