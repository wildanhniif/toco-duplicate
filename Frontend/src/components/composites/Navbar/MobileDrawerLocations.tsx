"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import LocationSearchBar from "./DropdownLocations/LocationSearchBar";
import CurrentLocation from "./DropdownLocations/CurrentLocation";
import { Separator } from "@/components/ui/separator";
import LocationList from "./DropdownLocations/LocationList";
import { ChevronRight, MapPin, X } from "lucide-react";

type MobileDrawerLocationsProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  location: string;
  locations: string[];
  handleSetLocation: (loc: string) => void;
};

export default function MobileDrawerLocations(
  props: MobileDrawerLocationsProps
) {
  const { open, setOpen, location, locations, handleSetLocation } = props;
  const [searchResults, setSearchResults] = useState<string[]>([]);

  const visibleLocations = searchResults.length > 0 ? searchResults : locations;
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild className="cursor-pointer">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5" />
            <div className="flex flex-col">
              <p className="text-sm">Lokasi Saat Ini</p>
              <p className="text-sm font-bold">{location}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5" />
        </div>
      </DrawerTrigger>
      <DrawerContent>
        <div className="w-full px-4">
          <div className="flex items-center gap-4">
            <DrawerClose asChild>
              <Button
                variant="outline"
                type="button"
                name="close-drawer-locations"
                id="close-drawer-locations"
              >
                <X />
              </Button>
            </DrawerClose>
            <DrawerTitle className="font-bold">
              Cari Barang Berdasarkan Lokasi
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              Drawer Locations
            </DrawerDescription>
          </div>
          <div className="flex flex-col gap-3 my-4">
            <LocationSearchBar
              className="w-full"
              onResults={setSearchResults}
            />
            <CurrentLocation />
          </div>
          <Separator className="mb-4" />
          <LocationList
            locations={visibleLocations}
            handleSetLocation={handleSetLocation}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
