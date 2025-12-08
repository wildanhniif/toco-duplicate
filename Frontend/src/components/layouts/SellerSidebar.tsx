"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Package,
  ShoppingBag,
  TrendingUp,
  Percent,
  Settings,
  ChevronDown,
  ChevronRight,
  Plus,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface MenuItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/seller/dashboard",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    title: "Produk",
    href: "/seller/products",
    icon: <Package className="h-5 w-5" />,
    children: [
      {
        title: "Daftar Produk",
        href: "/seller/products",
        icon: <List className="h-4 w-4" />,
      },
      {
        title: "Tambah Produk",
        href: "/seller/products/add",
        icon: <Plus className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Pesanan",
    href: "/seller/orders",
    icon: <ShoppingBag className="h-5 w-5" />,
  },
  {
    title: "Statistik",
    href: "/seller/statistics",
    icon: <TrendingUp className="h-5 w-5" />,
  },
  {
    title: "Voucher Promosi",
    href: "/seller/vouchers",
    icon: <Percent className="h-5 w-5" />,
  },
  {
    title: "Pengaturan",
    href: "/seller/settings",
    icon: <Settings className="h-5 w-5" />,
    children: [
      {
        title: "Informasi Toko",
        href: "/seller/store/settings",
        icon: <Settings className="h-4 w-4" />,
      },
      {
        title: "Layanan Pengiriman",
        href: "/seller/settings?type=kurir",
        icon: <Settings className="h-4 w-4" />,
      },
      {
        title: "Template Balasan",
        href: "/seller/settings?type=template",
        icon: <Settings className="h-4 w-4" />,
      },
    ],
  },
];

export default function SellerSidebar() {
  const pathname = usePathname();

  // Always start with null to avoid hydration mismatch
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  // Set initial open state after mount (client-side only)
  useEffect(() => {
    if (pathname.startsWith("/seller/products")) {
      setOpenSubmenu("Produk");
    } else if (
      pathname.startsWith("/seller/settings") ||
      pathname.startsWith("/seller/store")
    ) {
      setOpenSubmenu("Pengaturan");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount - intentionally no deps to avoid hydration issues

  const isActiveLink = (href: string) => {
    return (
      pathname === href ||
      (href !== "/seller/dashboard" && pathname.startsWith(href))
    );
  };

  const toggleSubmenu = (title: string) => {
    setOpenSubmenu(openSubmenu === title ? null : title);
  };

  return (
    <div className="fixed top-0 left-0 h-screen w-64 bg-yellow-400 text-black shadow-lg z-40">
      {/* Header */}
      <div className="p-6 border-b border-yellow-500">
        <Link href="/seller/dashboard">
          <h1 className="text-xl font-bold">toco seller</h1>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <div key={item.title}>
            {item.children ? (
              <Collapsible
                open={openSubmenu === item.title}
                onOpenChange={() => toggleSubmenu(item.title)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-left hover:bg-yellow-300 hover:text-black",
                      isActiveLink(item.href) && "bg-yellow-300 text-black"
                    )}
                  >
                    {item.icon}
                    <span className="ml-3 flex-1">{item.title}</span>
                    {openSubmenu === item.title ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 ml-8">
                  {item.children.map((child) => (
                    <Button
                      key={child.title}
                      variant="ghost"
                      size="sm"
                      asChild
                      className={cn(
                        "w-full justify-start text-left hover:bg-yellow-300 hover:text-black",
                        isActiveLink(child.href) && "bg-yellow-300 text-black"
                      )}
                    >
                      <Link href={child.href}>
                        {child.icon}
                        <span className="ml-2">{child.title}</span>
                      </Link>
                    </Button>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <Button
                variant="ghost"
                asChild
                className={cn(
                  "w-full justify-start text-left hover:bg-yellow-300 hover:text-black",
                  isActiveLink(item.href) && "bg-yellow-300 text-black"
                )}
              >
                <Link href={item.href}>
                  {item.icon}
                  <span className="ml-3">{item.title}</span>
                </Link>
              </Button>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}
