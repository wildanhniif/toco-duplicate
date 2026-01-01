"use client";

import Image from "next/image";
import { SwiperSlide } from "swiper/react";
import BaseCarousel from "./BaseCarousel";

type BannerCarouselProps = {
  images: string[];
};

export default function BannerCarousel({ images }: BannerCarouselProps) {
  // Ensure enough slides for smooth looping (at least 6 for slidesPerView 2.5)
  const displayImages = images.length > 0 && images.length < 6 
    ? [...images, ...images, ...images].slice(0, 6) 
    : images;

  return (
    <div className="relative w-full mx-auto group">
      <BaseCarousel
        pagination={true}
        navigation={true}
        autoplay={true}
        loop={true}
        spaceBetween={20}
        centeredSlides={true}
        effect="slide"
        breakpoints={{
          0: { slidesPerView: 1 },
          800: { slidesPerView: 1.5 },
          1024: { slidesPerView: 2.5 },
        }}
        className="w-full"
      >
        {displayImages.map((src, index) => (
          <SwiperSlide key={`${src}-${index}`} className="relative transition-all duration-300">
            {/* Fixed Height Container for consistency */}
            <div className="w-full h-[180px] sm:h-[250px] md:h-[300px] rounded-lg overflow-hidden shadow-sm relative">
                <Image
                    src={src}
                    alt="Banner"
                    fill
                    className="object-cover"
                    loading={index === 0 ? "eager" : "lazy"}
                    priority={index === 0}
                />
            </div>
          </SwiperSlide>
        ))}
      </BaseCarousel>
    </div>
  );
}
