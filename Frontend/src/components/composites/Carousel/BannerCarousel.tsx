"use client";

import Image from "next/image";
import { SwiperSlide } from "swiper/react";
import BaseCarousel from "./BaseCarousel";

type BannerCarouselProps = {
  images: string[];
};

export default function BannerCarousel({ images }: BannerCarouselProps) {
  return (
    <div className="relative w-full mx-auto group">
      <BaseCarousel
        pagination={true}
        navigation={true}
        autoplay={true}
        loop={true}
        spaceBetween={20}
        centeredSlides={true}
        breakpoints={{
          0: { slidesPerView: 1 },
          800: { slidesPerView: 1.5 },
          1024: { slidesPerView: 2.5 },
        }}
        className="w-full"
      >
        {images.map((src, index) => (
          <SwiperSlide key={src}>
            <Image
              src={src}
              alt="Banner"
              width={500}
              height={256}
              className="w-full h-full object-cover"
              loading={index === 0 ? "eager" : "lazy"}
              priority={index === 0}
            />
          </SwiperSlide>
        ))}
      </BaseCarousel>
    </div>
  );
}
