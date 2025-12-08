"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AddressForm from "@/components/composites/Address/AddressForm";
import { useAuth } from "@/hooks/useAuth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface AddressGateProps {
  children: React.ReactNode;
}

export default function AddressGate({ children }: AddressGateProps) {
  const { isAuthenticated, isLoading, token } = useAuth();
  const [checking, setChecking] = useState(true);
  const [hasAddress, setHasAddress] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAddresses = async () => {
      if (!isAuthenticated || !token) {
        setHasAddress(null);
        setChecking(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/addresses`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          setHasAddress(null);
          setChecking(false);
          return;
        }

        const data = await res.json();
        const list = Array.isArray(data?.data) ? data.data : [];
        setHasAddress(list.length > 0);
      } catch (e) {
        console.error("Failed to check user addresses", e);
        setHasAddress(null);
      } finally {
        setChecking(false);
      }
    };

    if (!isLoading) {
      checkAddresses();
    }
  }, [isAuthenticated, isLoading, token]);

  // Jika belum login atau address check gagal, jangan blokir apa pun
  if (
    !isAuthenticated ||
    hasAddress === true ||
    (!checking && hasAddress === null)
  ) {
    return <>{children}</>;
  }

  // Saat masih mengecek, tampilkan children + overlay loading ringan
  if (checking) {
    return (
      <>
        {children}
        <div className="fixed inset-0 z-[60] bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-lg px-6 py-4 shadow">
            <p className="text-sm text-gray-700">
              Memeriksa alamat utama Anda...
            </p>
          </div>
        </div>
      </>
    );
  }

  // Gating: user login tapi belum punya alamat sama sekali
  return (
    <>
      {children}
      <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center px-4">
        <Card className="w-full max-w-lg p-6 bg-white shadow-xl relative">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Lengkapi Alamat Pengiriman
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Sebelum mulai belanja di Tokoo, isi dulu alamat utama kamu.
                Alamat ini akan digunakan untuk pengiriman pesanan.
              </p>
            </div>
          </div>

          <AddressForm
            defaultIsPrimary={true}
            submitLabel="Simpan dan Lanjutkan"
            onSuccess={() => {
              setHasAddress(true);
            }}
          />

          <p className="mt-3 text-[11px] text-gray-500">
            *Wajib diisi sekali saja. Kamu masih bisa menambah atau mengubah
            alamat di kemudian hari.
          </p>
        </Card>
      </div>
    </>
  );
}
