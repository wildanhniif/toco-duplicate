"use client";

import { forwardRef } from "react";
import { Button } from "@/components/ui/button";

type CarouselButtonProps = {
  children: React.ReactNode;
  className?: string;
};

const CarouselButton = forwardRef<HTMLButtonElement, CarouselButtonProps>(
  ({ children, className }, ref) => {
    return (
      <Button
        ref={ref}
        variant="outline"
        size="icon-lg"
        className={`absolute top-[40%] z-10 rounded-full ${className}`}
      >
        {children}
      </Button>
    );
  }
);

export default CarouselButton;
