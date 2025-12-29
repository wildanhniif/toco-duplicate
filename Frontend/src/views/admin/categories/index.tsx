"use client";

import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Edit, Plus, FolderTree } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Category {
  category_id: number;
  name: string;
  parent_id: number | null;
  slug: string;
  children?: Category[]; // For tree structure if processed
}

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("null");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/tree`); // Assuming tree endpoint exists or fallback to all
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
        
        // Also fetch flat list for parent selection
        const flatRes = await fetch(`${API_BASE_URL}/api/categories`);
        if (flatRes.ok) setFlatCategories(await flatRes.json());
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("Nama kategori wajib diisi");
      return;
    }

    const payload = {
      name,
      parent_id: parentId === "null" ? null : parseInt(parentId),
    };

    try {
      const token = localStorage.getItem("auth_token");
      const url = editId
        ? `${API_BASE_URL}/api/categories/${editId}`
        : `${API_BASE_URL}/api/categories`;
      
      const method = editId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // If secured, though categories might be public read / admin write
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(editId ? "Kategori diperbarui" : "Kategori dibuat");
        setIsDialogOpen(false);
        resetForm();
        fetchCategories();
      } else {
        const err = await response.json();
        toast.error(err.message || "Gagal menyimpan kategori");
      }
    } catch (e) {
      toast.error("Error sistem");
    }
  };

  const resetForm = () => {
    setEditId(null);
    setName("");
    setParentId("null");
  };

  const openEdit = (cat: Category) => {
    setEditId(cat.category_id);
    setName(cat.name);
    setParentId(cat.parent_id?.toString() || "null");
    setIsDialogOpen(true);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = (categories: Category[]): Category[] => {
    // Flatten approach serves better for search/pagination usually, 
    // but preserving tree structure with search is complex.
    // User asked for search & pagination.
    // If searching, we flatted results. If not, we show tree?
    // Let's stick to flat search if query exists, or tree if not?
    // User requirement: "admin kategori pake pagination terus ada search bar nya"
    
    // Simplest approach: Flatten everything for the table view to support easy pagination and search
    let filtered = flatCategories;
    
    if (searchQuery) {
      filtered = filtered.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    return filtered;
  };

  const getPaginatedData = () => {
     const filtered = filteredCategories(flatCategories);
     // If we are showing tree structure (no search), we might want to paginate at root level?
     // Complex. Let's switch to a flat list view for easier management as requested, 
     // or paginate the ROOT nodes only? 
     // Given "pagination + search", a flat list is usually expected.
     // However, `renderRows` was designed for tree. 
     // I'll implement a flat view when searching, and maybe tree view when not?
     // Actually, let's keep it simple: Search filters the flat list. Pagination pages the flat list.
     // If using tree, pagination is weird. 
     // Let's use the FlatCategories for the table display to support standard pagination.
     
     const start = (currentPage - 1) * itemsPerPage;
     return filtered.slice(start, start + itemsPerPage);
  }
  
  const totalPages = Math.ceil(filteredCategories(flatCategories).length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manajemen Kategori</h1>
        <Dialog open={isDialogOpen} onOpenChange={(v) => { setIsDialogOpen(v); if(!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Kategori
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Kategori" : "Tambah Kategori Baru"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label>Nama Kategori</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Elektronik" />
              </div>
              <div>
                <Label>Parent Kategori (Opsional)</Label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Induk..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">-- Root (Kategori Utama) --</SelectItem>
                    {flatCategories
                        .filter(c => c.category_id !== editId) // Prevent selecting self as parent
                        .map((c) => (
                      <SelectItem key={c.category_id} value={c.category_id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Simpan</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4">
        <Input 
            placeholder="Cari kategori..." 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="max-w-sm"
        />
      </div>

      <div className="bg-white rounded-lg border shadow-sm mb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[400px]">Nama Kategori</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : getPaginatedData().length === 0 ? (
                 <TableRow><TableCell colSpan={4} className="text-center py-8">Tidak ada kategori ditemukan.</TableCell></TableRow>
            ) : (
                getPaginatedData().map((cat) => {
                    const parent = flatCategories.find(p => p.category_id === cat.parent_id);
                    return (
                        <TableRow key={cat.category_id}>
                          <TableCell className="font-medium">{cat.name}</TableCell>
                          <TableCell>{cat.slug}</TableCell>
                          <TableCell>{parent ? parent.name : "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                    );
                })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span className="text-sm font-medium">Page {currentPage} of {totalPages || 1}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </AdminLayout>
  );
}
