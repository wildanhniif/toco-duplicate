"use client";

import { useEffect, useState } from "react";
import { Plus, Check, MapPin, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import AddressForm from "@/components/composites/Address/AddressForm";
import { cn } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Address {
  address_id: number;
  label: string;
  recipient_name: string;
  phone_number: string;
  address_line: string;
  province: string;
  city: string;
  district: string;
  subdistrict: string;
  postal_code: string;
  is_primary: boolean;
}

interface AddressSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (addressId: number) => void;
  selectedId?: number;
}

export default function AddressSelectionModal({
  isOpen,
  onClose,
  onSelect,
  selectedId,
}: AddressSelectionModalProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"list" | "create">("list");

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE_URL}/api/addresses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast.error("Gagal memuat alamat");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && mode === "list") {
      fetchAddresses();
    }
  }, [isOpen, mode]);

  const handleSelect = async (addressId: number) => {
    try {
        // Optimistically close
        onClose(); 
        await onSelect(addressId);
    } catch (error) {
        console.error("Error selecting address", error);
        toast.error("Gagal memilih alamat");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "list" ? "Pilih Alamat Pengiriman" : "Tambah Alamat Baru"}
          </DialogTitle>
        </DialogHeader>

        {mode === "list" ? (
          <div className="space-y-4">
            <Button
              className="w-full justify-start gap-2 h-12"
              variant="outline"
              onClick={() => setMode("create")}
            >
              <Plus className="w-5 h-5 text-orange-600" />
              <span className="text-orange-600 font-medium">
                Tambah Alamat Baru
              </span>
            </Button>

            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <MapPin className="w-12 h-12 text-gray-200 mx-auto" />
                <p className="text-gray-500">Belum ada alamat tersimpan</p>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <Card
                    key={addr.address_id}
                    className={cn(
                      "p-4 cursor-pointer relative border-2 transition-all hover:border-orange-200",
                      selectedId === addr.address_id
                        ? "border-orange-500 bg-orange-50/30"
                        : "border-transparent border-gray-100"
                    )}
                    onClick={() => handleSelect(addr.address_id)}
                  >
                    {selectedId === addr.address_id && (
                      <div className="absolute top-4 right-4 text-orange-600">
                        <Check className="w-5 h-5" />
                      </div>
                    )}
                    <div className="pr-8">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {addr.label}
                        </span>
                        {addr.is_primary && (
                          <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-medium">
                            Utama
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-sm text-gray-800 mb-1">
                        {addr.recipient_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {addr.phone_number}
                      </p>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {addr.address_line}
                      </p>
                      <p className="text-sm text-gray-600">
                        {addr.subdistrict}, {addr.district}, {addr.city},{" "}
                        {addr.province} {addr.postal_code}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
             <Button
                variant="ghost"
                size="sm"
                className="mb-4 -ml-2 text-gray-500"
                onClick={() => setMode("list")}
              >
                  Kembali ke Daftar
              </Button>
            <AddressForm
              onSuccess={(newId) => {
                setMode("list");
                if (newId !== -1) {
                    // Try to auto select the new address if ID returned
                    // But list mode will refresh and show it
                }
              }}
              onCancel={() => setMode("list")}
              submitLabel="Simpan Alamat"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
