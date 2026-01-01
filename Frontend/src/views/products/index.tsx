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
import { SlidersHorizontal, LayoutGrid, List, ChevronRight, PackageX } from "lucide-react";
import CategoryTree from "./sections/CategoryTree";
import StoreList from "./sections/StoreList";
import Image from "next/image";

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

  // Breadcrumbs
  let crumbs = [{ label: "Beranda", href: "/" }];
  if (categoryId) crumbs.push({ label: "Kategori", href: "#" }); // Idealnya fetch nama category
  if (query) crumbs.push({ label: `"${query}"`, href: "#" });
  if (!categoryId && !query) crumbs.push({ label: "Semua Produk", href: "/products" });

  return (
    <main className="min-h-screen bg-white">
      <div className="w-full max-w-[1440px] mx-auto px-[5%] pt-40 pb-12">
        
        {/* Breadcrumb Section */}
        <div className="mb-6 text-xs text-gray-500 flex items-center gap-2">
            {crumbs.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                     <a href={c.href} className="hover:text-yellow-600 transition-colors">{c.label}</a>
                     {i < crumbs.length - 1 && <span>/</span>}
                </div>
            ))}
        </div>

        {/* Store Suggestions (Only if query present) */}
        {query && (
            <div className="mb-8">
                <StoreList query={query} />
            </div>
        )}

        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
           <div>
             <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                {query ? query : "Semua Produk"}
             </h1>
             <p className="text-sm text-gray-500 mt-1">
               {totalDisplayed} dari {totalFound} produk
             </p>
           </div>
           
           {/* Sort & View Mode - Desktop */}
           <div className="flex items-center gap-3">
                 <span className="text-sm text-gray-600 hidden sm:inline">Urutkan Berdasarkan</span>
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
                    <SelectTrigger className="h-9 w-[180px] text-sm border-none shadow-none font-semibold text-blue-900 bg-transparent flex flex-row-reverse justify-end gap-2 px-0 hover:bg-transparent focus:ring-0">
                      <SelectValue placeholder="Paling Sesuai" />
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value="relevance">Paling Sesuai</SelectItem>
                      <SelectItem value="price_asc">Harga Terendah</SelectItem>
                      <SelectItem value="price_desc">Harga Tertinggi</SelectItem>
                      <SelectItem value="stock_desc">Stok Terbanyak</SelectItem>
                    </SelectContent>
                  </Select>

                   <div className="hidden sm:inline-flex items-center rounded-md border border-gray-200 bg-white ml-2">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={`p-2 transition-colors ${
                        viewMode === "grid" ? "text-yellow-500" : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      <LayoutGrid className="w-5 h-5" />
                    </button>
                    <div className="w-[1px] h-4 bg-gray-200"></div>
                     <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={`p-2 transition-colors ${
                        viewMode === "list" ? "text-yellow-500" : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
           </div>
        </div>


        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-8">
            {/* Sidebar Filter */}
            <aside className="hidden lg:block space-y-8">
                {/* Category Tree */}
                <CategoryTree currentCategoryId={categoryId ? Number(categoryId) : undefined} />

                <div className="w-full h-[1px] bg-gray-100" />
                
                 {/* Filter Harga */}
                 <div>
                  <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-gray-900 border-l-4 border-yellow-500 pl-2">
                        Filter Harga
                      </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-gray-500 font-bold">Rp</span>
                         <Input
                          type="number"
                          placeholder="Harga Terendah"
                          value={priceMin}
                          onChange={(e) => setPriceMin(e.target.value)}
                          className="h-9 pl-9 text-sm bg-gray-50 border-gray-200"
                        />
                    </div>
                     <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-gray-500 font-bold">Rp</span>
                        <Input
                          type="number"
                          placeholder="Harga Tertinggi"
                          value={priceMax}
                          onChange={(e) => setPriceMax(e.target.value)}
                         className="h-9 pl-9 text-sm bg-gray-50 border-gray-200"
                        />
                    </div>
                  </div>
                </div>

                 <div className="w-full h-[1px] bg-gray-100" />

                 {/* Kondisi */}
                <div>
                   <h3 className="text-sm font-bold text-gray-900 border-l-4 border-yellow-500 pl-2 mb-3">
                        Kondisi Barang
                   </h3>
                   <div className="flex items-center gap-2">
                        {(["new", "used"] as const).map(cond => (
                             <button
                                key={cond}
                                onClick={() => setConditionFilter(cond === conditionFilter ? "all" : cond)}
                                className={`flex-1 py-1.5 px-3 rounded-full border text-sm transition-all ${
                                    conditionFilter === cond 
                                    ? "border-yellow-500 bg-yellow-50 text-yellow-700 font-medium" 
                                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                                }`}
                             >
                                {cond === "new" ? "Baru" : "Bekas"}
                             </button>
                        ))}
                   </div>
                </div>

                 <div className="w-full h-[1px] bg-gray-100" />

                {/* Filter Lokasi */}
                {uniqueCities.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 border-l-4 border-yellow-500 pl-2 mb-3">
                       Filter Lokasi
                    </h3>
                    <div className="space-y-2">
                      {uniqueCities.slice(0, 5).map((cityName) => (
                        <label
                          key={cityName}
                          className="flex items-center gap-3 cursor-pointer group"
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
                            className="w-4 h-4 rounded border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                          <span className="text-sm text-gray-600 group-hover:text-gray-900">{cityName}</span>
                        </label>
                      ))}
                      {uniqueCities.length > 5 && (
                          <button className="text-sm font-semibold text-blue-800 flex items-center gap-1 hover:underline mt-2">
                             Lihat Lokasi Lainnya <ChevronRight className="w-3 h-3" />
                          </button>
                      )}
                    </div>
                  </div>
                )}
                
                 <div className="w-full h-[1px] bg-gray-100" />

                 {/* Tipe Transaksi (Example) */}
                 <div>
                    <h3 className="text-sm font-bold text-gray-900 border-l-4 border-yellow-500 pl-2 mb-3">
                       Tipe Transaksi
                    </h3>
                    <div className="space-y-2">
                         <label className="flex items-center gap-2 cursor-pointer">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${true ? "border-yellow-400" : "border-gray-300"}`}>
                                {true && <div className="w-2 h-2 rounded-full bg-yellow-400" />}
                            </div>
                            <span className="text-sm text-gray-700">Semua</span>
                         </label>
                         <label className="flex items-center gap-2 cursor-pointer opacity-60">
                             <div className="w-4 h-4 rounded-full border border-gray-300" />
                            <span className="text-sm text-gray-700">Melalui Toco</span>
                         </label>
                           <label className="flex items-center gap-2 cursor-pointer opacity-60">
                             <div className="w-4 h-4 rounded-full border border-gray-300" />
                            <span className="text-sm text-gray-700">COD (Bayar di Tempat)</span>
                         </label>
                    </div>

                 </div>

            </aside>

            {/* Main Content Products */}
            <section className="flex flex-col gap-4">
              {loading && <p className="text-gray-600 text-sm">Memuat produk...</p>}
              {!loading && error && <p className="text-red-600 text-sm mb-2">{error}</p>}
              {!loading && !error && totalFound === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                     <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <PackageX className="w-10 h-10 text-gray-300" />
                     </div>
                     <h3 className="text-lg font-semibold text-gray-900">Tidak ada produk ditemukan</h3>
                     <p className="text-gray-500 text-sm max-w-xs mx-auto">Coba kurangi filter atau gunakan kata kunci lain.</p>
                  </div>
              )}
              
               {!loading && !error && totalFound > 0 && (
                 <>
                   {/* Product Grid */}
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
                 </>
               )}
            </section>
        </div>

      </div>
    </main>
  );
}
