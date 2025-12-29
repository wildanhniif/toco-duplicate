"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus, Image as ImageIcon, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Banner {
  id: number;
  title: string;
  image_url: string;
  redirect_url: string;
  is_active: number;
  sort_order: number;
}

export default function BannerManagementPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newRedirectUrl, setNewRedirectUrl] = useState("");
  const [newSortOrder, setNewSortOrder] = useState(0);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_BASE_URL}/api/banners/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBanners(data);
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Hapus banner ini?")) return;

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_BASE_URL}/api/banners/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Banner berhasil dihapus");
        setBanners(banners.filter((b) => b.id !== id));
      } else {
        toast.error("Gagal menghapus banner");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan sistem");
    }
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl) {
      toast.error("URL Gambar wajib diisi");
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_BASE_URL}/api/banners`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle,
          image_url: newImageUrl,
          redirect_url: newRedirectUrl,
          is_active: true,
          sort_order: newSortOrder,
        }),
      });

      if (response.ok) {
        toast.success("Banner berhasil ditambahkan");
        setIsAdding(false);
        setNewTitle("");
        setNewImageUrl("");
        setNewRedirectUrl("");
        fetchBanners();
      } else {
        toast.error("Gagal menambah banner");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan sistem");
    }
  };

  // ... inside BannerManagementPage component ...

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Card grid looks better with 8 or 12
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBanners = banners.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredBanners.length / itemsPerPage);
  
  const getPaginatedBanners = () => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBanners.slice(start, start + itemsPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manajemen Banner</h1>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Banner
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Banner Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddBanner} className="space-y-4">
              {/* ... form fields same as before ... */}
              <div>
                <Label>Judul (Opsional)</Label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Promo Spesial..."
                />
              </div>
              <div>
                <Label>URL Gambar (Wajib)</Label>
                <Input
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Gunakan URL gambar publik.
                </p>
              </div>
              <div>
                <Label>Link Redirect (Opsional)</Label>
                <Input
                  value={newRedirectUrl}
                  onChange={(e) => setNewRedirectUrl(e.target.value)}
                  placeholder="/category/elektronik"
                />
              </div>
              <div>
                <Label>Urutan</Label>
                <Input
                  type="number"
                  value={newSortOrder}
                  onChange={(e) => setNewSortOrder(parseInt(e.target.value))}
                />
              </div>
              <Button type="submit" className="w-full">
                Simpan
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <Input 
            placeholder="Cari banner..." 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="max-w-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 cursor-auto gap-6 mb-6">
        {loading ? (
             <div className="col-span-2 text-center py-10">Loading...</div>
        ) : getPaginatedBanners().length === 0 ? (
             <div className="col-span-2 text-center py-20 bg-gray-50 rounded-lg border border-dashed">
                <ImageIcon className="w-10 h-10 mx-auto text-gray-400 mb-2"/>
                <p className="text-gray-500">{searchQuery ? "Banner tidak ditemukan." : "Belum ada banner."}</p>
             </div>
        ) : (
            getPaginatedBanners().map((banner) => (
            <Card key={banner.id} className="overflow-hidden group relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                src={banner.image_url}
                alt={banner.title}
                className="w-full h-48 object-cover bg-gray-100"
                onError={(e) => (e.currentTarget.src = "/placeholder-image.jpg")}
                />
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(banner.id)}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
                </div>
                <CardContent className="p-4">
                <h3 className="font-semibold text-lg">
                    {banner.title || "Tanpa Judul"}
                </h3>
                <div className="flex items-center text-sm text-gray-500 mt-2 gap-4">
                    <span className="flex items-center gap-1">
                    <ImageIcon className="w-3 h-3"/> Order: {banner.sort_order}
                    </span>
                    {banner.redirect_url && (
                    <span className="flex items-center gap-1">
                        <ExternalLink className="w-3 h-3"/> {banner.redirect_url}
                    </span>
                    )}
                </div>
                </CardContent>
            </Card>
            ))
        )}
      </div>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
            <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            >
            Previous
            </Button>
            <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
            <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            >
            Next
            </Button>
        </div>
      )}
    </AdminLayout>
  );
}
