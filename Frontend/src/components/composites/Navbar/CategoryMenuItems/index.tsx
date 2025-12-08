"use client";

import CategoryItems from "./CategoryItems";
import CategorySubItems from "./CategorySubItems";

type CategorySubItemLink = {
  name: string;
  categoryId?: number;
};

type CategoryMenuItemsProps = {
  categories: string[];
  categoryItems: {
    categoryTitle: string;
    items: CategorySubItemLink[];
  }[];
  activeIndex: number;
  onSelectCategory?: (index: number) => void;
};

export default function CategoryMenuItems(props: CategoryMenuItemsProps) {
  const { categories, categoryItems, activeIndex, onSelectCategory } = props;
  return (
    <div className="grid grid-cols-[25%_auto] w-6xl">
      <CategoryItems
        categories={categories}
        activeIndex={activeIndex}
        onSelectCategory={onSelectCategory}
      />
      <CategorySubItems
        categoryItems={categoryItems}
        activeRootName={categories[activeIndex] ?? ""}
      />
    </div>
  );
}
