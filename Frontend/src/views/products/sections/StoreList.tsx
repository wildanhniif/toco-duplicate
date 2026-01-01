"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronRight, MapPin, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Store {
  store_id: number;
  name: string;
  slug: string;
  city: string;
  profile_image_url?: string;
  is_verified: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface StoreListProps {
  query: string;
}

export default function StoreList({ query }: StoreListProps) {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      setStores([]);
      setLoading(false);
      return;
    }

    const fetchStores = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/stores?q=${encodeURIComponent(query)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setStores(data.stores || []);
        }
      } catch (error) {
        console.error("Error fetching stores", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, [query]);

  if (loading) return null;
  if (!loading && stores.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Toko yang mungkin Anda cari</h3>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {stores.map((store) => (
          <div
            key={store.store_id}
            className="flex-shrink-0 w-[280px] bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push(`/store/${store.slug}`)}
          >
            <div className="flex items-start gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                     <Image
                        src={store.profile_image_url || "/default-avatar.png"}
                        alt={store.name}
                        fill
                        className="object-cover"
                     />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                        <h4 className="font-semibold text-sm text-gray-900 truncate">
                            {store.name}
                        </h4>
                        {/* Simple badge for formatting */}
                         <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1 rounded">Toko</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{store.city || "Indonesia"}</span>
                    </div>
                </div>
                 <Button variant="ghost" size="icon" className="h-8 w-8 -mr-1 text-gray-400">
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
          </div>
        ))}
        {/* Placeholder for "View All" if needed, simplified for now */}
         <div 
             className="flex-shrink-0 w-12 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300 cursor-pointer hover:bg-gray-100"
             onClick={() => {}} // Optional: page to show all stores
        >
             <ChevronRight className="text-gray-400" />
         </div>
      </div>
    </div>
  );
}
