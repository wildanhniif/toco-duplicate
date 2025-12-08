"use client";

import React, { useEffect, useState } from "react";
import { Truck, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ShippingRate {
  name: string;
  code: string;
  service: string;
  description: string;
  cost: number;
  etd: string;
}

interface StoreShippingSelectorProps {
  storeId: number;
  storeName: string;
  currentShipping: {
    courier_code: string;
    service_code: string;
    service_name?: string | null;
    etd_min_days?: number | null;
    etd_max_days?: number | null;
    delivery_fee?: number;
  } | null;
  onShippingChanged: () => void;
}

export default function StoreShippingSelector({
  storeId,
  storeName,
  currentShipping,
  onShippingChanged,
}: StoreShippingSelectorProps) {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getCurrentEtdText = () => {
    if (!currentShipping) return "Belum dipilih";
    const min = currentShipping.etd_min_days;
    const max = currentShipping.etd_max_days;
    if (min && max) return `${min}-${max} hari`;
    if (min) return `${min} hari`;
    return "Estimasi tidak tersedia";
  };

  // Fetch shipping rates with actual prices from RajaOngkir
  const loadRates = async () => {
    try {
      setLoading(true);
      setError(null);
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;
      if (!token) {
        setError("Silakan login untuk melihat ongkos kirim.");
        return;
      }

      // Fetch rates for common couriers
      const couriers = ["jne", "jnt", "sicepat", "anteraja", "pos"];
      const allRates: ShippingRate[] = [];
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
            console.error(`Shipping calc error (${courier}):`, data.message);
          }
        } catch (e) {
          console.error(`Error fetching rates for ${courier}:`, e);
        }
      }

      if (allRates.length === 0 && lastErrorMessage) {
        setError(lastErrorMessage);
        return;
      }

      // Sort by cost (lowest first)
      allRates.sort((a, b) => a.cost - b.cost);
      setRates(allRates);

      if (allRates.length === 0) {
        setError(
          "Tidak ada ongkir tersedia. Pastikan alamat pengiriman sudah dipilih."
        );
      }
    } catch (e) {
      console.error("Error loading shipping rates:", e);
      setError("Terjadi kesalahan saat memuat ongkos kirim.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const handleSelect = async (rate: ShippingRate) => {
    try {
      const key = `${rate.code}|${rate.service}`;
      setSubmittingKey(key);
      setError(null);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;
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
          cost: rate.cost,
          etd: rate.etd,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || "Gagal menyimpan pilihan pengiriman");
        return;
      }

      // Berhasil menyimpan, refresh data cart
      onShippingChanged();
    } catch (e) {
      console.error("Error setting shipping:", e);
      setError("Terjadi kesalahan saat menyimpan pilihan pengiriman.");
    } finally {
      setSubmittingKey(null);
    }
  };

  return (
    <div className="mt-4 border-t pt-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Truck className="w-4 h-4 text-orange-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Pengiriman dari {storeName}
            </p>
            {currentShipping ? (
              <p className="text-xs text-gray-600 mt-1">
                Saat ini: {currentShipping.courier_code?.toUpperCase()} -{" "}
                {currentShipping.service_name || currentShipping.service_code}
                {typeof currentShipping.delivery_fee === "number" && (
                  <>
                    {" "}
                    - {formatPrice(currentShipping.delivery_fee)} (
                    {getCurrentEtdText()})
                  </>
                )}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Belum ada metode pengiriman yang dipilih.
              </p>
            )}
          </div>
        </div>
        {rates.length > 0 && !loading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={loadRates}
            className="text-xs"
          >
            Refresh
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Menghitung ongkos kirim...</span>
        </div>
      )}

      {!loading && rates.length === 0 && !error && (
        <p className="text-xs text-gray-500">
          Tidak ada layanan pengiriman tersedia. Pastikan alamat sudah dipilih.
        </p>
      )}

      {!loading && rates.length > 0 && (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {rates.map((rate) => {
            const key = `${rate.code}|${rate.service}`;
            const isActive =
              currentShipping &&
              currentShipping.courier_code?.toLowerCase() ===
                rate.code.toLowerCase() &&
              String(currentShipping.service_code).toUpperCase() ===
                String(rate.service).toUpperCase();

            return (
              <div
                key={key}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (!submittingKey) handleSelect(rate);
                }}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && !submittingKey) {
                    e.preventDefault();
                    handleSelect(rate);
                  }
                }}
                className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                  isActive
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 hover:border-orange-400 hover:bg-orange-50/40"
                } ${
                  submittingKey === key ? "opacity-70 pointer-events-none" : ""
                }`}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 uppercase">
                      {rate.code}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {rate.service}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    {rate.description || rate.name}
                  </p>
                  {rate.etd && (
                    <div className="flex items-center gap-1 text-[11px] text-gray-600">
                      <Clock className="w-3 h-3" />
                      <span>Estimasi: {rate.etd}</span>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <p className="font-bold text-gray-900 mb-1">
                    {formatPrice(rate.cost)}
                  </p>
                  <span
                    className={`inline-flex items-center justify-center text-xs px-3 py-1 h-7 rounded-md font-medium ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "border border-input bg-background hover:bg-accent"
                    }`}
                  >
                    {submittingKey === key
                      ? "Menyimpan..."
                      : isActive
                      ? "Dipakai"
                      : "Pilih"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div className="p-2 bg-red-50 rounded-lg">
          <p className="text-xs text-red-600">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadRates}
            className="mt-1 text-xs text-red-600"
          >
            Coba lagi
          </Button>
        </div>
      )}
    </div>
  );
}
