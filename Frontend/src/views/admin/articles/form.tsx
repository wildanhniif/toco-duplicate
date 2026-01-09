"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Upload, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ArticleFormProps {
  articleId?: string; // If present, edit mode
}

export default function ArticleForm({ articleId }: ArticleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category: "Berita",
    summary: "",
    content: "",
    image_url: "",
    is_published: 1,
  });

  useEffect(() => {
    if (articleId) {
      const fetchArticle = async () => {
        try {
          const token = localStorage.getItem("auth_token");
          const res = await fetch(`${API_BASE_URL}/api/articles/manage/${articleId}`, {
             headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setFormData({
               title: data.title,
               slug: data.slug,
               category: data.category || "Berita",
               summary: data.summary || "",
               content: data.content,
               image_url: data.image_url || "",
               is_published: data.is_published,
            });
          }
        } catch (error) {
           console.error("Error fetching article:", error);
           toast.error("Gagal memuat artikel");
        }
      };
      
      fetchArticle();
    }
  }, [articleId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const token = localStorage.getItem("auth_token");
      
      const res = await fetch(`${API_BASE_URL}/api/upload/image?type=articles`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });

      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, image_url: data.url }));
        toast.success("Gambar berhasil diupload");
      } else {
        toast.error("Gagal upload gambar");
      }
    } catch (e) {
      toast.error("Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("auth_token");
      const url = articleId 
        ? `${API_BASE_URL}/api/articles/${articleId}`
        : `${API_BASE_URL}/api/articles`;
      
      const method = articleId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success(articleId ? "Artikel diperbarui" : "Artikel dibuat");
        router.push("/admin/articles");
      } else {
        const data = await res.json();
        toast.error(data.message || "Gagal menyimpan artikel");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Button variant="ghost" className="mb-6 pl-0" onClick={() => router.push("/admin/articles")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
      </Button>

      <h1 className="text-2xl font-bold mb-6">{articleId ? "Edit Artikel" : "Buat Artikel Baru"}</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border shadow-sm">
        
        {/* Title */}
        <div className="space-y-2">
          <Label>Judul Artikel</Label>
          <Input 
            name="title" 
            value={formData.title} 
            onChange={handleChange} 
            placeholder="Masukkan judul artikel..."
            required 
          />
        </div>

        {/* Categories */}
        <div className="space-y-2">
            <Label>Kategori</Label>
            <select 
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 bg-white"
            >
                <option value="Berita">Berita</option>
                <option value="Tips & Trik">Tips & Trik</option>
                <option value="Edukasi">Edukasi</option>
                <option value="Promo">Promo</option>
                <option value="Kisah Sukses">Kisah Sukses</option>
            </select>
        </div>

        {/* Summary */}
        <div className="space-y-2">
           <Label>Ringkasan (Summary)</Label>
           <Textarea 
             name="summary" 
             value={formData.summary} 
             onChange={handleChange} 
             placeholder="Ringkasan singkat untuk kartu artikel..."
             rows={2}
           />
        </div>

        {/* Content */}
        <div className="space-y-2">
           <Label>Konten Lengkap</Label>
           <Textarea 
             name="content" 
             value={formData.content} 
             onChange={handleChange} 
             placeholder="Tulis konten artikel di sini..."
             rows={12}
             className="font-mono text-sm"
             required
           />
           <p className="text-xs text-gray-400">Support Markdown / HTML basic.</p>
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
             <Label>Gambar Cover</Label>
             <div className="flex items-center gap-4">
                 {formData.image_url && (
                    <div className="relative w-32 h-20 rounded-lg overflow-hidden border">
                        <img src={formData.image_url} alt="Cover" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setFormData(p => ({...p, image_url: ''}))} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full">
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                 )}
                 <label className="cursor-pointer flex items-center justify-center w-32 h-20 bg-gray-50 border border-dashed border-gray-300 rounded-lg hover:bg-gray-100">
                     {uploading ? (
                        <Loader2 className="animate-spin text-gray-500" />
                     ) : (
                        <div className="text-gray-500 flex flex-col items-center text-xs">
                           <Upload className="w-5 h-5 mb-1" />
                           Upload
                        </div>
                     )}
                     <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                 </label>
             </div>
        </div>

        <div className="flex justify-end pt-4">
             <Button type="submit" disabled={loading || uploading}>
                {loading ? "Menyimpan..." : "Simpan Artikel"}
             </Button>
        </div>

      </form>
    </div>
  );
}
