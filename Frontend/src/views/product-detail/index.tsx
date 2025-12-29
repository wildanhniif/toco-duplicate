"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MapPin, Package, CheckCircle2, Star, Share2 } from "lucide-react";
import ProductCarousel from "@/components/composites/Carousel/ProductCarousel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import ProductVariantSelector from "@/components/composites/Product/ProductVariantSelector";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ProductDetailProps {
  slug: string;
}

interface ProductVariant {
  variant_id: number;
  variant_name: string;
  variant_value: string;
  price_adjustment: number;
  image_url: string | null;
  stock_quantity: number;
  sku: string | null;
}

interface Product {
  product_id: number;
  name: string;
  slug?: string;
  price: number;
  stock_quantity: number;
  condition?: string;
  category_id?: number;
  store_id?: number;
  description?: string;
  primary_image?: string;
  city?: string;
  // Store-related fields coming from backend join
  store_name?: string;
  store_slug?: string;
  store_city?: string;
  store_rating?: number;
  store_review_count?: number;
  store_profile_image_url?: string | null;
  store_background_image_url?: string | null;
  store_description?: string | null;
  store_product_count?: number;
  discount_percentage?: number;
  rating_average?: number;
  review_count?: number;
  images?: {
    image_id: number;
    url: string;
    alt_text?: string | null;
    sort_order?: number;
    is_primary?: number;
  }[];
}

interface ApiProduct {
  product_id: number;
  name: string;
  slug?: string;
  city?: string;
  stock_quantity?: number;
  price?: number;
  primary_image?: string;
  discount_percentage?: number;
}

interface RecomendationProductItem {
  id: number;
  title: string;
  city: string;
  stock: number;
  price: number;
  img: string;
  slug?: string;
  discountPercentage?: number;
}

function mapToRecomendationProducts(
  products: ApiProduct[],
  currentProductId?: number
): RecomendationProductItem[] {
  return products
    .filter((p) => p.product_id !== currentProductId)
    .map((product) => ({
      id: product.product_id,
      title: product.name,
      city: product.city ?? "Kota Jakarta",
      stock: product.stock_quantity ?? 0,
      price: product.price ?? 0,
      img: product.primary_image || "/iphone-product.webp",
      slug: product.slug,
      discountPercentage: product.discount_percentage,
    }));
}

