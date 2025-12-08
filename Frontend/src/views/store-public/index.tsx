"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Star,
  CheckCircle2,
  Circle,
  MessageCircle,
  Store,
  Share2,
  ChevronDown,
  LayoutGrid,
  List,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import CardProduct from "@/components/composites/CardProduct";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface StorePublicViewProps {
  slug: string;
}

interface Store {
  store_id: number;
  name: string;
  slug: string;
  description?: string | null;
  business_phone?: string | null;
  show_phone_number?: boolean;
  address_line?: string | null;
  province?: string | null;
  city?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  rating_average?: number | string | null;
  review_count?: number | null;
  profile_image_url?: string | null;
  background_image_url?: string | null;
  is_active?: boolean;
  is_verified?: boolean;
  active_product_count?: number;
  created_at?: string;
}

interface ApiProduct {
  product_id: number;
  name: string;
  slug?: string;
  city?: string;
  store_city?: string | null;
  condition?: string | null;
  stock_quantity?: number;
  price?: number;
  primary_image?: string;
  discount_percentage?: number;
}

export default function StorePublicView({ slug }: StorePublicViewProps) {
  const router = useRouter();

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [conditionFilter, setConditionFilter] = useState<
    "all" | "new" | "used"
  >("all");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [transactionType, setTransactionType] = useState<
    "all" | "system" | "direct"
  >("all");
  const [sortBy, setSortBy] = useState<
    "popular" | "price_asc" | "price_desc" | "newest"
  >("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    if (!slug) return;

    const fetchStoreAndProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const resStore = await fetch(`${API_BASE_URL}/api/stores/${slug}`);
        if (!resStore.ok) {
          if (resStore.status === 404) {
            setError("Toko tidak ditemukan");
          } else if (resStore.status === 429) {
            setError("Terlalu banyak permintaan, coba lagi beberapa saat.");
          } else {
            setError("Terjadi kesalahan pada server. Coba lagi nanti.");
          }
          setLoading(false);
          return;
        }

        const data = (await resStore.json()) as { store: Store };
        const storeData = data.store;
        setStore(storeData);

        const params = new URLSearchParams();
        params.set("status", "active");
        params.set("limit", "40");
        params.set("store_id", String(storeData.store_id));

        const resProducts = await fetch(
          `${API_BASE_URL}/api/products?${params.toString()}`
        );
        if (resProducts.ok) {
          const list = (await resProducts.json()) as ApiProduct[];
          if (Array.isArray(list)) {
            setProducts(list);
          }
        }
      } catch (e) {
        console.error("Error fetching store page:", e);
        setError("Terjadi kesalahan saat memuat toko");
      } finally {
        setLoading(false);
      }
    };

    fetchStoreAndProducts();
  }, [slug]);

  const parsedRating = store?.rating_average
    ? typeof store.rating_average === "string"
      ? parseFloat(store.rating_average)
      : store.rating_average
    : 0;
  // Ambil inisial toko hanya dari huruf (abaikan angka seperti "0")
  const storeInitial = store?.name
    ? (store.name.trim().match(/[A-Za-z]/)?.[0] || "").toUpperCase()
    : "";
  const joinedAtLabel = store?.created_at
    ? new Date(store.created_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const cleanedDescription = store?.description
    ? store.description
        .split(/\r?\n/) // pisah baris
        .map((line) => line.trim())
        .filter((line) => line && !/^[0\s]+$/.test(line))
        .join(" ")
        .trim()
    : "";
  const bannerImage = store?.background_image_url || "/banner-1.webp";
  const locationOptions = Array.from(
    new Set(
      products
        .map(
          (product) => product.city || product.store_city || store?.city || null
        )
        .filter((loc): loc is string => Boolean(loc))
    )
  );

  let filteredProducts = [...products];

  const minPriceValue = Number(priceMin);
  if (!Number.isNaN(minPriceValue) && priceMin !== "") {
    filteredProducts = filteredProducts.filter(
      (product) => (product.price ?? 0) >= minPriceValue
    );
  }

  const maxPriceValue = Number(priceMax);
  if (!Number.isNaN(maxPriceValue) && priceMax !== "") {
    filteredProducts = filteredProducts.filter(
      (product) => (product.price ?? 0) <= maxPriceValue
    );
  }

  if (conditionFilter !== "all") {
    filteredProducts = filteredProducts.filter((product) => {
      const value = (product.condition || "new").toLowerCase();
      return conditionFilter === "new" ? value === "new" : value === "used";
    });
  }

  if (selectedLocations.length > 0) {
    filteredProducts = filteredProducts.filter((product) => {
      const loc = product.city || product.store_city || store?.city || "";
      return selectedLocations.includes(loc);
    });
  }

  if (
    sortBy === "price_asc" ||
    sortBy === "price_desc" ||
    sortBy === "newest"
  ) {
    filteredProducts = [...filteredProducts].sort((a, b) => {
      if (sortBy === "newest") {
        return (b.product_id ?? 0) - (a.product_id ?? 0);
      }
      const priceA = a.price ?? 0;
      const priceB = b.price ?? 0;
      return sortBy === "price_asc" ? priceA - priceB : priceB - priceA;
    });
  }

  const totalProducts = filteredProducts.length;
  const totalPages =
    totalProducts === 0 ? 1 : Math.ceil(totalProducts / pageSize);
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = totalProducts === 0 ? 0 : (safePage - 1) * pageSize;
  const endIndex =
    totalProducts === 0 ? 0 : Math.min(startIndex + pageSize, totalProducts);
  const pageProducts =
    totalProducts === 0 ? [] : filteredProducts.slice(startIndex, endIndex);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="w-full max-w-[1200px] mx-auto px-4 pt-28 pb-12">
        {loading && (
          <p className="text-gray-600 text-sm">Memuat informasi toko...</p>
        )}

        {!loading && error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        {!loading && store && (
          <>
            <nav className="text-sm text-gray-600 mb-4 flex flex-wrap items-center gap-1">
              <span
                className="cursor-pointer hover:text-blue-600 hover:underline"
                onClick={() => router.push("/")}
              >
                Beranda
              </span>
              <span>/</span>
              <span className="truncate max-w-40 md:max-w-xs font-medium text-gray-900">
                {store.name}
              </span>
            </nav>

            <section className="mb-6">
              <div className="relative w-full overflow-hidden rounded-2xl">
                <div className="relative h-40 md:h-52 lg:h-60 w-full">
                  <Image
                    src={bannerImage}
                    alt={store.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 1200px"
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="-mt-6 md:-mt-8 relative z-10 rounded-xl bg-white border border-gray-200 shadow-sm px-4 py-3 md:px-6 md:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-lg font-semibold text-gray-500">
                      {store.profile_image_url ? (
                        <Image
                          src={store.profile_image_url}
                          alt={store.name}
                          width={80}
                          height={80}
                          className="object-cover"
                        />
                      ) : (
                        <span>{storeInitial}</span>
                      )}
                    </div>
                    {!!store.is_verified && (
                      <span className="absolute -bottom-1 -right-1 flex items-center gap-1 rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h1 className="text-lg md:text-xl font-semibold text-gray-900">
                      {store.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <span className="text-blue-500">
                          <Circle className="w-3 h-3 fill-current" />
                        </span>
                        <span>Online</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span>{store.city || "Lokasi belum diisi"}</span>
                      </span>
                      {typeof store.active_product_count === "number" &&
                        store.active_product_count > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <FileText className="w-3 h-3 text-gray-400" />
                            <span>{store.active_product_count} Produk</span>
                          </span>
                        )}
                      {parsedRating > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400" />
                          <span>
                            {parsedRating.toFixed(1)}
                            {typeof store.review_count === "number" &&
                              ` (${store.review_count} ulasan)`}
                          </span>
                        </span>
                      )}
                    </div>
                    {cleanedDescription && (
                      <p className="mt-1 text-xs md:text-sm text-gray-700 max-w-md line-clamp-2">
                        {cleanedDescription}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-start md:justify-end">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Informasi Toko"
                      >
                        <Store className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                      <DialogHeader className="mb-4">
                        <DialogTitle>{store.name}</DialogTitle>
                        {cleanedDescription && (
                          <DialogDescription>
                            {cleanedDescription}
                          </DialogDescription>
                        )}
                      </DialogHeader>
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-500">
                              {store.profile_image_url ? (
                                <Image
                                  src={store.profile_image_url}
                                  alt={store.name}
                                  width={48}
                                  height={48}
                                  className="object-cover"
                                />
                              ) : (
                                <span>{storeInitial}</span>
                              )}
                            </div>
                            {!!store.is_verified && (
                              <span className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-yellow-400 p-0.5 text-white shadow">
                                <CheckCircle2 className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                          {parsedRating > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Star className="w-5 h-5 text-yellow-400" />
                                <span className="text-2xl font-semibold text-gray-900">
                                  {parsedRating.toFixed(1)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                {typeof store.review_count === "number" &&
                                store.review_count > 0
                                  ? `${store.review_count} ulasan`
                                  : "Belum ada ulasan"}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500">
                              Jumlah Produk
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {typeof store.active_product_count === "number"
                                ? `${store.active_product_count} Produk`
                                : "-"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500">Lokasi Toko</p>
                            <p className="text-sm font-medium text-gray-900">
                              {store.city || "-"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500">
                              Berjualan Sejak
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {joinedAtLabel || "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button size="sm" className="gap-1 flex-1 md:flex-none">
                    <MessageCircle className="w-4 h-4" />
                    Chat Penjual
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </section>
          </>
        )}

        {!loading && !error && store && (
          <section className="mt-4 flex flex-col md:flex-row gap-6">
            <aside className="w-full md:w-64 lg:w-72 shrink-0">
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-5 text-sm">
                <div className="border-b border-gray-100 pb-4">
                  <p className="text-xs font-semibold text-gray-900 mb-2">
                    Kategori Produk
                  </p>
                  <div className="space-y-1 text-xs text-gray-700">
                    <p className="font-medium">Handphone &amp; Tablet</p>
                    <p className="pl-4">Aksesoris Tablet</p>
                    <p className="pl-8 text-gray-500">Charger</p>
                  </div>
                </div>

                <div className="border-b border-gray-100 pb-4">
                  <p className="text-xs font-semibold text-gray-900 mb-2">
                    Koleksi Produk
                  </p>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5">
                      Semua Produk
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5">
                      Terlaris
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5">
                      Promo
                    </span>
                  </div>
                </div>

                <div className="border-b border-gray-100 pb-4">
                  <p className="text-xs font-semibold text-gray-900 mb-2">
                    Filter Harga
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <span className="text-xs text-gray-400">-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="border-b border-gray-100 pb-4">
                  <p className="text-xs font-semibold text-gray-900 mb-2">
                    Kondisi Barang
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConditionFilter("new")}
                      className={`flex-1 rounded-full border px-3 py-1 text-xs ${
                        conditionFilter === "new"
                          ? "border-blue-500 bg-blue-50 text-blue-600"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      Baru
                    </button>
                    <button
                      type="button"
                      onClick={() => setConditionFilter("used")}
                      className={`flex-1 rounded-full border px-3 py-1 text-xs ${
                        conditionFilter === "used"
                          ? "border-blue-500 bg-blue-50 text-blue-600"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      Bekas
                    </button>
                  </div>
                </div>

                <div className="border-b border-gray-100 pb-4">
                  <p className="text-xs font-semibold text-gray-900 mb-2">
                    Filter Lokasi
                  </p>
                  <div className="space-y-1 text-xs text-gray-700">
                    {(showAllLocations
                      ? locationOptions
                      : locationOptions.slice(0, 4)
                    ).map((loc) => (
                      <label
                        key={loc}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="h-3 w-3 rounded border-gray-300"
                          checked={selectedLocations.includes(loc)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLocations((prev) =>
                                prev.includes(loc) ? prev : [...prev, loc]
                              );
                            } else {
                              setSelectedLocations((prev) =>
                                prev.filter((item) => item !== loc)
                              );
                            }
                          }}
                        />
                        <span>{loc}</span>
                      </label>
                    ))}
                    {locationOptions.length > 4 && (
                      <button
                        type="button"
                        onClick={() => setShowAllLocations((prev) => !prev)}
                        className="mt-1 text-[11px] text-blue-600 hover:underline"
                      >
                        {showAllLocations
                          ? "Sembunyikan Lokasi"
                          : "Lihat Lokasi Lainnya"}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-900 mb-2">
                    Tipe Transaksi
                  </p>
                  <div className="space-y-1 text-xs text-gray-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="transaction-type"
                        className="h-3 w-3"
                        checked={transactionType === "all"}
                        onChange={() => setTransactionType("all")}
                      />
                      <span>Semua</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="transaction-type"
                        className="h-3 w-3"
                        checked={transactionType === "system"}
                        onChange={() => setTransactionType("system")}
                      />
                      <span>Melalui Toco</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="transaction-type"
                        className="h-3 w-3"
                        checked={transactionType === "direct"}
                        onChange={() => setTransactionType("direct")}
                      />
                      <span>Secara langsung dengan penjual</span>
                    </label>
                  </div>
                </div>
              </div>
            </aside>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <p className="text-xs text-gray-500">
                  {totalProducts === 0
                    ? "Tidak ada produk yang cocok."
                    : `${
                        startIndex + 1
                      }-${endIndex} dari ${totalProducts} produk`}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    Urutkan Berdasarkan
                  </span>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) =>
                        setSortBy(e.target.value as typeof sortBy)
                      }
                      className="appearance-none rounded-full border border-gray-200 bg-white pl-3 pr-7 py-1 text-xs text-gray-700"
                    >
                      <option value="popular">Paling Populer</option>
                      <option value="price_asc">Harga Terendah</option>
                      <option value="price_desc">Harga Tertinggi</option>
                      <option value="newest">Terbaru</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                  </div>
                  <div className="inline-flex items-center rounded-full border border-gray-200 bg-white p-0.5 text-gray-500">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-xs ${
                        viewMode === "grid"
                          ? "bg-gray-900 text-white"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <LayoutGrid className="w-3 h-3 mr-1" />
                      Grid
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-xs ${
                        viewMode === "list"
                          ? "bg-gray-900 text-white"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <List className="w-3 h-3 mr-1" />
                      List
                    </button>
                  </div>
                </div>
              </div>

              {totalProducts === 0 ? (
                <p className="text-gray-600 text-sm">
                  Toko ini belum memiliki produk yang sesuai filter.
                </p>
              ) : (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4"
                      : "space-y-3"
                  }
                >
                  {pageProducts.map((product) => (
                    <div key={product.product_id} className="w-full">
                      <CardProduct
                        id={product.product_id}
                        slug={product.slug}
                        title={product.name}
                        city={
                          product.city ||
                          product.store_city ||
                          store.city ||
                          "Kota Jakarta"
                        }
                        stock={product.stock_quantity ?? 0}
                        price={product.price ?? 0}
                        img={product.primary_image || "/iphone-product.webp"}
                        discountPercentage={product.discount_percentage}
                        variant={viewMode}
                      />
                    </div>
                  ))}
                </div>
              )}

              {totalPages > 1 && totalProducts > 0 && (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={safePage === 1}
                  >
                    Sebelumnya
                  </Button>
                  <span className="text-xs text-gray-500">
                    Halaman {safePage} dari {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={safePage === totalPages}
                  >
                    Berikutnya
                  </Button>
                </div>
              )}
            </div>
          </section>
        )}

        {!loading && !error && !store && (
          <p className="text-gray-600 text-sm">Toko tidak ditemukan.</p>
        )}
      </div>
    </main>
  );
}
