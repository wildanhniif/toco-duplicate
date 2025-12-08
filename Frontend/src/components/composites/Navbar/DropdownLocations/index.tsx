"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LocationList from "./LocationList";
import LocationSearchBar from "./LocationSearchBar";
import CurrentLocation from "./CurrentLocation";
import { MapPin } from "lucide-react";

export default function DropdownLocations({
  locations,
}: {
  locations: string[];
}) {
  const [location, setLocation] = useState<string>(locations[0] ?? "");
  const [open, setOpen] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<string[]>([]);

  const formatTriggerLabel = (value: string) => {
    if (!value) return "Pilih Lokasi";
    const parts = value.split(",");
    const short = parts.slice(0, 2).join(",").trim();
    return short || value;
  };

  const handleSetLocation = (loc: string) => {
    setLocation(loc);
    setOpen(false);
    setSearchResults([]);
  };

  const visibleLocations = searchResults.length > 0 ? searchResults : locations;

  return (
    <div className="hidden lg:block">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            type="button"
            name="dropdown-location-trigger"
            id="dropdown-location-trigger"
            className="justify-start h-11 w-52 max-w-xs overflow-hidden"
          >
            <MapPin className="mr-1 shrink-0" />
            <span className="truncate text-xs sm:text-sm">
              {formatTriggerLabel(location)}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="flex flex-col gap-3 w-60 p-3"
        >
          <DropdownMenuLabel className="sr-only">
            Dropdown Locations
          </DropdownMenuLabel>
          <LocationSearchBar
            baseLocations={locations}
            onResults={setSearchResults}
          />
          <LocationList
            locations={visibleLocations}
            handleSetLocation={handleSetLocation}
          />
          <DropdownMenuSeparator />
          <CurrentLocation />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
