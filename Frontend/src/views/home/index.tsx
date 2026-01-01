"use client";

import Image from "next/image";
import Link from "next/link";
import { SwiperSlide } from "swiper/react";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import ProductCarousel from "@/components/composites/Carousel/ProductCarousel";
import BaseCarousel from "@/components/composites/Carousel/BaseCarousel";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type RecomendationProductItem = {
  id: number;
  title: string;
  city: string;
  stock: number;
  price: number;
  img: string;
  slug?: string;
  discountPercentage?: number;
};

type ApiProduct = {
  product_id?: number;
  id?: number;
  name?: string;
  city?: string;
  stock_quantity?: number;
  price?: number;
  primary_image?: string;
  slug?: string;
  discount_percentage?: number;
};

const bannerImages = [
  "/banner-1.webp",
  "/banner-2.webp",
  "/banner-3.webp",
  "/banner-4.webp",
  "/banner-5.webp",
  "/banner-6.webp",
];

const Categories = [
  {
    title: "Fashion Wanita",
    img: "/fashion_wanita.webp",
  },
  {
    title: "Kendaraan",
    img: "/kendaraan.webp",
  },
  {
    title: "Handphone & Tablet",
    img: "/handphone_tablet.webp",
  },
  {
    title: "Kecantikan",
    img: "/kecantikan.webp",
  },
  {
    title: "Kesehatan",
    img: "/kesehatan.webp",
  },
  {
    title: "Elektronik",
    img: "/elektronik.webp",
  },
  {
    title: "Rumah Tangga",
    img: "/rumah_tangga.webp",
  },
  {
    title: "Mainan & Hobi",
    img: "/mainan_hobi.webp",
  },
  {
    title: "Properti",
    img: "/properti.webp",
  },
];

const vouchers = [
  {
    title: "Gratis Ongkir",
    expedition: "J&T",
  },
  {
    title: "Gratis Ongkir",
    expedition: "SiCepat",
  },
  {
    title: "Gratis Ongkir",
    expedition: "JNE",
  },
];

const brands = [
  {
    id: 1,
    href: "/",
    img: "/1-Brand-Banner-Volstice.webp",
  },
  {
    id: 2,
    href: "/",
    img: "/2-Brand-Banner-LifeBehindBars.webp",
  },
  {
    id: 3,
    href: "/",
    img: "/3-Brand-Banner-Solaine.webp",
  },
  {
    id: 4,
    href: "/",
    img: "/4-Brand-Banner-Slank.webp",
  },
  {
    id: 5,
    href: "/",
    img: "/5-Brand-Banner-Orinoco.webp",
  },
];

const BannerCarouselDynamic = dynamic(
  () => import("@/components/composites/Carousel/BannerCarousel"),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-full mx-auto group">
        <div className="w-full h-64 rounded-xl bg-gray-100 animate-pulse" />
      </div>
    ),
  }
);

