"use client";

import { useEffect, useRef } from "react";
import { Swiper } from "swiper/react";
import { Autoplay, Navigation, Pagination, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import { SwiperOptions } from "swiper/types";
import CarouselButton from "./CarouselButton";
import { ChevronLeft, ChevronRight } from "lucide-react";

type BaseCarouselProps = {
  children: React.ReactNode;
  autoplay?: boolean;
  pagination?: boolean;
  navigation?: boolean;
  loop?: boolean;
  spaceBetween?: number;
  centeredSlides?: boolean;
  breakpoints?: SwiperOptions["breakpoints"];
  className?: string;
  effect?: "slide" | "fade";
  slidesPerView?: number | "auto";
};

export default function BaseCarousel(props: BaseCarouselProps) {
  const {
    children,
    autoplay = true,
    pagination = true,
    navigation = true,
    loop = true,
    spaceBetween = 16,
    centeredSlides = false,
    breakpoints,
    className = "",
    effect = "slide",
    slidesPerView,
  } = props;
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const swiperRef = useRef<any>(null);

  useEffect(() => {
    if (
      swiperRef.current &&
      prevRef.current &&
      nextRef.current &&
      swiperRef.current.params
    ) {
      swiperRef.current.params.navigation.prevEl = prevRef.current;
      swiperRef.current.params.navigation.nextEl = nextRef.current;
      swiperRef.current.navigation.init();
      swiperRef.current.navigation.update();
    }
  }, []);

  return (
    <div className={`relative w-full mx-auto group ${className}`}>
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade]}
        pagination={pagination ? { clickable: true } : false}
        autoplay={autoplay ? { delay: 5000, disableOnInteraction: false } : false}
        loop={loop}
        spaceBetween={spaceBetween}
        centeredSlides={centeredSlides}
        breakpoints={breakpoints}
        slidesPerView={slidesPerView}
        effect={effect}
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        className="w-full"
      >
        {children}
      </Swiper>

      {navigation && (
        <>
          <CarouselButton
            ref={prevRef}
            className="left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <ChevronLeft />
          </CarouselButton>
          <CarouselButton
            ref={nextRef}
            className="right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <ChevronRight />
          </CarouselButton>
        </>
      )}
    </div>
  );
}
