"use client";

import { useEffect, useState } from "react";
import { SwiperSlide } from "swiper/react";
import BaseCarousel from "./BaseCarousel";
import CardProduct from "../CardProduct";

type RecomendationProductsProps = {
  id: number;
  title: string;
  city: string;
  stock: number;
  price: number;
  img: string;
  slug?: string;
  discountPercentage?: number;
};

export default function ProductCarousel({
  recomendationProducts,
}: {
  recomendationProducts: RecomendationProductsProps[];
}) {
  const [navigation, setNavigation] = useState<boolean>(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setNavigation(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <BaseCarousel
      pagination={false}
      navigation={navigation}
      autoplay={false}
      loop={false}
      spaceBetween={20}
      centeredSlides={false}
      breakpoints={{
        0: { slidesPerView: 2 },
        800: { slidesPerView: 4 },
        1024: { slidesPerView: 5 },
      }}
      className="w-full"
    >
      {recomendationProducts.map((product) => (
        <SwiperSlide key={product.id}>
          <CardProduct
            id={product.id}
            slug={product.slug}
            title={product.title}
            city={product.city}
            stock={product.stock}
            price={product.price}
            img={product.img}
            discountPercentage={product.discountPercentage}
          />
        </SwiperSlide>
      ))}
    </BaseCarousel>
  );
}
