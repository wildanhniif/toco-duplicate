"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export default function CategoryItems({
  categories,
  activeIndex,
  onSelectCategory,
}: {
  categories: string[];
  activeIndex: number;
  onSelectCategory?: (index: number) => void;
}) {
  return (
    <ScrollArea className="w-full h-[60vh] p-5">
      <ul className="flex flex-col gap-2">
        {categories.map((category, i) => (
          <li key={category}>
            <Button
              variant={activeIndex === i ? "secondary" : "ghost"}
              type="button"
              name={`category-${i}`}
              id={`category-${i}`}
              className="w-full justify-start font-normal"
              onClick={() => onSelectCategory?.(i)}
            >
              {category}
            </Button>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}
