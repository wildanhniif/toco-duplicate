"use client";

import NavbarActions from "../fragments/Navbar/NavbarActions";
import NavbarMenuItems from "../fragments/Navbar/NavbarMenuItems";

const locations = [
  "DKI Jakarta",
  "Bandung",
  "Bogor",
  "Bekasi",
  "Tangerang",
  "Denpasar",
  "DI Yogyakarta",
];

export default function NavbarLayout() {
  return (
    <nav className="flex justify-center items-center fixed top-0 left-0 w-full bg-background shadow-sm shadow-muted-foreground/30 z-50">
      <div className="flex flex-col gap-4 w-full max-w-[1440px] py-6 px-[5%]">
        <NavbarActions />
        <NavbarMenuItems />
      </div>
    </nav>
  );
}
