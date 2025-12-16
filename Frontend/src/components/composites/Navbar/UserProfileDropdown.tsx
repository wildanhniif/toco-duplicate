"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ShoppingBag,
  Package,
  MapPin,
  MessageCircle,
  Settings,
  LogOut,
  User,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function UserProfileDropdown() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (!user) return null;

  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src="" alt={user.name} />
            <AvatarFallback className="bg-teal-600 text-white font-semibold">
              {userInitial}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-4" align="end" forceMount>
        {/* User Info */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src="" alt={user.name} />
            <AvatarFallback className="bg-teal-600 text-white font-semibold">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <DropdownMenuLabel className="p-0 text-base font-semibold">
              {user.name}
            </DropdownMenuLabel>
            <p className="text-sm text-gray-600">Sejak 02 Nov 2025</p>
          </div>
        </div>

        {/* Order Status Cards */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Link
            href="/user/orders?status=unpaid"
            className="flex flex-col items-center p-3 border rounded-lg hover:bg-gray-50"
          >
            <Package className="h-6 w-6 mb-1 text-gray-600" />
            <span className="text-xs text-center">Belum Dibayar</span>
          </Link>
          <Link
            href="/user/orders?status=ongoing"
            className="flex flex-col items-center p-3 border rounded-lg hover:bg-gray-50"
          >
            <ShoppingBag className="h-6 w-6 mb-1 text-gray-600" />
            <span className="text-xs text-center">Berlangsung</span>
          </Link>
          <Link
            href="/user/orders?status=delivered"
            className="flex flex-col items-center p-3 border rounded-lg hover:bg-gray-50"
          >
            <MapPin className="h-6 w-6 mb-1 text-gray-600" />
            <span className="text-xs text-center">Tiba di Tujuan</span>
          </Link>
        </div>

        {/* View All Orders */}
        <div className="text-center mb-4">
          <Link
            href="/user/orders"
            className="text-blue-600 font-semibold text-sm hover:underline"
          >
            Lihat Semua Pesanan
          </Link>
        </div>

        <DropdownMenuSeparator />

        {/* Menu Items */}
        <DropdownMenuItem asChild>
          <Link href="/admin/chat" className="flex items-center w-full py-2">
            <MessageCircle className="h-4 w-4 mr-3" />
            Chat Admin Toco
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href="/user/settings"
            className="flex items-center w-full py-2"
          >
            <Settings className="h-4 w-4 mr-3" />
            Pengaturan Akun
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center w-full py-2 text-red-600 focus:text-red-600"
        >
          <LogOut className="h-4 w-4 mr-3" />
          Keluar Akun
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
