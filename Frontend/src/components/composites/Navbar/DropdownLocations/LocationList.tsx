"use client";

import { Button } from "@/components/ui/button";

type LocationListProps = {
  locations: string[];
  handleSetLocation: (loc: string) => void;
};

export default function LocationList(props: LocationListProps) {
  const { locations, handleSetLocation } = props;
  return (
    <div className="max-h-64 overflow-y-auto">
      <ul className="flex flex-col">
        {locations.map((location, i) => (
          <li key={`${location}-${i}`}>
            <Button
              variant="ghost"
              type="button"
              name={`location-item-${i}`}
              id={`location-item-${i}`}
              className="justify-start items-start w-full font-normal h-auto py-2 text-left whitespace-normal wrap-break-word text-sm leading-snug"
              onClick={() => handleSetLocation(location)}
            >
              {location}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