export default function ProductDetailView({ slug }: ProductDetailProps) {
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [storeProducts, setStoreProducts] = useState<
    RecomendationProductItem[]
  >([]);
  const [similarProducts, setSimilarProducts] = useState<
    RecomendationProductItem[]
  >([]);
  const [addingToCart, setAddingToCart] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/${slug}`);
        if (!res.ok) {
          setError("Produk tidak ditemukan");
          setLoading(false);
          return;
        }

        const data = (await res.json()) as Product;
        // Tentukan gambar awal untuk ditampilkan
        const images = data.images || [];
        let initialImage: string | null = data.primary_image || null;
        if (images.length > 0) {
          const primary = images.find((img) => img.is_primary === 1);
          initialImage = primary?.url || images[0].url || initialImage;
        }
        setProduct(data);
        setActiveImage(initialImage);

        // Load variants and recommendations in parallel
        fetchVariants(data.product_id);
        fetchRecommendations(data);
      } catch (e) {
        console.error("Error fetching product detail:", e);
        setError("Terjadi kesalahan saat memuat produk");
      } finally {
        setLoading(false);
      }
    };

    const fetchVariants = async (productId: number) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/${productId}/variants`);
        if (res.ok) {
          const data = await res.json();
          setVariants(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("Error fetching variants:", e);
      }
    };

    const fetchRecommendations = async (base: Product) => {
      try {
        if (base.store_id) {
          const resByStore = await fetch(
            `${API_BASE_URL}/api/products?store_id=${base.store_id}&status=active&limit=15`
          );
          if (resByStore.ok) {
            const list = (await resByStore.json()) as ApiProduct[];
            setStoreProducts(mapToRecomendationProducts(list, base.product_id));
          }
        }

        if (base.category_id) {
          const resSimilar = await fetch(
            `${API_BASE_URL}/api/products?category_id=${base.category_id}&status=active&limit=15`
          );
          if (resSimilar.ok) {
            const list = (await resSimilar.json()) as ApiProduct[];
            setSimilarProducts(
              mapToRecomendationProducts(list, base.product_id)
            );
          }
        }
      } catch (e) {
        console.error("Error fetching recommendation products:", e);
      }
    };

    fetchProduct();
  }, [slug]);

  // Ambil nama kategori untuk breadcrumb
  useEffect(() => {
    const fetchCategory = async () => {
      if (!product?.category_id) return;
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/categories/${product.category_id}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data?.name) {
          setCategoryName(data.name);
        }
      } catch (e) {
        console.error("Error fetching category:", e);
      }
    };

    fetchCategory();
  }, [product?.category_id]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);

  const addToCart = async () => {
    if (!product) return false;
    if (!isAuthenticated || !token) {
      router.push("/login");
      return false;
    }

    try {
      setAddingToCart(true);
      const res = await fetch(`${API_BASE_URL}/api/cart/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          product_id: product.product_id, 
          quantity: 1,
          variant_id: selectedVariantId 
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.message || "Gagal menambah ke keranjang");
        return false;
      }

      toast.success("Produk berhasil ditambahkan ke keranjang");
      
      // Trigger cart badge refresh
      if (typeof window !== "undefined" && (window as any).refreshCartBadge) {
        (window as any).refreshCartBadge();
      }
      
      return true;
    } catch (e) {
      console.error("Error adding to cart:", e);
      toast.error("Terjadi kesalahan saat menambah ke keranjang");
      return false;
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    const ok = await addToCart();
    if (ok) {
      router.push("/checkout");
    }
  };

  const handleShare = async () => {
    try {
      const url = window.location.href;
      if (navigator.share) {
        await navigator.share({
          title: product?.name,
          url,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success("Link produk disalin ke clipboard");
      }
    } catch (e) {
      console.error("Error sharing product:", e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Memuat detail produk...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 mb-2">
            {error || "Produk tidak ditemukan"}
          </p>
          <Button onClick={() => router.push("/")}>Kembali ke Beranda</Button>
        </div>
      </div>
    );
  }

  const hasDiscount =
    typeof product.discount_percentage === "number" &&
    product.discount_percentage > 0;

  const selectedVariant = variants.find((v) => v.variant_id === selectedVariantId);
  const variantPriceAdjustment = selectedVariant?.price_adjustment || 0;
  const currentPrice = product.price + variantPriceAdjustment;
  const originalPrice = hasDiscount
    ? Math.round(currentPrice / (1 - (product.discount_percentage ?? 0) / 100))
    : null;

  const mainImageSrc =
    (selectedVariant?.image_url) || activeImage || product.primary_image || "/iphone-product.webp";

  const handleVariantSelect = (variantId: number | null) => {
    setSelectedVariantId(variantId);
    if (variantId) {
      const variant = variants.find((v) => v.variant_id === variantId);
      if (variant?.image_url) {
        setActiveImage(variant.image_url);
      }
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-12">
      <div className="w-full max-w-[1440px] mx-auto px-[5%] pt-32 lg:pt-40">
        {/* Breadcrumb di atas konten, agar judul sejajar dengan gambar */}
        <nav className="text-sm text-gray-600 mb-6 flex flex-wrap items-center gap-1">
          <span className="cursor-pointer" onClick={() => router.push("/")}>
            Beranda
          </span>
          <span>/</span>
          <span
            className="truncate max-w-[140px] md:max-w-xs cursor-pointer hover:text-blue-600"
            onClick={() => {
              if (product.category_id) {
                router.push(`/products?category_id=${product.category_id}`);
              }
            }}
          >
            {categoryName || "Produk"}
          </span>
          <span>/</span>
          <span className="truncate max-w-[140px] md:max-w-xs">
            {product.name}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] gap-10 lg:gap-12">
          {/* Left: Image + Thumbnails */}
          <div className="space-y-4 lg:flex lg:flex-col">
            <Card className="overflow-hidden rounded-2xl p-0 border-none shadow-none bg-transparent">
              <div className="relative w-full aspect-square bg-gray-100 rounded-2xl overflow-hidden">
                <Image
                  src={mainImageSrc}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-center rounded-2xl"
                  loading="eager"
                />
              </div>
            </Card>

            {product.images && product.images.length > 1 && (
              <div className="mt-3 grid grid-cols-4 sm:grid-cols-5 gap-2">
                {product.images.map((img, index) => {
                  const isActive =
                    (activeImage || product.primary_image) === img.url;
                  return (
                    <button
                      key={img.image_id ?? index}
                      type="button"
                      onClick={() => setActiveImage(img.url)}
                      className={`relative w-full aspect-square rounded-lg overflow-hidden border transition-all ${
                        isActive
                          ? "border-yellow-500 ring-2 ring-yellow-300"
                          : "border-gray-200 hover:border-yellow-400"
                      }`}
                    >
                      <Image
                        src={img.url}
                        alt={img.alt_text || product.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Store info card under the gallery */}
            {product.store_slug && (
              <Card
                className="mt-4 flex flex-row items-center gap-3 rounded-xl bg-yellow-50 px-4 py-3 cursor-pointer border border-yellow-100 hover:shadow-sm transition-shadow"
                onClick={() => router.push(`/store/${product.store_slug}`)}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-500">
                    {product.store_profile_image_url ? (
                      <Image
                        src={product.store_profile_image_url}
                        alt={product.store_name || "Toko"}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    ) : (
                      <span>
                        {(product.store_name || "Toko").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-yellow-400 border-2 border-yellow-50 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="flex flex-col flex-1">
                  <span className="font-semibold text-gray-900 text-sm uppercase">
                    {product.store_name || "Nama Toko"}
                  </span>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span>{product.store_city || "Lokasi belum diisi"}</span>
                    </span>
                    {typeof product.store_product_count === "number" && (
                      <>
                        <span className="w-px h-3 bg-gray-300" />
                        <span className="inline-flex items-center gap-1">
                          <Package className="w-3 h-3 text-gray-400" />
                          <span>{product.store_product_count} Produk</span>
                        </span>
                      </>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-600 truncate">
                    {product.store_description || "Belum ada deskripsi toko."}
                  </p>
                </div>
              </Card>
            )}
          </div>

          {/* Right: Info + Deskripsi & QnA (vertikal) */}
          <div className="flex flex-col gap-4">
            <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">
              {product.name}
            </h1>

            {/* Rating + share bar */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              {typeof product.rating_average === "number" && (
                <span className="inline-flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span>
                    {product.rating_average.toFixed(1)} (
                    {product.review_count || 0} ulasan)
                  </span>
                </span>
              )}
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1 text-blue-600 hover:underline"
              >
                <Share2 className="w-4 h-4" />
                <span>Bagikan</span>
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-2xl lg:text-3xl font-bold text-red-600">
                {formatCurrency(currentPrice)}
              </p>
              {hasDiscount && originalPrice && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="line-through text-gray-400">
                    {formatCurrency(originalPrice)}
                  </span>
                  <span className="text-red-500 font-semibold">
                    {Math.round(product.discount_percentage!)}% OFF
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>
                  {product.store_city ||
                    product.city ||
                    "Lokasi tidak tersedia"}
                </span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Package className="w-4 h-4 text-orange-500" />
                <span>
                  <span className="font-semibold text-orange-500">
                    {product.stock_quantity}
                  </span>{" "}
                  Stok tersisa
                </span>
              </span>
              {product.condition && (
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>
                    Kondisi {product.condition === "used" ? "Bekas" : "Baru"}
                  </span>
                </span>
              )}
            </div>

            {/* Product Variants */}
            {variants.length > 0 && (
              <div className="mt-4">
                <ProductVariantSelector
                  variants={variants}
                  selectedVariantId={selectedVariantId}
                  onVariantSelect={handleVariantSelect}
                  basePrice={product.price}
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Button
                size="lg"
                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
                onClick={handleBuyNow}
                disabled={addingToCart}
              >
                Beli Sekarang
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 border-yellow-400 text-yellow-500 font-semibold hover:bg-yellow-50"
                onClick={addToCart}
                disabled={addingToCart}
              >
                Tambah Ke Keranjang
              </Button>
            </div>

            {/* Deskripsi & QnA vertikal di bawah info */}
            <div className="mt-6 flex flex-col gap-4">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-3">Deskripsi</h2>
                <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                  {product.description || "Belum ada deskripsi produk."}
                </p>
              </Card>

              <Card className="p-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-semibold mb-2">
                    Punya pertanyaan seputar produk?
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Kamu bisa diskusikan dengan penjual atau pembeli lain.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-yellow-400 text-yellow-500"
                >
                  Tulis Pertanyaan
                </Button>
              </Card>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {storeProducts.length > 0 && (
          <section className="mt-12 flex flex-col gap-6">
            <h2 className="text-xl lg:text-2xl">
              Eksplor Produk Lain di <span className="font-bold">Toko Ini</span>
            </h2>
            <ProductCarousel recomendationProducts={storeProducts} />
          </section>
        )}

        {similarProducts.length > 0 && (
          <section className="mt-12 flex flex-col gap-6">
            <h2 className="text-xl lg:text-2xl">
              Produk <span className="font-bold">Serupa</span>
            </h2>
            <ProductCarousel recomendationProducts={similarProducts} />
          </section>
        )}
      </div>
    </main>
  );
}
