"use client";

import { FormEvent, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, "");

type DomesticDestinationItem = {
  id?: string | number;
  label?: string;
  province_name?: string;
  sub_district?: string;
  district?: string;
  city?: string;
  province?: string;
  postal_code?: string | number;
};

type LocationSearchBarProps = {
  className?: string;
  onResults?: (results: string[]) => void;
  baseLocations?: string[];
};

export default function LocationSearchBar(props: LocationSearchBarProps) {
  const { className, onResults, baseLocations } = props;
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(
    async (keyword: string) => {
      if (!onResults) return;

      const trimmed = keyword.trim();
      if (!trimmed) {
        onResults([]);
        return;
      }

      try {
        setLoading(true);

        const lower = normalize(trimmed);
        const localMatches = Array.isArray(baseLocations)
          ? baseLocations.filter((loc) => normalize(loc).includes(lower))
          : [];

        const url = `${API_BASE_URL}/api/shipping/public/destination/domestic-destination?search=${encodeURIComponent(
          trimmed
        )}&limit=30&offset=0`;
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
          console.error(
            "Gagal mencari lokasi:",
            data?.message || response.statusText
          );
          if (localMatches.length) {
            onResults(localMatches);
          }
          return;
        }

        const list: DomesticDestinationItem[] = Array.isArray(data?.data)
          ? (data.data as DomesticDestinationItem[])
          : [];

        const formatted: string[] = list
          .map((item) => {
            if (!item) return "";

            if (item.label) {
              return item.label;
            }

            const parts: string[] = [];
            if (item.postal_code) parts.push(String(item.postal_code));
            if (item.sub_district) parts.push(`${item.sub_district} Kel.`);
            if (item.district) parts.push(item.district);
            if (item.city) parts.push(item.city);
            if (item.province) parts.push(item.province);

            if (parts.length > 0) {
              return parts.join(", ");
            }

            return "";
          })
          .filter(Boolean);

        const combined = [...formatted, ...localMatches];
        const uniqueCombined = Array.from(new Set(combined)).filter(Boolean);

        onResults(uniqueCombined);
      } catch (error) {
        console.error("Error saat search lokasi:", error);
        const lower = normalize(keyword);
        const localMatches = Array.isArray(baseLocations)
          ? baseLocations.filter((loc) => normalize(loc).includes(lower))
          : [];
        onResults(localMatches);
      } finally {
        setLoading(false);
      }
    },
    [onResults, baseLocations]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!onResults) return;

    await runSearch(query);
  };

  useEffect(() => {
    if (!query) {
      if (onResults) onResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      runSearch(query);
    }, 400);

    return () => clearTimeout(timeout);
  }, [query, onResults, runSearch]);

  return (
    <form
      className={`relative flex items-center ${className}`}
      onSubmit={handleSubmit}
    >
      <Label className="block w-full">
        <Input
          type="text"
          name="search-locations"
          id="search-locations"
          placeholder="Cari Lokasi"
          className="ps-11 h-11"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </Label>
      <Button
        variant="ghost"
        size="icon"
        type="submit"
        name="search-locations-trigger"
        id="search-locations-trigger"
        className="absolute left-1"
        disabled={loading}
      >
        <Search />
      </Button>
    </form>
  );
}
