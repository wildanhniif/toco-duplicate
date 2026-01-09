"use client";

import React, { useState } from "react";
import { MapPin, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import AddressSelectionModal from "@/components/composites/Address/AddressSelectionModal";

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
}

interface CheckoutAddressCardProps {
  address: Address | null;
  onAddressChange: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function CheckoutAddressCard({
  address,
  onAddressChange,
}: CheckoutAddressCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectAddress = async (addressId: number) => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE_URL}/api/cart/address`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ address_id: addressId }),
      });

      if (!res.ok) {
        throw new Error("Failed to set address");
      }
      
      onAddressChange(); // Refresh checkout data
      setIsModalOpen(false);
      toast.success("Alamat pengiriman diperbarui");
    } catch (error) {
      console.error("Error setting address:", error);
      toast.error("Gagal memilih alamat");
    }
  };

  if (!address) {
    return (
      <>
        <Card className="p-6 border-2 border-red-300 bg-red-50">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-2">
                Alamat Pengiriman Belum Dipilih
              </h3>
              <p className="text-sm text-red-700 mb-3">
                Silakan pilih alamat pengiriman untuk melanjutkan checkout
              </p>
              <Button size="sm" variant="outline" onClick={() => setIsModalOpen(true)}>
                Pilih Alamat
              </Button>
            </div>
          </div>
        </Card>
        <AddressSelectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelect={handleSelectAddress}
          selectedId={address?.address_id}
        />
      </>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <MapPin className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-gray-900">Alamat Pengiriman</h3>
                {address.label && (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                    {address.label}
                  </span>
                )}
              </div>
              <p className="font-medium text-gray-900">
                {address.recipient_name} | {address.phone_number}
              </p>
              <p className="text-sm text-gray-600 mt-2">{address.address_line}</p>
              <p className="text-sm text-gray-600">
                {address.subdistrict}, {address.district}
              </p>
              <p className="text-sm text-gray-600">
                {address.city}, {address.province} {address.postal_code}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsModalOpen(true)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Ubah
          </Button>
        </div>
      </Card>
      
      <AddressSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectAddress}
        selectedId={address?.address_id}
      />
    </>
  );
}
