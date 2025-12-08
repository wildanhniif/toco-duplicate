"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

type CategorySubItemLink = {
  name: string;
  categoryId?: number;
};

type CategorySubItemsProps = {
  categoryTitle: string;
  items: CategorySubItemLink[];
};

export default function CategorySubItems({
  categoryItems,
  activeRootName,
}: {
  categoryItems: CategorySubItemsProps[];
  activeRootName: string;
}) {
  return (
    <ScrollArea className="w-full h-[60vh] p-5">
      <h6 className="flex items-center gap-3 text-2xl font-bold">
        {activeRootName || ""} <ChevronRight />
      </h6>
      <Accordion
        type="single"
        collapsible
        defaultValue="item-1"
        className="grid grid-cols-3 gap-6 w-full mt-5"
      >
        {categoryItems.map((categoryItem, i) => (
          <AccordionItem
            key={`${categoryItem.categoryTitle}-${i}`}
            value={`item-${i + 1}`}
          >
            <AccordionTrigger>{categoryItem.categoryTitle}</AccordionTrigger>
            <AccordionContent>
              <ul className="flex flex-col gap-3">
                {categoryItem.items.map((item, i) => (
                  <li key={`${item.name}-${i}`} className="text-sm">
                    {item.categoryId ? (
                      <Link
                        href={`/products?category_id=${item.categoryId}`}
                        className="hover:underline hover:text-blue-600"
                      >
                        {item.name}
                      </Link>
                    ) : (
                      item.name
                    )}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </ScrollArea>
  );
}
