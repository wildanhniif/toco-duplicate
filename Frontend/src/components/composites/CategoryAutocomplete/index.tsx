"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Category {
  category_id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  breadcrumb?: string;
}

interface CategoryAutocompleteProps {
  categories: Category[];
  value: string;
  onSelect: (categoryId: string, category: Category) => void;
  placeholder?: string;
  required?: boolean;
}

export default function CategoryAutocomplete({
  categories,
  value,
  onSelect,
  placeholder = "Cari kategori...",
  required = false,
}: CategoryAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [categoriesWithBreadcrumb, setCategoriesWithBreadcrumb] = useState<
    Category[]
  >([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Build breadcrumb for each category
  useEffect(() => {
    const buildBreadcrumb = (categoryId: number): string => {
      const category = categories.find((c) => c.category_id === categoryId);
      if (!category) return "";

      const path: string[] = [category.name];
      let currentId = category.parent_id;

      // Traverse up to build full path (max 5 levels to prevent infinite loop)
      let depth = 0;
      while (currentId && depth < 5) {
        const parent = categories.find((c) => c.category_id === currentId);
        if (!parent) break;
        path.unshift(parent.name);
        currentId = parent.parent_id;
        depth++;
      }

      return path.join(" / ");
    };

    const enriched = categories.map((cat) => ({
      ...cat,
      breadcrumb: buildBreadcrumb(cat.category_id),
    }));

    setCategoriesWithBreadcrumb(enriched);
  }, [categories]);

  // Set selected category when value changes from parent
  useEffect(() => {
    if (value) {
      const cat = categoriesWithBreadcrumb.find(
        (c) => c.category_id === parseInt(value)
      );
      if (cat) {
        setSelectedCategory(cat);
        setSearchTerm("");
      }
    } else {
      setSelectedCategory(null);
      setSearchTerm("");
    }
  }, [value, categoriesWithBreadcrumb]);

  // Filter categories based on search
  const filteredCategories = searchTerm
    ? categoriesWithBreadcrumb.filter((cat) => {
        const search = searchTerm.toLowerCase();
        return (
          cat.name.toLowerCase().includes(search) ||
          cat.breadcrumb?.toLowerCase().includes(search)
        );
      })
    : [];

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (category: Category) => {
    setSelectedCategory(category);
    setSearchTerm("");
    setShowDropdown(false);
    onSelect(String(category.category_id), category);
  };

  const handleClear = () => {
    setSelectedCategory(null);
    setSearchTerm("");
    onSelect("", {} as Category);
  };

  const highlightMatch = (text: string, search: string) => {
    if (!search) return text;

    const parts = text.split(new RegExp(`(${search})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <strong key={index} className="font-semibold text-yellow-600">
          {part}
        </strong>
      ) : (
        part
      )
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Label className="block mb-2">
        Kategori Produk {required && <span className="text-red-500">*</span>}
      </Label>

      {/* Selected category display */}
      {selectedCategory && !showDropdown ? (
        <div className="relative">
          <div className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 bg-white text-sm">
            <div className="text-gray-600 text-xs">
              {selectedCategory.breadcrumb}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      ) : (
        <>
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder={placeholder}
              className="pl-10"
              required={required && !selectedCategory}
            />
          </div>

          {/* Dropdown suggestions */}
          {showDropdown && searchTerm && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
              {filteredCategories.length > 0 ? (
                <div className="py-1">
                  {filteredCategories.slice(0, 50).map((category) => (
                    <button
                      key={category.category_id}
                      type="button"
                      onClick={() => handleSelect(category)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-sm text-gray-700">
                        {highlightMatch(
                          category.breadcrumb || category.name,
                          searchTerm
                        )}
                      </div>
                    </button>
                  ))}
                  {filteredCategories.length > 50 && (
                    <div className="px-4 py-2 text-xs text-gray-500 border-t">
                      Menampilkan 50 dari {filteredCategories.length} hasil.
                      Ketik lebih spesifik untuk mempersempit pencarian.
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  Kategori tidak ditemukan
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Helper text */}
      {!selectedCategory && (
        <p className="text-xs text-gray-500 mt-1">
          Ketik nama kategori produk Anda, contoh: "sabun", "elektronik", "baju"
        </p>
      )}
    </div>
  );
}
