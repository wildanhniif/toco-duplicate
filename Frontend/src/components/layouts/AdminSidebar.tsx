"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Users,
  Image as ImageIcon,
  Layers,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const menuItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    title: "Pengguna",
    href: "/admin/users",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Kategori",
    href: "/admin/categories",
    icon: <Layers className="h-5 w-5" />,
  },
  {
    title: "Banner",
    href: "/admin/banners",
    icon: <ImageIcon className="h-5 w-5" />,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActiveLink = (href: string) => {
    return (
      pathname === href ||
      (href !== "/admin/dashboard" && pathname.startsWith(href))
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data"); // If any
    window.location.href = "/auth/login";
  };

  return (
    <div className="fixed top-0 left-0 h-screen w-64 bg-slate-900 text-white shadow-lg z-40 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <Link href="/admin/dashboard">
            <h1 className="text-xl font-bold tracking-wider">ADMIN PANEL</h1>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <div key={item.title}>
              <Button
                variant="ghost"
                asChild
                className={cn(
                  "w-full justify-start text-left hover:bg-slate-800 hover:text-white",
                  isActiveLink(item.href) && "bg-slate-800 text-white"
                )}
              >
                <Link href={item.href}>
                  {item.icon}
                  <span className="ml-3">{item.title}</span>
                </Link>
              </Button>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-700">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-left hover:bg-red-900/50 hover:text-red-200 text-red-400"
        >
          <LogOut className="h-5 w-5" />
          <span className="ml-3">Keluar</span>
        </Button>
      </div>
    </div>
  );
}
