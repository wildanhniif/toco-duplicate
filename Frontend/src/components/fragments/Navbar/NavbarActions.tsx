"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SearchBarProducts from "@/components/composites/Navbar/SearchBarProducts";
import DropdownLocations from "@/components/composites/Navbar/DropdownLocations";
import AuthButton from "@/components/composites/Navbar/AuthButton";
import NavbarMenuItemsMobile from "./NavbarMenuItemsMobile";
import { Button } from "@/components/ui/button";
import { UserRound } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const DEFAULT_LOCATIONS = [
  "DKI Jakarta",
  "Bandung",
  "Bogor",
  "Bekasi",
  "Tangerang",
  "Denpasar",
  "DI Yogyakarta",
];

export default function NavbarActions() {
  const [locations, setLocations] = useState<string[]>(DEFAULT_LOCATIONS);

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/wilayah/provinces`);
        if (!response.ok) {
          console.error("Gagal mengambil provinsi:", response.statusText);
          return;
        }

        const data = await response.json();

        let list: string[] = [];

        if (Array.isArray(data?.value)) {
          list = data.value
            .map(
              (item: { name?: string; province?: string }) =>
                item.name || item.province || ""
            )
            .filter(Boolean);
        } else if (Array.isArray(data?.data)) {
          list = data.data
            .map(
              (item: { name?: string; province?: string }) =>
                item.name || item.province || ""
            )
            .filter(Boolean);
        }

        if (list.length > 0) {
          const uniqueSorted = Array.from(new Set(list)).sort((a, b) =>
            a.localeCompare(b)
          );
          setLocations(uniqueSorted);
        }
      } catch (error) {
        console.error("Error saat fetch provinsi:", error);
      }
    };

    fetchProvinces();
  }, []);

  return (
    <div className="flex justify-between items-center gap-5 w-full">
      <div className="flex items-center gap-2 lg:gap-8 w-full">
        <div className="flex items-center">
          <NavbarMenuItemsMobile locations={locations} />
          <Link
            href="/"
            className="hidden lg:inline-block font-semibold text-2xl"
          >
            Tokoo
          </Link>
        </div>

        <div className="flex items-center gap-5 w-full">
          <DropdownLocations locations={locations} />
          <SearchBarProducts />
        </div>

        <Button
          asChild
          variant="outline"
          type="button"
          name="login-mobile-trigger"
          id="login-mobile-trigger"
          className="lg:hidden"
        >
          <Link href="/login">
            <UserRound />
          </Link>
        </Button>
      </div>

      <AuthButton />
    </div>
  );
}
