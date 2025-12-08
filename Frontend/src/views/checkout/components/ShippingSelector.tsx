"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  Clock,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Shipping {
  courier_code: string;
  service_code: string;
  service_name: string;
  etd_min_days: number | null;
  etd_max_days: number | null;
  delivery_fee: number;
}

// Rate option from RajaOngkir
interface RateOption {
  name: string;
  code: string;
  service: string;
  description: string;
  cost: number;
  etd: string;
}

interface ShippingSelectorProps {
  storeId: number;
  shipping: Shipping | null;
  onShippingChange: () => void;
}

export default function ShippingSelector({
  storeId,
  shipping,
  onShippingChange,
}: ShippingSelectorProps) {
  const [expanded, setExpanded] = useState(!shipping);
  const [rates, setRates] = useState<RateOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getEtdText = (etdMin?: number | null, etdMax?: number | null) => {
    if (etdMin && etdMax) {
      return `${etdMin}-${etdMax} hari`;
    }
    if (etdMin) {
      return `${etdMin} hari`;
    }
    return "Estimasi tidak tersedia";
  };

  // Load shipping rates directly from RajaOngkir via backend
  const loadRates = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setError("Silakan login untuk melihat layanan pengiriman.");
        return;
      }

      // Fetch rates for common couriers: jne, jnt, sicepat, anteraja, pos
      const couriers = ["jne", "jnt", "sicepat", "anteraja", "pos"];
      const allRates: RateOption[] = [];

      let lastErrorMessage = "";
      for (const courier of couriers) {
        try {
          const res = await fetch(
            `${API_BASE_URL}/api/shipping/calculate/domestic`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                store_id: storeId,
                courier: courier,
              }),
            }
          );

          const data = await res.json().catch(() => ({}));

          if (res.ok) {
            const rateList = Array.isArray(data.data) ? data.data : [];
            allRates.push(...rateList);
          } else if (data.message) {
            lastErrorMessage = data.message;
            console.log(`Shipping API error for ${courier}:`, data.message);
          }
        } catch (e) {
          console.error(`Error fetching rates for ${courier}:`, e);
        }
      }

      if (allRates.length === 0 && lastErrorMessage) {
        setError(lastErrorMessage);
        return;
      }

      // Sort by cost
      allRates.sort((a, b) => a.cost - b.cost);
      setRates(allRates);

      if (allRates.length === 0) {
        setError(
          "Tidak ada layanan pengiriman tersedia. Pastikan alamat sudah diisi."
        );
      }
    } catch (e) {
      console.error("Error loading shipping rates:", e);
      setError("Terjadi kesalahan saat memuat layanan pengiriman.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const handleSelect = async (rate: RateOption) => {
    try {
      const key = `${rate.code}|${rate.service}`;
      setSubmitting(key);
      setError(null);

      const token = localStorage.getItem("auth_token");
      if (!token) {
        setError("Silakan login terlebih dahulu.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/cart/shipping/${storeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courier_code: rate.code,
          service_code: rate.service,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || "Gagal menyimpan pilihan pengiriman");
        return;
      }

      setExpanded(false);
      onShippingChange();
    } catch (e) {
      console.error("Error setting shipping:", e);
      setError("Terjadi kesalahan saat menyimpan pilihan pengiriman.");
    } finally {
      setSubmitting(null);
    }
  };

  // Current selected shipping display
  if (shipping && !expanded) {
    return (
      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-green-100 rounded-full">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-gray-900">
                  {shipping.courier_code.toUpperCase()}
                </p>
                <Badge variant="outline" className="text-xs bg-white">
                  {shipping.service_name || shipping.service_code}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  Estimasi:{" "}
                  {getEtdText(shipping.etd_min_days, shipping.etd_max_days)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="text-xs text-gray-500">Ongkir</p>
              <p className="font-bold text-green-700">
                {formatPrice(shipping.delivery_fee)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(true)}
              className="text-xs text-orange-600 hover:text-orange-700 h-7 px-2"
            >
              Ubah
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Shipping selection panel
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="bg-orange-50 p-4 cursor-pointer flex items-center justify-between"
        onClick={() => shipping && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <Truck className="w-5 h-5 text-orange-600" />
          <div>
            <p className="font-medium text-gray-900">
              {shipping ? "Ubah Metode Pengiriman" : "Pilih Metode Pengiriman"}
            </p>
            <p className="text-xs text-gray-500">
              Pilih kurir dan layanan pengiriman
            </p>
          </div>
        </div>
        {shipping && <ChevronUp className="w-5 h-5 text-gray-400" />}
      </div>

      {/* Options */}
      <div className="p-4 bg-white">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            <span className="ml-2 text-sm text-gray-500">
              Memuat ongkos kirim dari RajaOngkir...
            </span>
          </div>
        )}

        {!loading && rates.length === 0 && !error && (
          <div className="text-center py-8">
            <Truck className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">
              Tidak ada layanan pengiriman tersedia
            </p>
          </div>
        )}

        {!loading && rates.length > 0 && (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {rates.map((rate) => {
              const key = `${rate.code}|${rate.service}`;
              const isActive =
                shipping &&
                shipping.courier_code?.toLowerCase() ===
                  rate.code.toLowerCase() &&
                shipping.service_code?.toUpperCase() ===
                  rate.service.toUpperCase();

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelect(rate)}
                  disabled={submitting === key}
                  className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-all ${
                    isActive
                      ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500"
                      : "border-gray-200 hover:border-orange-400 hover:bg-orange-50/50"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 uppercase text-sm">
                        {rate.code}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {rate.service}
                      </Badge>
                      {isActive && (
                        <Badge className="bg-orange-500 text-white text-[10px]">
                          Dipilih
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      {rate.description || rate.name}
                    </p>
                    {rate.etd && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Clock className="w-3 h-3" />
                        <span>Estimasi: {rate.etd}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-right ml-4">
                    <p className="font-bold text-gray-900">
                      {formatPrice(rate.cost)}
                    </p>
                    {submitting === key && (
                      <span className="text-xs text-orange-600">
                        Menyimpan...
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-red-600">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadRates}
              className="mt-2 text-xs"
            >
              Coba lagi
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
