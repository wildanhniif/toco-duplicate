"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

export default function SearchBarProducts() {
  return (
    <form className="relative flex items-center w-full lg:max-w-md">
      <Label className="block w-full">
        <Input
          type="text"
          name="search-products"
          id="search-products"
          placeholder="Cari di Tokoo"
          className="h-11 w-full"
        />
      </Label>
      <Button
        type="submit"
        name="search-producrs-trigger"
        id="search-products-trigger"
        className="absolute right-1"
      >
        <Search />
      </Button>
    </form>
  );
}
