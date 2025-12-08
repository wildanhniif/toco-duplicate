"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import CardProduct from "@/components/composites/CardProduct";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal, LayoutGrid, List } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ApiProduct {
  product_id: number;
  name: string;
  slug?: string;
  city?: string;
  stock_quantity?: number;
  price?: number;
  primary_image?: string;
  discount_percentage?: number;
  condition?: "new" | "used";
}

export default function ProductsView() {
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);

  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [conditionFilter, setConditionFilter] = useState<
    "all" | "new" | "used"
  >("all");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<
    "relevance" | "price_asc" | "price_desc" | "stock_desc"
  >("relevance");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const categoryId = searchParams.get("category_id");
  const query = searchParams.get("q") || "";
  const city = searchParams.get("city") || "";

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("status", "active");
        params.set("limit", "40");
        if (categoryId) params.set("category_id", categoryId);
        if (query) params.set("q", query);
        if (city) params.set("city", city);

        const res = await fetch(
          `${API_BASE_URL}/api/products?${params.toString()}`
        );
        if (!res.ok) {
          setError("Gagal memuat produk");
          setProducts([]);
          return;
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
          setProducts([]);
          return;
        }
        setProducts(data as ApiProduct[]);
      } catch (e) {
        console.error("Error fetching products list:", e);
        setError("Terjadi kesalahan saat memuat produk");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId, query, city]);

  const uniqueCities = useMemo(() => {
    const seen = new Set<string>();
    products.forEach((p) => {
      if (p.city) {
        seen.add(p.city);
      }
    });
    return Array.from(seen);
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    const min = priceMin ? Number(priceMin) : null;
    const max = priceMax ? Number(priceMax) : null;

    if (min !== null && !Number.isNaN(min)) {
      result = result.filter((p) => (p.price ?? 0) >= min);
    }

    if (max !== null && !Number.isNaN(max)) {
      result = result.filter((p) => (p.price ?? 0) <= max);
    }

    if (conditionFilter !== "all") {
      result = result.filter((p) => {
        if (!p.condition) return false;
        return p.condition === conditionFilter;
      });
    }

    if (selectedCities.length > 0) {
      result = result.filter((p) =>
        p.city ? selectedCities.includes(p.city) : false
      );
    }

    if (sortBy === "price_asc") {
      result = [...result].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    } else if (sortBy === "price_desc") {
      result = [...result].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    } else if (sortBy === "stock_desc") {
      result = [...result].sort(
        (a, b) => (b.stock_quantity ?? 0) - (a.stock_quantity ?? 0)
      );
    }

    return result;
  }, [products, priceMin, priceMax, conditionFilter, selectedCities, sortBy]);

  const title = query
    ? `Hasil untuk "${query}"`
    : categoryId
    ? "Produk berdasarkan kategori"
    : "Semua Produk";

  const totalDisplayed = filteredProducts.length;
  const totalFound = products.length;

  const gridColumnsClass =
    viewMode === "grid"
      ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5"
      : "grid-cols-1";

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="w-full max-w-[1440px] mx-auto px-[5%] pt-28 pb-12">
        <div className="mb-4">
          <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">
            {title}
          </h1>
          {query && (
            <p className="mt-1 text-xs text-gray-600">
              Menampilkan {totalDisplayed} dari {totalFound} produk yang cocok.
            </p>
          )}
        </div>

        {loading && <p className="text-gray-600 text-sm">Memuat produk...</p>}

        {!loading && error && (
          <p className="text-red-600 text-sm mb-2">{error}</p>
        )}

        {!loading && !error && totalFound === 0 && (
          <p className="text-gray-600 text-sm">
            Belum ada produk yang cocok dengan filter ini.
          </p>
        )}

        {!loading && !error && totalFound > 0 && (
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-6 lg:gap-10">
            {/* Sidebar Filter */}
            <aside className="hidden lg:block">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-6">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-yellow-500" />
                  <h2 className="text-sm font-semibold text-gray-900">
                    Filter
                  </h2>
                </div>

                {/* Filter Harga */}
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">
                    Harga
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      placeholder="Terendah"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      className="h-9 text-xs"
                    />
                    <span className="text-xs text-gray-400">-</span>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Tertinggi"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                {/* Filter Kondisi */}
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">
                    Kondisi
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { label: "Semua", value: "all" },
                        { label: "Baru", value: "new" },
                        { label: "Bekas", value: "used" },
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setConditionFilter(item.value)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          conditionFilter === item.value
                            ? "border-yellow-400 bg-yellow-50 text-yellow-600"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter Lokasi */}
                {uniqueCities.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      Lokasi
                    </p>
                    <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                      {uniqueCities.map((cityName) => (
                        <label
                          key={cityName}
                          className="flex items-center gap-2 text-xs text-gray-700"
                        >
                          <Checkbox
                            checked={selectedCities.includes(cityName)}
                            onCheckedChange={(checked: boolean) => {
                              setSelectedCities((prev) =>
                                checked
                                  ? [...prev, cityName]
                                  : prev.filter((c) => c !== cityName)
                              );
                            }}
                          />
                          <span className="line-clamp-1">{cityName}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>

            {/* Main Content */}
            <section className="flex flex-col gap-4">
              {/* Top Bar */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-gray-600">
                  <p>
                    {totalDisplayed} produk
                    {totalFound > totalDisplayed &&
                      ` dari ${totalFound} hasil awal`}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Select
                    value={sortBy}
                    onValueChange={(value) =>
                      setSortBy(
                        value as
                          | "relevance"
                          | "price_asc"
                          | "price_desc"
                          | "stock_desc"
                      )
                    }
                  >
                    <SelectTrigger className="h-9 w-40 text-xs">
                      <SelectValue placeholder="Urutkan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Paling relevan</SelectItem>
                      <SelectItem value="price_asc">Harga Terendah</SelectItem>
                      <SelectItem value="price_desc">
                        Harga Tertinggi
                      </SelectItem>
                      <SelectItem value="stock_desc">Stok Terbanyak</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="hidden sm:inline-flex items-center rounded-full border border-gray-200 bg-white p-1">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-xs ${
                        viewMode === "grid"
                          ? "bg-yellow-400 text-black"
                          : "text-gray-500"
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-xs ${
                        viewMode === "list"
                          ? "bg-yellow-400 text-black"
                          : "text-gray-500"
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Results */}
              {totalDisplayed === 0 ? (
                <p className="text-gray-600 text-sm">
                  Tidak ada produk yang cocok dengan filter saat ini.
                </p>
              ) : (
                <div className={`grid gap-4 ${gridColumnsClass}`}>
                  {filteredProducts.map((product) => (
                    <CardProduct
                      key={product.product_id}
                      id={product.product_id}
                      slug={product.slug}
                      title={product.name}
                      city={product.city ?? "Kota Jakarta"}
                      stock={product.stock_quantity ?? 0}
                      price={product.price ?? 0}
                      img={product.primary_image || "/iphone-product.webp"}
                      discountPercentage={product.discount_percentage}
                      variant={viewMode}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
