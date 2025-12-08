"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Loader2 } from "lucide-react";
import CategoryAutocomplete from "@/components/composites/CategoryAutocomplete";
import { useState } from "react";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface BasicInfoSectionProps {
  formData: any;
  setFormData: (data: any) => void;
  categories: any[];
  onCategoryChange: (categoryId: string) => void;
}

export default function BasicInfoSection({
  formData,
  setFormData,
  categories,
  onCategoryChange,
}: BasicInfoSectionProps) {
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      // Upload each file to backend
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("image", file);

        const token = localStorage.getItem("auth_token");
        const response = await fetch(
          `${API_BASE_URL}/api/upload/image?type=products`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (response.ok) {
          const data = await response.json();
          uploadedUrls.push(data.url);
        } else {
          console.error("Failed to upload image:", file.name);
        }
      }

      // Add uploaded URLs to form data
      if (uploadedUrls.length > 0) {
        setFormData((prev: any) => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls],
        }));
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Gagal upload gambar. Silakan coba lagi.");
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      images: prev.images.filter((_: any, i: number) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Foto Produk */}
      <div>
        <Label className="block mb-2">
          Foto Produk <span className="text-red-500">*</span>
        </Label>
        <p className="text-sm text-gray-500 mb-4">
          Upload minimal 1 foto, maksimal 10 foto. Format: JPG, PNG. Max 5MB per
          foto.
        </p>

        <div className="grid grid-cols-5 gap-4">
          {/* Existing images */}
          {formData.images.map((img: string, index: number) => (
            <div
              key={index}
              className="relative aspect-square border rounded-lg overflow-hidden"
            >
              <img
                src={img}
                alt={`Product ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
              {index === 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-green-500 text-white text-xs text-center py-1">
                  Foto Utama
                </div>
              )}
            </div>
          ))}

          {/* Upload button */}
          {formData.images.length < 10 && (
            <label
              className={`aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center ${
                uploading
                  ? "bg-gray-100 cursor-not-allowed"
                  : "cursor-pointer hover:bg-gray-50"
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-8 w-8 text-blue-500 mb-2 animate-spin" />
                  <span className="text-sm text-blue-600">Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Upload Foto</span>
                </>
              )}
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          )}
        </div>
      </div>

      {/* Nama Produk */}
      <div>
        <Label htmlFor="name" className="block mb-2">
          Nama Produk <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev: any) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Contoh: Kaos Polos Premium Cotton"
          maxLength={255}
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.name.length}/255 karakter
        </p>
      </div>

      {/* Deskripsi */}
      <div>
        <Label htmlFor="description" className="block mb-2">
          Deskripsi Produk <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev: any) => ({
              ...prev,
              description: e.target.value,
            }))
          }
          placeholder="Jelaskan detail produk Anda..."
          rows={6}
          required
        />
      </div>

      {/* Kategori */}
      <CategoryAutocomplete
        categories={categories}
        value={formData.category_id}
        onSelect={(categoryId, category) => {
          onCategoryChange(categoryId);
        }}
        placeholder="Ketik untuk mencari kategori, contoh: sabun, elektronik, baju"
        required
      />
    </div>
  );
}
