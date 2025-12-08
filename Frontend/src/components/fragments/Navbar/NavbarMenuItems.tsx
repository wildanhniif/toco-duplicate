"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CategoryMenuItems from "@/components/composites/Navbar/CategoryMenuItems";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { LayoutGrid } from "lucide-react";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type CategoryNode = {
  category_id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  children?: CategoryNode[];
};

type CategorySubItemLink = {
  name: string;
  categoryId?: number;
};

const mockCategories = [
  "Jasa",
  "Kendaraan",
  "Buku",
  "Perlengkapan Pesta & Craft",
  "Fashion Pria",
  "Gaming",
  "Kesehatan",
  "Film & Music",
  "Kecantikan",
  "Rumah Tangga",
  "Fashion Muslim",
  "Ibu & Bayi",
  "Elektronik",
  "Office & Stationery",
  "Handphone & Tablet",
  "Pertukangan",
  "Otomotif",
];

const mockCategoryItems: {
  categoryTitle: string;
  items: CategorySubItemLink[];
}[] = [
  {
    categoryTitle: "Jasa Perumahan & Property",
    items: [
      { name: "Jasa Relokasi" },
      { name: "Agen Real Estate" },
      { name: "Arsitek dan Disainer Interior" },
      { name: "Perawatan dan Perbaikan Rumah" },
      { name: "Kontraktor Bangunan" },
      { name: "Cleaning Service" },
      { name: "Manajemen Property" },
    ],
  },
  {
    categoryTitle: "Jasa Hukum & Legal",
    items: [
      { name: "Konsultasi Hukum dan Keluarga" },
      { name: "Notaris" },
      { name: "Konsultan Hak Kekayaan Intelektual" },
      { name: "Jasa Perizinan" },
      { name: "Pengacara dan Advokat" },
      { name: "Mediator dan Arbiter" },
      { name: "Jasa Penyusunan Kontrak" },
    ],
  },
  {
    categoryTitle: "Jasa Perawatan Pribadi",
    items: [
      { name: "Spa dan Pusat Kecantikan" },
      { name: "Manicure dan Pedicure" },
      { name: "Salon dan Barbershop" },
      { name: "Personal Trainer" },
      { name: "Yoga dan Pilates Instructor" },
      { name: "Perawatan Hewan Peliharaan" },
      { name: "Terapi Pijat" },
    ],
  },
  {
    categoryTitle: "Jasa Teknologi Informasi",
    items: [
      { name: "IT Support dan Networking" },
      { name: "Pengembangan Software dan Aplikasi" },
      { name: "Web Development dan Desain" },
      { name: "Jasa SEO dan Digital Marketing" },
      { name: "Konsultan IT" },
      { name: "Penyedia Jasa Internet (ISP)" },
      { name: "Keamanan Cyber" },
    ],
  },
];

const productsFeatured = ["Kameja", "Celana Kulot", "Iphone", "Lampu Tidur"];

export default function NavbarMenuItems() {
  const router = useRouter();
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);
  const [activeRootIndex, setActiveRootIndex] = useState(0);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories/tree`);
        if (!response.ok) {
          console.error("Gagal mengambil kategori:", response.statusText);
          return;
        }

        const data: CategoryNode[] = await response.json();
        if (Array.isArray(data)) {
          setCategoryTree(data);
        }
      } catch (error) {
        console.error("Error saat fetch kategori:", error);
      }
    };

    fetchCategories();
  }, []);

  const rootCategories = categoryTree;
  const dynamicCategories =
    rootCategories.length > 0
      ? rootCategories.map((category) => category.name)
      : mockCategories;

  const activeRoot =
    rootCategories[activeRootIndex] || rootCategories[0] || null;
  const dynamicCategoryItems =
    activeRoot && Array.isArray(activeRoot.children)
      ? activeRoot.children.map((child: CategoryNode) => ({
          categoryTitle: child.name,
          items: (child.children ?? []).map((grandchild: CategoryNode) => ({
            name: grandchild.name,
            categoryId: grandchild.category_id,
          })),
        }))
      : mockCategoryItems;

  return (
    <div className="hidden lg:flex justify-between items-center w-full">
      <div className="flex items-center">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="gap-2">
                <LayoutGrid className="w-4 h-4" /> Semua Kategori
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="p-2">
                  <CategoryMenuItems
                    categories={dynamicCategories}
                    categoryItems={dynamicCategoryItems}
                    activeIndex={activeRootIndex}
                    onSelectCategory={setActiveRootIndex}
                  />
                  {activeRoot && (
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        className="text-xs font-medium text-blue-600 hover:underline"
                        onClick={() =>
                          router.push(
                            `/products?category_id=${activeRoot.category_id}`
                          )
                        }
                      >
                        Lihat semua produk di {activeRoot.name}
                      </button>
                    </div>
                  )}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem className={`${navigationMenuTriggerStyle()}`}>
              <Link href="/" className="flex items-center gap-2 underline">
                Tokoo Classified
                <p className="text-[0.6rem] font-bold py-1 px-2 bg-primary text-white rounded-full underline-none">
                  Iklan Baris
                </p>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem className={`${navigationMenuTriggerStyle()}`}>
              <NavigationMenuLink asChild>
                <Link href="/" className="underline">
                  Tokoo Seller
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem className={`${navigationMenuTriggerStyle()}`}>
              <NavigationMenuLink asChild>
                <Link href="/" className="underline">
                  Artikel
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      <div className="hidden xl:block">
        <ul className="flex items-center gap-5">
          {productsFeatured.map((product) => (
            <Link key={product} href="/">
              <li className="text-sm font-normal">{product}</li>
            </Link>
          ))}
        </ul>
      </div>
    </div>
  );
}
