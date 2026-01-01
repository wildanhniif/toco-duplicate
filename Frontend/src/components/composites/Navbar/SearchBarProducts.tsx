"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

export default function SearchBarProducts() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form 
      onSubmit={handleSearch}
      className="relative flex items-center w-full lg:max-w-md"
    >
      <Label className="block w-full">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari di Tokoo"
          className="h-11 w-full"
        />
      </Label>
      <Button
        type="submit"
        className="absolute right-1"
      >
        <Search />
      </Button>
    </form>
  );
}
