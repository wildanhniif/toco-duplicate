"use client";

import { LocateFixed } from "lucide-react";

export default function CurrentLocation() {
  return (
    <p className="flex items-center gap-2 text-blue-600 text-sm font-bold">
      <LocateFixed className="w-5 h-5" /> Gunakan Lokasi Saat Ini
    </p>
  );
}
