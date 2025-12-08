"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, X } from "lucide-react";

interface LocationResult {
  address: string;
  latitude: number;
  longitude: number;
  province?: string;
  city?: string;
  district?: string;
  subdistrict?: string;
  postal_code?: string;
}

interface GoogleMapsPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (location: LocationResult) => void;
  initialLocation?: { lat: number; lng: number };
}

// Default to Jakarta if no initial location
const DEFAULT_CENTER = { lat: -6.2088, lng: 106.8456 };

// Declare google as any to avoid TS errors with dynamic loading
declare const google: any;

export default function GoogleMapsPicker({
  isOpen,
  onClose,
  onSelectLocation,
  initialLocation,
}: GoogleMapsPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedLocation, setSelectedLocation] =
    useState<LocationResult | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Process place result helper
  const processPlaceResult = useCallback(
    (place: any, lat?: number, lng?: number) => {
      const address = place.formatted_address || "";
      setSelectedAddress(address);
      setSearchQuery(address);

      let province = "";
      let city = "";
      let district = "";
      let subdistrict = "";
      let postal_code = "";

      place.address_components?.forEach((component: any) => {
        const types = component.types;
        if (types.includes("administrative_area_level_1")) {
          province = component.long_name;
        }
        if (types.includes("administrative_area_level_2")) {
          city = component.long_name;
        }
        if (types.includes("administrative_area_level_3")) {
          district = component.long_name;
        }
        if (
          types.includes("administrative_area_level_4") ||
          types.includes("sublocality")
        ) {
          subdistrict = component.long_name;
        }
        if (types.includes("postal_code")) {
          postal_code = component.long_name;
        }
      });

      const location: LocationResult = {
        address,
        latitude: lat || place.geometry?.location?.lat?.() || 0,
        longitude: lng || place.geometry?.location?.lng?.() || 0,
        province,
        city,
        district,
        subdistrict,
        postal_code,
      };

      setSelectedLocation(location);
    },
    []
  );

  // Geocode lat/lng helper
  const geocodeLatLng = useCallback(
    (lat: number, lng: number) => {
      if (typeof google === "undefined") return;
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat, lng } },
        (results: any, status: string) => {
          if (status === "OK" && results?.[0]) {
            processPlaceResult(results[0], lat, lng);
          }
        }
      );
    },
    [processPlaceResult]
  );

  // Load Google Maps script
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!(window as any).google) {
      const script = document.createElement("script");
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsLoaded(true);
      document.head.appendChild(script);
    } else {
      setIsLoaded(true);
    }
  }, []);

  // Initialize map when modal opens and script is loaded
  useEffect(() => {
    if (
      !isOpen ||
      !isLoaded ||
      !mapRef.current ||
      typeof google === "undefined"
    )
      return;

    const center = initialLocation
      ? { lat: initialLocation.lat, lng: initialLocation.lng }
      : DEFAULT_CENTER;

    // Create map
    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom: 15,
      mapTypeControl: true,
      mapTypeControlOptions: {
        position: google.maps.ControlPosition.TOP_LEFT,
      },
      streetViewControl: false,
      fullscreenControl: true,
    });
    mapInstanceRef.current = map;

    // Create marker
    const marker = new google.maps.Marker({
      map,
      position: center,
      draggable: true,
    });
    markerRef.current = marker;

    // Handle marker drag
    marker.addListener("dragend", () => {
      const position = marker.getPosition();
      if (position) {
        geocodeLatLng(position.lat(), position.lng());
      }
    });

    // Handle map click
    map.addListener("click", (e: any) => {
      if (e.latLng) {
        marker.setPosition(e.latLng);
        geocodeLatLng(e.latLng.lat(), e.latLng.lng());
      }
    });

    // Setup autocomplete
    if (inputRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(
        inputRef.current,
        {
          componentRestrictions: { country: "id" },
          fields: ["address_components", "geometry", "formatted_address"],
        }
      );

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          map.setCenter({ lat, lng });
          marker.setPosition({ lat, lng });
          processPlaceResult(place);
        }
      });
    }

    // Get initial address
    geocodeLatLng(center.lat, center.lng);

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [isOpen, isLoaded, initialLocation, geocodeLatLng, processPlaceResult]);

  const handleSelectLocation = () => {
    if (selectedLocation) {
      onSelectLocation(selectedLocation);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Pilih Lokasi</DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
              placeholder="Cari alamat..."
              className="pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Map Container */}
          <div className="relative">
            {!isLoaded ? (
              <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-pulse" />
                  <p className="text-gray-500">Memuat peta...</p>
                </div>
              </div>
            ) : (
              <div
                ref={mapRef}
                className="h-80 rounded-lg"
                style={{ minHeight: "320px" }}
              />
            )}

            {/* Map Type Toggle */}
            <div className="absolute top-2 left-2 bg-white rounded shadow-md">
              <button className="px-3 py-1.5 text-sm font-medium border-r">
                Peta
              </button>
              <button className="px-3 py-1.5 text-sm text-gray-500">
                Satelit
              </button>
            </div>
          </div>

          {/* Selected Address */}
          {selectedAddress && (
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <MapPin className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm">{selectedAddress}</p>
                {selectedLocation?.city && (
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedLocation.district}, {selectedLocation.city}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSelectLocation}
              disabled={!selectedLocation}
              className="bg-yellow-500 hover:bg-yellow-600 text-black min-w-32"
            >
              Pilih Lokasi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Add type declaration for initMap callback
declare global {
  interface Window {
    initMap: () => void;
  }
}
