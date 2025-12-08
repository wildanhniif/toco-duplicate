"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Store, UserRound, Bell, ShoppingCart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import UserProfileDropdown from "./UserProfileDropdown";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AuthButton() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [cartCount, setCartCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCartCount = async () => {
      if (!isAuthenticated) {
        setCartCount(null);
        return;
      }

      try {
        const token = localStorage.getItem("auth_token");
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/api/cart`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        const count =
          data?.summary && typeof data.summary.total_items === "number"
            ? data.summary.total_items
            : 0;
        setCartCount(count);
      } catch (error) {
        console.error("Error fetching cart count:", error);
      }
    };

    fetchCartCount();
  }, [isAuthenticated]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="hidden lg:flex items-center gap-4">
        <div className="h-11 w-20 bg-gray-200 animate-pulse rounded-md"></div>
        <div className="h-11 w-32 bg-gray-200 animate-pulse rounded-md"></div>
      </div>
    );
  }

  // If not authenticated, show login/register buttons
  if (!isAuthenticated) {
    return (
      <div className="hidden lg:flex items-center gap-4">
        <Button
          asChild
          size="lg"
          variant="outline"
          type="button"
          name="login-trigger"
          id="login-trigger"
          className="font-bold h-11"
        >
          <Link href="/login">
            <UserRound /> Masuk
          </Link>
        </Button>
        <Button
          asChild
          size="lg"
          type="button"
          name="start-selling"
          id="start-selling"
          className="font-bold h-11"
        >
          <Link href="/login?redirect_to_seller=true">
            <Store /> Mulai Jualan
          </Link>
        </Button>
      </div>
    );
  }

  // If authenticated as seller, show seller-specific UI
  if (user?.role === "seller") {
    return (
      <div className="hidden lg:flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
            1
          </span>
        </Button>
        <Button variant="ghost" size="icon" className="relative" asChild>
          <Link href="/cart">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full text-xs text-white flex items-center justify-center">
              {cartCount ?? 0}
            </span>
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="font-bold h-11">
          <Link href="/seller/dashboard">
            <Store /> Toco Seller
          </Link>
        </Button>
        <UserProfileDropdown />
      </div>
    );
  }

  // If authenticated as customer, show customer UI with seller registration option
  return (
    <div className="hidden lg:flex items-center gap-4">
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
      </Button>
      <Button variant="ghost" size="icon" className="relative" asChild>
        <Link href="/cart">
          <ShoppingCart className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full text-xs text-white flex items-center justify-center">
            {cartCount ?? 0}
          </span>
        </Link>
      </Button>
      <Button
        asChild
        size="lg"
        type="button"
        name="start-selling"
        id="start-selling"
        className="font-bold h-11"
      >
        <Link href="/seller/login">
          <Store /> Mulai Jualan
        </Link>
      </Button>
      <UserProfileDropdown />
    </div>
  );
}
