import React, { useState, useEffect } from "react";
import { Search, X, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface Product {
  product_id: number;
  name: string;
  price: number;
  image_url?: string;
}

interface Props {
  selectedIds: number[];
  onSelect: (ids: number[]) => void;
  onClose: () => void;
}

export default function ProductSelector({
  selectedIds,
  onSelect,
  onClose,
}: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tempSelected, setTempSelected] = useState<number[]>(selectedIds);

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (search) params.append("search", search);

      const response = await fetch(
        `http://localhost:5000/api/products?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (productId: number) => {
    if (tempSelected.includes(productId)) {
      setTempSelected(tempSelected.filter((id) => id !== productId));
    } else {
      setTempSelected([...tempSelected, productId]);
    }
  };

  const handleSave = () => {
    onSelect(tempSelected);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Pilih Product</h2>
            <p className="text-sm text-gray-600 mt-1">
              {tempSelected.length} product terpilih
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-6 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Cari product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <p className="text-gray-600 mt-4">Memuat product...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Tidak ada product ditemukan</p>
            </div>
          ) : (
            <div className="space-y-2">
              {products.map((product) => (
                <div
                  key={product.product_id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleProduct(product.product_id)}
                >
                  <Checkbox
                    checked={tempSelected.includes(product.product_id)}
                    onCheckedChange={() => toggleProduct(product.product_id)}
                  />
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-orange-600 font-semibold mt-1">
                      Rp {product.price.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Batal
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-orange-500 hover:bg-orange-600"
            disabled={tempSelected.length === 0}
          >
            Pilih {tempSelected.length} Product
          </Button>
        </div>
      </Card>
    </div>
  );
}
