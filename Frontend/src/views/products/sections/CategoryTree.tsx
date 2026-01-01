"use client";

import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";

interface CategoryNode {
  category_id: number;
  name: string;
  slug: string;
  children: CategoryNode[];
}

interface CategoryTreeProps {
  currentCategoryId?: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function CategoryTree({ currentCategoryId }: CategoryTreeProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/categories/tree`);
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (err) {
        console.error("Failed to fetch category tree", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  // Auto-expand parent if currentCategoryId is deep in the tree? 
  // For now, let's just show top level and user can expand.

  const toggleExpand = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  };

  const handleCategoryClick = (id: number) => {
    // Navigate to products page with category_id
    // Preserve other params if needed, but usually category change resets query?
    // Let's keep it simple: /products?category_id=X
    router.push(`/products?category_id=${id}`);
  };

  const renderTree = (nodes: CategoryNode[], depth = 0) => {
    return (
      <ul className={cn("space-y-1", depth > 0 && "ml-4 border-l border-gray-200 pl-2")}>
        {nodes.map((node) => {
          const isExpanded = expandedIds.has(node.category_id);
          const hasChildren = node.children && node.children.length > 0;
          const isActive = currentCategoryId === node.category_id;

          return (
            <li key={node.category_id}>
              <div
                className={cn(
                  "flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer transition-colors text-sm",
                  isActive
                    ? "bg-yellow-50 text-yellow-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                )}
                onClick={() => handleCategoryClick(node.category_id)}
              >
                {/* Expand Toggle */}
                {hasChildren ? (
                  <button
                    onClick={(e) => toggleExpand(e, node.category_id)}
                    className="p-0.5 rounded-sm hover:bg-gray-200 text-gray-400"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                ) : (
                   <span className="w-4.5" /> // spacer
                )}

                <span className="flex-1 truncate">{node.name}</span>
              </div>

              {hasChildren && isExpanded && renderTree(node.children, depth + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  if (loading) return <div className="animate-pulse h-20 bg-gray-100 rounded-md" />;

  return (
    <div className="w-full">
         <h3 className="font-semibold text-gray-900 mb-2 px-2 border-l-4 border-yellow-500">
            Kategori Produk
        </h3>
       {renderTree(categories)}
    </div>
  );
}
