"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, ExternalLink, Upload } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import AdminLayout from "@/components/layouts/AdminLayout";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Banner = {
  id: number;
  title: string;
  image_url: string;
  public_id?: string;
  redirect_url: string;
  is_active: boolean;
  sort_order: number;
  type: "main" | "brand";
};

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"main" | "brand">("main");
  
  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<Partial<Banner>>({});
  
  // Upload State
  const [uploading, setUploading] = useState(false);

  const getAuthHeader = () => {
    const token = localStorage.getItem("auth_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchBanners = async () => {
    setLoading(true);
    try {
      // Fetch all banners for admin (includes inactive)
      const response = await fetch(`${API_BASE_URL}/api/banners/admin?type=${activeTab}`, {
        headers: getAuthHeader() as HeadersInit,
      });
      if (response.ok) {
        const data = await response.json();
        setBanners(data);
      } else if (response.status === 401) {
          toast.error("Sesi habis, silakan login kembali");
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
      toast.error("Gagal mengambil data banner");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [activeTab]);

  const handleBulkUpload = async (files: File[]) => {
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach(file => {
        formData.append("images", file);
    });

    setLoading(true);
    const loadingToast = toast.loading(`Mengupload ${files.length} gambar...`);

    try {
        // 1. Upload Images
        const uploadRes = await fetch(`${API_BASE_URL}/api/upload/images?type=banners`, {
            method: "POST",
            headers: getAuthHeader() as HeadersInit,
            body: formData
        });

        if (!uploadRes.ok) throw new Error("Gagal upload gambar");
        
        const uploadData = await uploadRes.json();
        const images = uploadData.images; // Array of { url, public_id, ... }

        // 2. Create Banners Batch
        const batchPayload = {
            type: activeTab,
            banners: images.map((img: any) => ({
                image_url: img.url,
                public_id: img.public_id,
                title: "",
                redirect_url: "" 
            }))
        };

        const batchRes = await fetch(`${API_BASE_URL}/api/banners/batch`, {
            method: "POST",
             headers: { 
                "Content-Type": "application/json",
                ...getAuthHeader()
            } as HeadersInit,
            body: JSON.stringify(batchPayload)
        });

        if (!batchRes.ok) throw new Error("Gagal membuat banner");

        toast.success(`Berhasil menambahkan ${images.length} banner!`);
        fetchBanners();
        setIsDialogOpen(false); // Close dialog if open

    } catch (error) {
        console.error(error);
        toast.error("Terjadi kesalahan saat upload bulk");
    } finally {
        toast.dismiss(loadingToast);
        setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | { target: { files: FileList | null } }) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    // If multiple files selected/dropped, use bulk logic
    if (e.target.files.length > 1) {
        await handleBulkUpload(Array.from(e.target.files));
        return;
    }

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("image", file);
    
    setUploading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/api/upload/image?type=banners`, {
            method: "POST",
            headers: getAuthHeader() as HeadersInit,
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            // Store both URL and public_id
            setCurrentBanner(prev => ({ 
                ...prev, 
                image_url: data.url,
                public_id: data.public_id 
            }));
            toast.success("Gambar berhasil diupload");
        } else {
            toast.error("Gagal upload gambar");
        }
    } catch (error) {
        console.error("Upload error:", error);
        toast.error("Terjadi kesalahan saat upload");
    } finally {
        setUploading(false);
    }
  };

  // Wrapper for the bulk input change event
  const onBulkInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          handleBulkUpload(Array.from(e.target.files));
          e.target.value = ""; // Reset input
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditing
        ? `${API_BASE_URL}/api/banners/${currentBanner.id}`
        : `${API_BASE_URL}/api/banners`;
      
      const method = isEditing ? "PUT" : "POST";
      
      const payload = {
          ...currentBanner,
          type: activeTab, // Ensure type is set based on active tab
          is_active: currentBanner.is_active ?? true,
          sort_order: Number(currentBanner.sort_order || 0)
      };

      const response = await fetch(url, {
        method,
        headers: { 
            "Content-Type": "application/json",
            ...getAuthHeader()
        } as HeadersInit,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(isEditing ? "Banner berhasil diperbarui" : "Banner berhasil ditambahkan");
        setIsDialogOpen(false);
        fetchBanners();
        setCurrentBanner({});
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Gagal menyimpan banner");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus banner ini?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/banners/${id}`, {
        method: "DELETE",
        headers: getAuthHeader() as HeadersInit,
      });

      if (response.ok) {
        toast.success("Banner berhasil dihapus");
        fetchBanners();
      } else {
        toast.error("Gagal menghapus banner");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan");
    }
  };

  const openAddDialog = () => {
    setIsEditing(false);
    setCurrentBanner({ is_active: true, sort_order: 0, type: activeTab });
    setIsDialogOpen(true);
  };

  const openEditDialog = (banner: Banner) => {
    setIsEditing(true);
    setCurrentBanner(banner);
    setIsDialogOpen(true);
  };

  return (
    <AdminLayout>
        <div className="p-6">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Manajemen Banner</h1>
            <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Banner
            </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
            <TabsList className="mb-4">
            <TabsTrigger value="main">Main Carousel</TabsTrigger>
            <TabsTrigger value="brand">Brand Pilihan</TabsTrigger>
            </TabsList>

            <div className="bg-white rounded-md border shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-[100px]">Preview</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead>Link Redirect</TableHead>
                    <TableHead>Urutan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                    <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                        Loading...
                    </TableCell>
                    </TableRow>
                ) : banners.length === 0 ? (
                    <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                        Belum ada banner di kategori ini.
                    </TableCell>
                    </TableRow>
                ) : (
                    banners.map((banner) => (
                    <TableRow key={banner.id}>
                        <TableCell>
                        <div className="relative w-16 h-10 bg-gray-100 rounded overflow-hidden">
                            <Image 
                                src={banner.image_url} 
                                alt={banner.title || "Banner"} 
                                fill 
                                className="object-cover"
                                unoptimized 
                            />
                        </div>
                        </TableCell>
                        <TableCell className="font-medium">{banner.title || "-"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                        {banner.redirect_url ? (
                            <a href={banner.redirect_url} target="_blank" className="flex items-center text-blue-600 hover:underline">
                            Link <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                        ) : "-"}
                        </TableCell>
                        <TableCell>{banner.sort_order}</TableCell>
                        <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${banner.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {banner.is_active ? "Aktif" : "Non-Aktif"}
                        </span>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(banner)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(banner.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        </TableCell>
                    </TableRow>
                    ))
                )}
                </TableBody>
            </Table>
            </div>
        </Tabs>

        {/* Dialog Form */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
            <DialogHeader>
                <DialogTitle>{isEditing ? "Edit Banner" : "Tambah Banner Baru"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image Input with Upload & Preview */}
                <div>
                <Label>Gambar Banner (Wajib)</Label>
                <div className="mt-2 space-y-3">
                    {/* Preview */}
                    {currentBanner.image_url && (
                        <div className="relative w-full h-32 bg-gray-100 rounded-md overflow-hidden border">
                            <Image 
                                src={currentBanner.image_url} 
                                alt="Preview" 
                                fill 
                                className="object-cover" 
                                unoptimized 
                            />
                        </div>
                    )}
                    {/* URL Input */}
                    <Input
                        placeholder="URL Gambar (atau upload di bawah)"
                        value={currentBanner.image_url || ""}
                        onChange={(e) => setCurrentBanner({ ...currentBanner, image_url: e.target.value })}
                    />
                    {/* File Upload Button */}
                {/* Drag and Drop Zone */}
                <div 
                    className={`flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6 text-center transition-colors cursor-pointer ${
                        uploading ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50 border-gray-300'
                    }`}
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            handleFileUpload({ target: { files: e.dataTransfer.files } } as any);
                        }
                    }}
                >
                    <input
                        type="file"
                        id="banner-upload"
                        className="hidden"
                        accept="image/*"
                        multiple // Allow multiple selection
                        onChange={handleFileUpload}
                        disabled={uploading}
                    />
                    <Label htmlFor="banner-upload" className="cursor-pointer w-full flex flex-col items-center">
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm font-medium text-gray-900">
                            {uploading ? "Mengupload..." : "Klik atau Drag Gambar ke sini"}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                            (Format: .jpg, .png, .webp)
                        </span>
                    </Label>
                </div>
                </div>
                </div>
                
                <div>
                <Label htmlFor="title">Judul (Opsional)</Label>
                <Input
                    id="title"
                    placeholder="Promo Spesial"
                    value={currentBanner.title || ""}
                    onChange={(e) => setCurrentBanner({ ...currentBanner, title: e.target.value })}
                />
                </div>

                <div>
                <Label htmlFor="redirect_url">Redirect URL (Opsional)</Label>
                <Input
                    id="redirect_url"
                    placeholder="/"
                    value={currentBanner.redirect_url || ""}
                    onChange={(e) => setCurrentBanner({ ...currentBanner, redirect_url: e.target.value })}
                />
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <Label htmlFor="sort_order">Urutan</Label>
                        <Input
                            id="sort_order"
                            type="number"
                            value={currentBanner.sort_order || 0}
                            onChange={(e) => setCurrentBanner({ ...currentBanner, sort_order: Number(e.target.value) })}
                        />
                    </div>
                    <div className="flex items-end pb-3">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={currentBanner.is_active ?? true}
                                onChange={(e) => setCurrentBanner({ ...currentBanner, is_active: e.target.checked })}
                            />
                            <span className="text-sm font-medium">Aktifkan Banner</span>
                        </label>
                    </div>
                </div>

                <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                </Button>
                <Button type="submit" disabled={!currentBanner.image_url || uploading}>
                    Simpan
                </Button>
                </DialogFooter>
            </form>
            </DialogContent>
        </Dialog>
        </div>
    </AdminLayout>
  );
}
