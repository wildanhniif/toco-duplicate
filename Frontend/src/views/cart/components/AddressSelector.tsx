"use client";

import React, { useState, useEffect } from "react";
import { MapPin, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddressForm from "@/components/composites/Address/AddressForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_BASE_URL}/api/addresses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAddresses(data.data || []);

        // Set selected address
        if (selectedAddressId) {
          const addr = data.data.find(
            (a: Address) => a.address_id === selectedAddressId
          );
          setSelectedAddress(addr || null);
        } else if (data.data.length > 0) {
          // Auto-select primary or first address
          const primary = data.data.find((a: Address) => a.is_primary);
          setSelectedAddress(primary || data.data[0]);

          // Set it to cart
          if (primary || data.data[0]) {
            await handleSelectAddress((primary || data.data[0]).address_id);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [selectedAddressId]);

  const handleSelectAddress = async (addressId: number) => {
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
        const addr = addresses.find((a) => a.address_id === addressId);
        setSelectedAddress(addr || null);
        onAddressChange();
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

  if (addresses.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-gray-900 mb-1">Belum Ada Alamat</p>
            <p className="text-sm text-gray-600 mb-3">
              Tambahkan alamat pengiriman untuk melanjutkan
            </p>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Alamat
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Alamat Baru</DialogTitle>
                </DialogHeader>
                <AddressForm
                  defaultIsPrimary={true}
                  submitLabel="Simpan Alamat"
                  onCancel={() => setIsAddDialogOpen(false)}
                  onSuccess={async () => {
                    await fetchAddresses();
                    setIsAddDialogOpen(false);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <MapPin className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">Dikirim ke:</h4>

            {/* Address Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-orange-600"
                >
                  Ubah
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                {addresses.map((addr) => (
                  <DropdownMenuItem
                    key={addr.address_id}
                    onClick={() => handleSelectAddress(addr.address_id)}
                    className="flex-col items-start p-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{addr.label}</span>
                      {addr.is_primary && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                          Utama
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {addr.recipient_name} | {addr.phone_number}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {addr.address_line}, {addr.subdistrict}, {addr.district},{" "}
                      {addr.city}, {addr.province} {addr.postal_code}
                    </p>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Selected Address Display */}
          {selectedAddress && (
            <div className="text-sm">
              <p className="font-medium text-gray-900">
                {selectedAddress.recipient_name} |{" "}
                {selectedAddress.phone_number}
              </p>
              <p className="text-gray-600 mt-1">
                {selectedAddress.address_line}
              </p>
              <p className="text-gray-500">
                {selectedAddress.subdistrict}, {selectedAddress.district}
              </p>
              <p className="text-gray-500">
                {selectedAddress.city}, {selectedAddress.province}{" "}
                {selectedAddress.postal_code}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
