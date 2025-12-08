"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardTitle } from "../ui/card";

type CardProductProps = {
  id?: number;
  slug?: string;
  title: string;
  city: string;
  stock: number;
  price: number;
  img: string;
  discountPercentage?: number;
  variant?: "grid" | "list";
};

export default function CardProduct(props: CardProductProps) {
  const {
    id,
    slug,
    title,
    city,
    stock,
    price,
    img,
    discountPercentage,
    variant = "grid",
  } = props;

  const isList = variant === "list";

  const href = slug ? `/product/${slug}` : id ? `/product/${id}` : "#";

  const hasDiscount =
    typeof discountPercentage === "number" && discountPercentage > 0;

  const originalPrice = hasDiscount
    ? Math.round(price / (1 - discountPercentage / 100))
    : null;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);

  const cardClassName = `w-full h-auto overflow-hidden border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-transform bg-white p-0 gap-0 ${
    isList ? "max-w-full flex flex-row" : "max-w-[220px]"
  }`;

  const imageWrapperClassName = isList
    ? "relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 overflow-hidden rounded-2xl flex-shrink-0"
    : "relative w-full aspect-square overflow-hidden rounded-2xl";

  const contentClassName = `flex flex-col gap-1.5 px-3 py-3 ${
    isList ? "justify-center" : ""
  }`;

  return (
    <Link href={href} className="block">
      <Card className={cardClassName}>
        <div className={imageWrapperClassName}>
          <Image
            src={img}
            alt={title}
            fill
            sizes="(max-width: 768px) 50vw, 220px"
            className="object-cover object-center rounded-2xl"
          />
          <CardDescription className="sr-only">
            This is a product card for {title}
          </CardDescription>
        </div>
        <CardContent className={contentClassName}>
          <span className="text-[11px] text-orange-500 font-semibold">
            Sisa {stock}
          </span>
          <CardTitle className="text-xs font-medium text-gray-900 line-clamp-2">
            {title}
          </CardTitle>
          <span className="text-sm font-bold text-red-600">
            {formatCurrency(price)}
          </span>
          {hasDiscount && originalPrice && (
            <div className="flex items-center gap-1 text-[11px]">
              <span className="line-through text-gray-400">
                {formatCurrency(originalPrice)}
              </span>
              <span className="text-red-500 font-semibold">
                {Math.round(discountPercentage!)}%
              </span>
            </div>
          )}
          <span className="text-[11px] text-gray-500 mt-1 line-clamp-1">
            {city}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
