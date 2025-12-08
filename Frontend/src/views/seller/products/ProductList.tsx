import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  Edit,
  Trash2,
  Copy,
  TrendingUp,
  Eye,
  Heart,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import SellerSidebar from "@/components/layouts/SellerSidebar";
import { useAuth } from "@/hooks/useAuth";

interface Product {
  product_id: number;
  name: string;
  sku: string;
  price: number;
  discount_percentage?: number;
  stock_quantity: number;
  status: "active" | "inactive" | "draft";
  product_type: "marketplace" | "classified";
  is_preorder: boolean;
  image_url?: string;
  views_count?: number;
  favorites_count?: number;
  cart_adds_count?: number;
  is_promoted?: boolean;
  category_id: number;
  condition: "new" | "used";
}

interface Category {
  category_id: number;
  name: string;
  slug: string;
}

interface FilterState {
  categories: number[];
  condition?: "new" | "used";
  stockMin?: string;
  stockMax?: string;
  priceMin?: string;
  priceMax?: string;
}

const ProductListView: React.FC = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  // Filter & Search States
  const [activeTab, setActiveTab] = useState<
    "all" | "active" | "inactive" | "classified" | "draft"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("created_at_desc");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    stockMin: "",
    stockMax: "",
    priceMin: "",
    priceMax: "",
  });
  const [categorySearch, setCategorySearch] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Dialogs
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const [selectedProductForAction, setSelectedProductForAction] =
    useState<Product | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    if (token) {
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, searchQuery, sortBy, filters, page, token]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      setCategories(data.categories || data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Gagal memuat kategori");
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: activeTab,
        page: page.toString(),
        limit: limit.toString(),
        sort: sortBy,
      });

      if (searchQuery) params.append("q", searchQuery);
      if (filters.categories.length > 0) {
        filters.categories.forEach((cat) =>
          params.append("category_id", cat.toString())
        );
      }
      if (filters.condition) params.append("condition", filters.condition);
      if (filters.stockMin) params.append("stock_min", filters.stockMin);
      if (filters.stockMax) params.append("stock_max", filters.stockMax);
      if (filters.priceMin) params.append("price_min", filters.priceMin);
      if (filters.priceMax) params.append("price_max", filters.priceMax);

      const response = await fetch(
        `http://localhost:5000/api/products/my?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.message || "Failed to fetch products");
      }
      const data = await response.json();
      console.log("Products data:", data);
      console.log("Total products:", data.total);
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Gagal memuat produk");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p) => p.product_id));
    }
  };

  const handleSelectProduct = (productId: number) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleToggleStatus = async (
    productId: number,
    currentStatus: string
  ) => {
    if (!token) return;

    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";

      const response = await fetch(
        `http://localhost:5000/api/products/${productId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) throw new Error("Failed to toggle status");

      toast.success(
        `Produk berhasil di${
          newStatus === "active" ? "aktifkan" : "nonaktifkan"
        }`
      );
      fetchProducts();
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Gagal mengubah status produk");
    }
  };

  const handlePromote = async () => {
    if (!selectedProductForAction || !token) return;

    try {
      const url = `http://localhost:5000/api/products/${selectedProductForAction.product_id}/promote`;
      const method = selectedProductForAction.is_promoted ? "DELETE" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to promote");

      toast.success(
        selectedProductForAction.is_promoted
          ? "Iklan dibatalkan"
          : "Produk berhasil diiklankan"
      );
      setShowPromoteDialog(false);
      setSelectedProductForAction(null);
      fetchProducts();
    } catch (error) {
      console.error("Error promoting:", error);
      toast.error("Gagal mengiklankan produk");
    }
  };

  const handleDelete = async () => {
    if (!selectedProductForAction || !token) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/products/${selectedProductForAction.product_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to delete");

      toast.success("Produk berhasil dihapus");
      setShowDeleteDialog(false);
      setSelectedProductForAction(null);
      fetchProducts();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Gagal menghapus produk");
    }
  };

  const handleDuplicate = async (productId: number) => {
    if (!token) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/products/${productId}/duplicate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to duplicate");

      const data = await response.json();
      toast.success("Produk berhasil diduplikat");
      router.push(`/seller/products/edit/${data.product_id}`);
    } catch (error) {
      console.error("Error duplicating:", error);
      toast.error("Gagal menduplikat produk");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0 || !token) return;

    try {
      const response = await fetch("http://localhost:5000/api/products/bulk", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ product_ids: selectedProducts }),
      });

      if (!response.ok) throw new Error("Failed to bulk delete");

      toast.success(`${selectedProducts.length} produk berhasil dihapus`);
      setSelectedProducts([]);
      fetchProducts();
    } catch (error) {
      console.error("Error bulk deleting:", error);
      toast.error("Gagal menghapus produk");
    }
  };

  const handleBulkToggle = async (status: "active" | "inactive") => {
    if (selectedProducts.length === 0 || !token) return;

    try {
      const response = await fetch(
        "http://localhost:5000/api/products/bulk/status",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ product_ids: selectedProducts, status }),
        }
      );

      if (!response.ok) throw new Error("Failed to bulk toggle");

      toast.success(`${selectedProducts.length} produk berhasil diubah`);
      setSelectedProducts([]);
      fetchProducts();
    } catch (error) {
      console.error("Error bulk toggling:", error);
      toast.error("Gagal mengubah status produk");
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <>
      <SellerSidebar />

      <div className="flex-1 ml-64 p-8 bg-gray-50 min-h-screen">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Daftar Produk</h1>
            <Link href="/seller/products/add">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Produk
              </Button>
            </Link>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg border">
            <div className="flex items-center gap-4 p-4 border-b">
              {[
                { value: "all", label: "Semua Produk" },
                { value: "active", label: "Aktif" },
                { value: "inactive", label: "Nonaktif" },
                { value: "classified", label: "Classified" },
                { value: "draft", label: "Draft" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value as typeof activeTab)}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    activeTab === tab.value
                      ? "bg-blue-500 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search, Sort, Filter */}
            <div className="flex items-center gap-4 p-4 border-b">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari nama produk atau SKU"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Urutkan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at_desc">Terbaru</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="price_desc">Harga Tertinggi</SelectItem>
                  <SelectItem value="price_asc">Harga Terendah</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="p-4 bg-gray-50 border-b space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Category Filter */}
                  <div className="space-y-2">
                    <Label>Kategori</Label>
                    <div className="border rounded-lg bg-white p-3 max-h-48 overflow-y-auto">
                      <Input
                        placeholder="Cari kategori..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="mb-2"
                      />
                      {filteredCategories.map((cat) => (
                        <div
                          key={cat.category_id}
                          className="flex items-center gap-2 py-1"
                        >
                          <Checkbox
                            checked={filters.categories.includes(
                              cat.category_id
                            )}
                            onCheckedChange={(checked: boolean) => {
                              setFilters((prev) => ({
                                ...prev,
                                categories: checked
                                  ? [...prev.categories, cat.category_id]
                                  : prev.categories.filter(
                                      (id) => id !== cat.category_id
                                    ),
                              }));
                            }}
                          />
                          <span className="text-sm">{cat.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Condition Filter */}
                  <div className="space-y-2">
                    <Label>Kondisi</Label>
                    <Select
                      value={filters.condition || ""}
                      onValueChange={(value: "new" | "used") =>
                        setFilters((prev) => ({ ...prev, condition: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kondisi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Baru</SelectItem>
                        <SelectItem value="used">Bekas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Stock Range */}
                  <div className="space-y-2">
                    <Label>Rentang Stock</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.stockMin}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            stockMin: e.target.value,
                          }))
                        }
                      />
                      <span>-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.stockMax}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            stockMax: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="space-y-2">
                    <Label>Rentang Harga</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.priceMin}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            priceMin: e.target.value,
                          }))
                        }
                      />
                      <span>-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.priceMax}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            priceMax: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilters({
                        categories: [],
                        stockMin: "",
                        stockMax: "",
                        priceMin: "",
                        priceMax: "",
                      });
                      setCategorySearch("");
                    }}
                  >
                    Reset Filter
                  </Button>
                </div>
              </div>
            )}

            {/* Bulk Actions */}
            {selectedProducts.length > 0 && (
              <div className="flex items-center gap-4 p-4 bg-blue-50 border-b">
                <span className="text-sm font-medium">
                  {selectedProducts.length} produk dipilih
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkToggle("active")}
                >
                  Aktifkan
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkToggle("inactive")}
                >
                  Nonaktifkan
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </Button>
              </div>
            )}

            {/* Products List */}
            <div className="p-4">
              {/* Table Header */}
              <div className="flex items-center gap-4 pb-4 border-b font-medium text-sm text-gray-600">
                <div className="w-8">
                  <Checkbox
                    checked={
                      selectedProducts.length === products.length &&
                      products.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </div>
                <div className="flex-1">Informasi Produk</div>
                <div className="w-32">Harga</div>
                <div className="w-24">Stock</div>
                <div className="w-24">Status</div>
                <div className="w-16">Aksi</div>
              </div>

              {/* Product Items */}
              {loading ? (
                <div className="py-12 text-center text-gray-500">
                  Memuat produk...
                </div>
              ) : products.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  Tidak ada produk ditemukan
                </div>
              ) : (
                <div className="divide-y">
                  {products.map((product) => (
                    <div
                      key={product.product_id}
                      className="flex items-center gap-4 py-4"
                    >
                      <div className="w-8">
                        <Checkbox
                          checked={selectedProducts.includes(
                            product.product_id
                          )}
                          onCheckedChange={() =>
                            handleSelectProduct(product.product_id)
                          }
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 flex items-center gap-4">
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                          <Image
                            src={product.image_url || "/placeholder.png"}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <h3 className="font-medium">{product.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            {product.is_preorder && (
                              <Badge variant="outline">Preorder</Badge>
                            )}
                            <span>SKU: {product.sku || "-"}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {product.views_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-4 h-4" />
                              {product.favorites_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <ShoppingCart className="w-4 h-4" />
                              {product.cart_adds_count || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="w-32 space-y-1">
                        <div className="font-medium">
                          {formatPrice(product.price)}
                        </div>
                        {product.discount_percentage && (
                          <Badge variant="secondary" className="text-xs">
                            -{product.discount_percentage}%
                          </Badge>
                        )}
                      </div>

                      {/* Stock */}
                      <div className="w-24">
                        <div className="font-medium">
                          {product.stock_quantity}
                        </div>
                      </div>

                      {/* Status Toggle */}
                      <div className="w-24">
                        <Switch
                          checked={product.status === "active"}
                          onCheckedChange={() =>
                            handleToggleStatus(
                              product.product_id,
                              product.status
                            )
                          }
                          disabled={product.status === "draft"}
                        />
                      </div>

                      {/* Actions */}
                      <div className="w-16">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/seller/products/edit/${product.product_id}`
                                )
                              }
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Produk
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedProductForAction(product);
                                setShowPromoteDialog(true);
                              }}
                            >
                              <TrendingUp className="w-4 h-4 mr-2" />
                              {product.is_promoted
                                ? "Batalkan Iklan"
                                : "Iklankan Produk"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleDuplicate(product.product_id)
                              }
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Duplikat Produk
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setSelectedProductForAction(product);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Hapus Produk
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {total > limit && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Menampilkan {(page - 1) * limit + 1} -{" "}
                    {Math.min(page * limit, total)} dari {total} produk
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page * limit >= total}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Promote Dialog */}
          <Dialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedProductForAction?.is_promoted
                    ? "Batalkan Iklan"
                    : "Iklankan Produk"}
                </DialogTitle>
                <DialogDescription>
                  {selectedProductForAction?.is_promoted
                    ? "Yakin ingin membatalkan iklan produk ini?"
                    : "Produk yang diiklankan akan tampil paling atas selama 60 menit. Kamu hanya bisa mengiklankan maksimal 2 produk dalam satu waktu."}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowPromoteDialog(false)}
                >
                  Batal
                </Button>
                <Button onClick={handlePromote}>
                  {selectedProductForAction?.is_promoted
                    ? "Batalkan"
                    : "Iklankan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Hapus Produk</DialogTitle>
                <DialogDescription>
                  Yakin ingin menghapus produk &quot;
                  {selectedProductForAction?.name}&quot;? Tindakan ini tidak
                  dapat dibatalkan.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                >
                  Batal
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Hapus
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
};

export default ProductListView;
