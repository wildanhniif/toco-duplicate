"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Article {
  id: number;
  title: string;
  category: string;
  author_name: string;
  created_at: string;
  is_published: number;
  image_url: string;
}

export default function AdminArticleList() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArticles = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE_URL}/api/articles?limit=100`, {
         headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setArticles(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
      toast.error("Gagal memuat artikel");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus artikel ini?")) return;

    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE_URL}/api/articles/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success("Artikel berhasil dihapus");
        fetchArticles();
      } else {
        toast.error("Gagal menghapus artikel");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manajemen Artikel</h1>
        <Button onClick={() => router.push("/admin/articles/create")}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Artikel
        </Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700 font-medium border-b">
            <tr>
              <th className="px-6 py-3">Judul</th>
              <th className="px-6 py-3">Kategori</th>
              <th className="px-6 py-3">Penulis</th>
              <th className="px-6 py-3">Tanggal</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr key="loading-row">
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Memuat artikel...
                </td>
              </tr>
            ) : articles.length === 0 ? (
              <tr key="empty-row">
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Belum ada artikel.
                </td>
              </tr>
            ) : (
              articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900 max-w-xs truncate">
                    {article.title}
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-block px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-full">
                      {article.category}
                    </span>
                  </td>
                  <td className="px-6 py-3">{article.author_name}</td>
                  <td className="px-6 py-3 text-gray-500">
                    {format(new Date(article.created_at), "dd MMM yyyy", { locale: id })}
                  </td>
                  <td className="px-6 py-3">
                    {article.is_published ? (
                        <span className="text-green-600 font-medium text-xs">Published</span>
                    ) : (
                        <span className="text-gray-500 font-medium text-xs">Draft</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/articles/${article.id}`)} // Or slug if possible, but route uses slug
                      title="Lihat"
                    >
                      <Eye className="w-4 h-4 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/admin/articles/${article.id}/edit`)}
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(article.id)}
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
