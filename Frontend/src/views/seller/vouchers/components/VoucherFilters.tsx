import React, { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface VoucherFiltersProps {
  value: string[];
  onChange: (filters: string[]) => void;
}

export default function VoucherFilters({
  value,
  onChange,
}: VoucherFiltersProps) {
  const [open, setOpen] = useState(false);

  const filterOptions = [
    { value: "free_shipping", label: "Gratis Ongkir", category: "Tipe" },
    { value: "discount", label: "Diskon", category: "Tipe" },
    { value: "public", label: "Publik", category: "Target" },
    { value: "private", label: "Khusus", category: "Target" },
  ];

  const toggleFilter = (filter: string) => {
    if (value.includes(filter)) {
      onChange(value.filter((f) => f !== filter));
    } else {
      onChange([...value, filter]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  const typeFilters = filterOptions.filter((f) => f.category === "Tipe");
  const targetFilters = filterOptions.filter((f) => f.category === "Target");

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="w-4 h-4 mr-2" />
          Filter
          {value.length > 0 && (
            <Badge className="ml-2 bg-orange-500 hover:bg-orange-600 text-white">
              {value.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Filter Voucher</DropdownMenuLabel>
          {value.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-auto p-0 text-xs text-orange-600 hover:text-orange-700"
            >
              Reset
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        {/* Tipe */}
        <div className="px-2 py-1">
          <p className="text-xs font-semibold text-gray-500 mb-1">
            Tipe Voucher
          </p>
          {typeFilters.map((filter) => (
            <DropdownMenuCheckboxItem
              key={filter.value}
              checked={value.includes(filter.value)}
              onCheckedChange={() => toggleFilter(filter.value)}
            >
              {filter.label}
            </DropdownMenuCheckboxItem>
          ))}
        </div>

        <DropdownMenuSeparator />

        {/* Target */}
        <div className="px-2 py-1">
          <p className="text-xs font-semibold text-gray-500 mb-1">
            Target Voucher
          </p>
          {targetFilters.map((filter) => (
            <DropdownMenuCheckboxItem
              key={filter.value}
              checked={value.includes(filter.value)}
              onCheckedChange={() => toggleFilter(filter.value)}
            >
              {filter.label}
            </DropdownMenuCheckboxItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