export default function HomeView() {
  const [bannerImages, setBannerImages] = useState<string[]>([]);
  const [brandBanners, setBrandBanners] = useState<{ id: number; href: string; img: string }[]>([]);
  const [recomendationProducts, setRecomendationProducts] = useState<
    RecomendationProductItem[]
  >([]);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        // Fetch Main Banners
        const mainRes = await fetch(`${API_BASE_URL}/api/banners?type=main`);
        if (mainRes.ok) {
          const data = await mainRes.json();
          // Sort explicitly just in case, though API does it
          const imageUrls = data.map((b: any) => b.image_url);
          setBannerImages(imageUrls.length > 0 ? imageUrls : ["/banner-1.webp", "/banner-2.webp"]);
        }

        // Fetch Brand Banners
        const brandRes = await fetch(`${API_BASE_URL}/api/banners?type=brand`);
        if (brandRes.ok) {
            const data = await brandRes.json();
            const brands = data.map((b: any) => ({
                id: b.id,
                href: b.redirect_url || "/",
                img: b.image_url
            }));
            setBrandBanners(brands);
        }
      } catch (error) {
        console.error("Error fetching banners:", error);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/products?status=active&limit=20`
        );
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as ApiProduct[];
        if (!Array.isArray(data)) {
          return;
        }

        const mapped: RecomendationProductItem[] = data.map((product) => ({
          id: product.product_id ?? product.id ?? 0,
          title: product.name ?? "Produk",
          city: product.city ?? "Kota Jakarta",
          stock: product.stock_quantity ?? 0,
          price: product.price ?? 0,
          img: product.primary_image || "/iphone-product.webp",
          slug: product.slug,
          discountPercentage: product.discount_percentage,
        }));

        setRecomendationProducts(mapped);
      } catch (error) {
        console.error("Error fetching homepage products:", error);
      }
    };

    fetchProducts();
  }, []);

  return (
    <main className="w-full max-w-[1440px] mx-auto px-[5%] my-14 pt-10 lg:pt-24">
      {/* Banner Carousel */}
      <BannerCarouselDynamic images={bannerImages.length > 0 ? bannerImages : ["/banner-1.webp", "/banner-2.webp"]} />
      {/* Categories Section */}
      <section className="flex items-center w-full lg:mt-10">
        <ul className="flex items-center gap-6 lg:gap-14 overflow-auto py-8">
          {Categories.map((category) => (
            <Link key={category.title} href="/">
              <li className="flex flex-col gap-2 items-center">
                <Image
                  src={category.img}
                  alt={category.title}
                  width={80}
                  height={80}
                  className="rounded-full"
                />
                <p className="text-center text-xs font-medium">
                  {category.title}
                </p>
              </li>
            </Link>
          ))}
        </ul>
      </section>
      {/* Dipilih Untuk mu */}
      <section className="flex flex-col gap-8 lg:gap-10 w-full mt-7 lg:mt-14">
        <h3 className="text-2xl lg:text-3xl">
          Dipilih Khusus <span className="font-bold">Untukmu</span>
        </h3>
        <ProductCarousel recomendationProducts={recomendationProducts} />
      </section>
      {/* Pendatang Baru */}
      <section className="flex flex-col gap-8 lg:gap-10 w-full mt-7 lg:mt-14">
        <h3 className="text-2xl lg:text-3xl">
          Pendatang <span className="font-bold">Baru</span>
        </h3>
        <ProductCarousel recomendationProducts={recomendationProducts} />
      </section>
      {/* Dari Mata ke Hati */}
      <section className="flex flex-col gap-8 lg:gap-10 w-full mt-7 lg:mt-14">
        <h3 className="text-2xl font-bold lg:text-3xl">
          Dari Mata <span className="font-normal">ke Hati</span>
        </h3>
        <ul className="flex items-center gap-8">
          <Link href="" className="">
            <li className="flex flex-col items-center gap-3">
              <Image
                src="/tren_terkini.webp"
                alt="tren terkini"
                width={150}
                height={150}
                className="rounded-full"
              />
              <p className="text-center text-xs md:text-sm font-medium">
                Tren terkini
              </p>
            </li>
          </Link>
          <Link href="" className="">
            <li className="flex flex-col items-center gap-3">
              <Image
                src="/upgrade_gadget.webp"
                alt="Upgrade Gadget"
                width={150}
                height={150}
                className="rounded-full"
              />
              <p className="text-center text-xs md:text-sm font-medium">
                Upgrade Gadget
              </p>
            </li>
          </Link>
          <Link href="" className="">
            <li className="flex flex-col items-center gap-3">
              <Image
                src="/mobil_bekas.webp"
                alt="Mobil Bekas"
                width={150}
                height={150}
                className="rounded-full"
              />
              <p className="text-center text-xs md:text-sm font-medium">
                Mobil Bekas
              </p>
            </li>
          </Link>
          <Link href="" className="">
            <li className="flex flex-col items-center gap-3">
              <Image
                src="/hunian_impian.webp"
                alt="Hunian Impian"
                width={150}
                height={150}
                className="rounded-full"
              />
              <p className="text-center text-xs md:text-sm font-medium">
                Property
              </p>
            </li>
          </Link>
        </ul>
      </section>
      <section className="flex flex-col gap-8 lg:gap-10 w-full mt-10 lg:mt-14">
        <h3 className="text-2xl lg:text-3xl">
          Buruan Klaim <span className="font-bold">Promonya!</span>
        </h3>
        <ul className="flex items-center gap-4 overflow-auto py-4">
          {vouchers.map((voucher) => (
            <li
              key={voucher.expedition}
              className="cursor-pointer w-full max-w-sm border border-dashed border-yellow-400 bg-yellow-100 rounded-lg p-2"
            >
              <div className="flex items-center gap-3 w-sm">
                <Image
                  src="/free-shipping.svg"
                  alt="Ilustration Free Shipping"
                  width={120}
                  height={120}
                  className=""
                  style={{ width: "auto", height: "auto" }}
                />
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-yellow-950">
                    November Hemat dengan {voucher.expedition}
                  </p>
                  <span className="text-lg font-bold">{voucher.title}</span>
                  <p className="text-xs text-yellow-400">s/d 09 NOv 2025</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-8 lg:gap-10 w-full mt-7 lg:mt-14">
        <h3 className="text-2xl lg:text-3xl">
          Cek Produk <span className="font-bold">Favorit Tokoo!</span>
        </h3>
        <ProductCarousel recomendationProducts={recomendationProducts} />
      </section>

      <section className="flex flex-col gap-8 lg:gap-10 w-full mt-7 lg:mt-14">
        <h3 className="text-2xl lg:text-3xl">
          Brand <span className="font-bold">Pilihan</span>
        </h3>
        <div className="relative w-full mx-auto group">
          <BaseCarousel
            pagination={true}
            navigation={true}
            autoplay={false}
            loop={false}
            spaceBetween={20}
            centeredSlides={false}
            breakpoints={{
              0: { slidesPerView: 1 },
              800: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            className="w-full"
          >
            {(brandBanners.length > 0 ? brandBanners : brands).map((brand, i) => (
              <SwiperSlide key={i}>
                <Link href={brand.href}>
                  <div className="relative w-full h-64 md:h-48 rounded-xl overflow-hidden">
                    <Image
                      src={brand.img}
                      alt="Banner Brand"
                      fill
                      className="object-cover"
                    />
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </BaseCarousel>
        </div>
      </section>
    </main>
  );
}
