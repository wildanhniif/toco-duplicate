"use client";

import React, { useState, useEffect } from "react";
import { MapPin, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  is_primary: boolean;
}

interface AddressSelectorProps {
  selectedAddressId: number | null;
  onAddressChange: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AddressSelector({
  selectedAddressId,
  onAddressChange,
}: AddressSelectorProps) {
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch only the selected address (or primary if none selected) to display
  // The full list is handled by the modal now.
  const fetchSelectedAddress = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_BASE_URL}/api/addresses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const allAddresses = data.data || [];

        if (allAddresses.length > 0) {
           let target = null;
           if (selectedAddressId) {
             target = allAddresses.find((a: Address) => a.address_id === selectedAddressId);
           }
           
           // If no specific selection or not found, fallback to primary or first
           if (!target) {
              target = allAddresses.find((a: Address) => a.is_primary) || allAddresses[0];
              // Auto-select in backend if we fell back
              if (target && target.address_id !== selectedAddressId) {
                 handleSelectAddress(target.address_id, true); // silent update
              }
           }
           setSelectedAddress(target || null);
        } else {
           setSelectedAddress(null);
        }
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSelectedAddress();
  }, [selectedAddressId]);

  const handleSelectAddress = async (addressId: number, silent = false) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_BASE_URL}/api/cart/address`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ address_id: addressId }),
      });

      if (response.ok) {
        if (!silent) {
            onAddressChange();
            fetchSelectedAddress();
        }
      }
    } catch (error) {
      console.error("Error selecting address:", error);
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </Card>
    );
  }

  if (!selectedAddress) {
    return (
      <>
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-gray-900 mb-1">Belum Ada Alamat</p>
            <p className="text-sm text-gray-600 mb-3">
              Tambahkan alamat pengiriman untuk melanjutkan
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Pilih / Tambah Alamat
            </Button>
          </div>
        </div>
      </Card>
      <AddressSelectionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={(id) => handleSelectAddress(id)}
      />
      </>
    );
  }

  return (
    <>
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <MapPin className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">Dikirim ke:</h4>
            <Button
                variant="ghost"
                size="sm"
                className="h-7 text-orange-600"
                onClick={() => setIsModalOpen(true)}
            >
                Ubah
                <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Selected Address Display */}
          <div className="text-sm">
            <div className="flex items-center gap-2 mb-1">
               <span className="font-medium text-gray-900">
                {selectedAddress.recipient_name}
               </span>
               <span className="text-gray-500">|</span> 
               <span className="text-gray-600">{selectedAddress.phone_number}</span>
               {selectedAddress.label && (
                 <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 ml-1">
                    {selectedAddress.label}
                 </span>
               )}
            </div>
            <p className="text-gray-600 mt-1 line-clamp-2">
              {selectedAddress.address_line}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              {selectedAddress.subdistrict}, {selectedAddress.district}, {selectedAddress.city}, {selectedAddress.province} {selectedAddress.postal_code}
            </p>
          </div>
        </div>
      </div>
    </Card>
    <AddressSelectionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={(id) => handleSelectAddress(id)}
        selectedId={selectedAddress.address_id}
    />
    </>
  );
}
