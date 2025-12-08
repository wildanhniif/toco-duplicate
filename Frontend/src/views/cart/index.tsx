"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, ShoppingBag, Package, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import CartItemCard from "./components/CartItemCard";
import CartSummary from "./components/CartSummary";
import AddressSelector from "./components/AddressSelector";
import StoreShippingSelector from "./components/StoreShippingSelector";
import { toast } from "sonner";

interface CartItem {
  cart_item_id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  sku_id: number | null;
  variation: string | null;
  stock: number;
  quantity: number;
  unit_price: number;
  original_price: number;
  discount_percent: number;
  is_selected: boolean;
  weight_gram: number;
  subtotal: number;
}

interface CartShippingSelection {
  courier_code: string;
  service_code: string;
  service_name: string | null;
  etd_min_days: number | null;
  etd_max_days: number | null;
  delivery_fee: number;
}

interface StoreGroup {
  store_id: number;
  store_name: string;
  items: CartItem[];
  shipping: CartShippingSelection | null;
}

interface CartVoucher {
  voucher_id: number;
  discount_amount: number;
}

interface CartData {
  cart_id: number;
  shipping_address_id: number | null;
  groups: StoreGroup[];
  voucher: CartVoucher | null;
  summary: {
    total_items: number;
    subtotal: number;
    delivery: number;
    voucher_discount: number;
    total: number;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function CartPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [selectAll, setSelectAll] = useState(false);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_BASE_URL}/api/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCartData(data);

        // Check if all items are selected
        const allSelected = data.groups.every((group: StoreGroup) =>
          group.items.every((item: CartItem) => item.is_selected)
        );
        setSelectAll(allSelected);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleSelectAll = async (checked: boolean) => {
    try {
      const token = localStorage.getItem("auth_token");
      await fetch(`${API_BASE_URL}/api/cart/select`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_selected: checked }),
      });

      setSelectAll(checked);
      fetchCart();
    } catch (error) {
      console.error("Error selecting all:", error);
    }
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm("Hapus semua produk yang dipilih?")) return;

    try {
      const token = localStorage.getItem("auth_token");
      await fetch(`${API_BASE_URL}/api/cart/items/selected/all`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchCart();
    } catch (error) {
      console.error("Error deleting selected:", error);
    }
  };

  const handleUpdateQuantity = async (cartItemId: number, quantity: number) => {
    if (quantity < 1) return;

    try {
      const token = localStorage.getItem("auth_token");
      await fetch(`${API_BASE_URL}/api/cart/items/${cartItemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity }),
      });

      fetchCart();
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const handleToggleSelect = async (
    cartItemId: number,
    isSelected: boolean
  ) => {
    try {
      const token = localStorage.getItem("auth_token");
      await fetch(`${API_BASE_URL}/api/cart/items/${cartItemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_selected: isSelected }),
      });

      fetchCart();
    } catch (error) {
      console.error("Error toggling select:", error);
    }
  };

  const handleDeleteItem = async (cartItemId: number) => {
    if (!window.confirm("Hapus produk dari keranjang?")) return;

    try {
      const token = localStorage.getItem("auth_token");
      await fetch(`${API_BASE_URL}/api/cart/items/${cartItemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchCart();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleCheckout = () => {
    const hasSelected = cartData?.groups.some((group) =>
      group.items.some((item) => item.is_selected)
    );

    if (!hasSelected) {
      toast.error("Pilih minimal 1 produk untuk checkout");
      return;
    }

    if (!cartData?.shipping_address_id) {
      toast.error("Pilih alamat pengiriman terlebih dahulu");
      return;
    }

    router.push("/checkout");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-gray-400 animate-pulse" />
          <p className="mt-4 text-gray-600">Memuat keranjang...</p>
        </div>
      </div>
    );
  }

  if (!cartData || cartData.groups.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pb-12">
        <div className="w-full max-w-[1440px] mx-auto px-[5%] pt-32 lg:pt-40">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Keranjang Belanja
            </h1>
            <p className="text-gray-600 mt-1">Kelola produk belanjaan Anda</p>
          </div>

          {/* Empty State Card */}
          <Card className="p-12">
            <div className="text-center max-w-md mx-auto">
              <div className="w-32 h-32 mx-auto bg-orange-50 rounded-full flex items-center justify-center mb-6">
                <ShoppingBag className="w-16 h-16 text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Wah, Keranjang Belanja Kosong
              </h2>
              <p className="text-gray-600 mb-6">
                Yuk, isi dengan barang-barang impianmu! Jelajahi berbagai produk
                menarik dan masukkan ke keranjang.
              </p>
              <Button
                size="lg"
                className="w-full sm:w-auto px-8"
                onClick={() => router.push("/")}
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Mulai Belanja Sekarang
              </Button>
            </div>
          </Card>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Card className="p-4 bg-orange-50 border-orange-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Produk Lengkap
                  </h3>
                  <p className="text-sm text-gray-600">
                    Ribuan produk berkualitas menanti Anda
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-blue-50 border-blue-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Belanja Mudah
                  </h3>
                  <p className="text-sm text-gray-600">
                    Proses checkout yang cepat dan aman
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-green-50 border-green-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Gratis Ongkir
                  </h3>
                  <p className="text-sm text-gray-600">
                    Nikmati berbagai promo menarik
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="w-full max-w-[1440px] mx-auto px-[5%] pt-32 lg:pt-40">
        <nav className="text-sm text-gray-600 mb-4 flex flex-wrap items-center gap-1">
          <span className="cursor-pointer" onClick={() => router.push("/")}>
            Beranda
          </span>
          <span>/</span>
          <span className="truncate max-w-[140px] md:max-w-xs">Keranjang</span>
        </nav>
        {/* Header atas: tombol kembali + judul */}
        <div className="mb-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </Button>
          <h1 className="hidden sm:block text-lg font-semibold text-gray-900">
            Keranjang Belanja
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Header */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="font-medium text-gray-900">
                    Pilih Semua ({cartData.summary.total_items} Produk)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteSelected}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </Button>
              </div>
            </div>

            {/* Cart Items by Store */}
            {cartData.groups.map((group) => (
              <Card key={group.store_id} className="p-4">
                {/* Store Name */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                  <Package className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-gray-900">
                    {group.store_name}
                  </h3>
                </div>

                {/* Store Items */}
                <div className="space-y-4">
                  {group.items.map((item) => (
                    <CartItemCard
                      key={item.cart_item_id}
                      item={item}
                      onToggleSelect={handleToggleSelect}
                      onUpdateQuantity={handleUpdateQuantity}
                      onDelete={handleDeleteItem}
                    />
                  ))}
                </div>

                {/* Shipping Selector for this Store */}
                <StoreShippingSelector
                  storeId={group.store_id}
                  storeName={group.store_name}
                  currentShipping={group.shipping}
                  onShippingChanged={fetchCart}
                />
              </Card>
            ))}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              {/* Address Selector */}
              <AddressSelector
                selectedAddressId={cartData.shipping_address_id}
                onAddressChange={fetchCart}
              />

              {/* Cart Summary */}
              <CartSummary
                summary={cartData.summary}
                onCheckout={handleCheckout}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
