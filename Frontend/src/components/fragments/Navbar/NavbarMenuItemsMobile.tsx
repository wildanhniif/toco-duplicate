"use client";

import { useState } from "react";
import Link from "next/link";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import MobileDrawerLocations from "@/components/composites/Navbar/MobileDrawerLocations";
import { ChevronRight, Diamond, FileText, Menu, Store, X } from "lucide-react";

const menuItems = [
  {
    title: "Mulai Jualan",
    href: "/",
    icon: Store,
  },
  {
    title: "Tokoo Classified",
    href: "/",
    icon: Diamond,
  },
  {
    title: "Artikel",
    href: "/",
    icon: FileText,
  },
];

export default function NavbarMenuItemsMobile({
  locations,
}: {
  locations: string[];
}) {
  const [location, setLocation] = useState<string>(locations[0] ?? "");
  const [open, setOpen] = useState<boolean>(false);

  const handleSetLocation = (loc: string) => {
    setLocation(loc);
    setOpen(false);
  };

  return (
    <div className="lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            type="button"
            name="open-mobile-navbar"
            id="open-mobile-navbar"
            className=""
          >
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-4">
          <div className="flex items-center gap-6">
            <SheetClose asChild>
              <Button
                variant="outline"
                type="button"
                name="close-mobile-navbar"
                id="close-mobile-navbar"
                className=""
              >
                <X />
              </Button>
            </SheetClose>
            <SheetTitle asChild>
              <Link href="/" className="font-semibold text-2xl">
                Tokoo
              </Link>
            </SheetTitle>
          </div>
          <Separator />
          <MobileDrawerLocations
            open={open}
            setOpen={setOpen}
            location={location}
            locations={locations}
            handleSetLocation={handleSetLocation}
          />
          <Separator />
          <ul className="flex flex-col gap-4">
            {menuItems.map((item, i) => (
              <li
                key={item.title}
                className="flex justify-between items-center w-full"
              >
                <Link href="/" className="text-sm flex items-center gap-3">
                  <item.icon className="w-5 h-5" /> {item.title}
                </Link>
                <ChevronRight className="w-5 h-5" />
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </div>
  );
}
