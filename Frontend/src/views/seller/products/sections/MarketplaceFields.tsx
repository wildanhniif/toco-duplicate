"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface MarketplaceFieldsProps {
  formData: any;
  setFormData: (data: any) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function MarketplaceFields({
  formData,
  setFormData,
}: MarketplaceFieldsProps) {
  // Variant state
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [variantType, setVariantType] = useState("");
  const [variantValues, setVariantValues] = useState("");
  const [uploadingVariantIndex, setUploadingVariantIndex] = useState<number | null>(null);

  const handleAddVariant = () => {
    if (!variantType || !variantValues) return;

    const values = variantValues
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v);
    
    // Default price to product price if set, else 0
    const defaultPrice = formData.price ? parseInt(formData.price) : 0;

    const newVariants = values.map((value) => ({
      variant_name: variantType,
      variant_value: value,
      stock: 0,
      price: defaultPrice,
      sku: "",
      image_url: "", // Inisialisasi gambar kosong
    }));

    setFormData((prev: any) => ({
      ...prev,
      variants: [...prev.variants, ...newVariants],
    }));

    setVariantType("");
    setVariantValues("");
  };

  const handleRemoveVariant = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      variants: prev.variants.filter((_: any, i: number) => i !== index),
    }));
  };

  const handleVariantImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVariantIndex(index);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("image", file); // Backend expects 'image' or 'images'

      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `${API_BASE_URL}/api/upload/image?type=products`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataUpload,
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Update variant at index with new image URL
        const newVariants = [...formData.variants];
        newVariants[index].image_url = data.url;
        setFormData((prev: any) => ({
          ...prev,
          variants: newVariants,
        }));
        toast.success("Gambar varian berhasil diupload");
      } else {
        console.error("Failed to upload image");
        toast.error("Gagal upload gambar varian");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Terjadi kesalahan saat upload gambar");
    } finally {
      setUploadingVariantIndex(null);
      e.target.value = ""; // Reset input
    }
  };

  const removeVariantImage = (index: number) => {
    const newVariants = [...formData.variants];
    newVariants[index].image_url = "";
    setFormData((prev: any) => ({
      ...prev,
      variants: newVariants,
    }));
  };

  const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
    isFloat = false
  ) => {
    const val = e.target.value;
    
    // Allow empty string to let user delete content
    if (val === "") {
      setFormData((prev: any) => ({ ...prev, [field]: "" }));
      return;
    }
    
    // Parse and validate the number
    const num = isFloat ? parseFloat(val) : parseInt(val);
    
    // Prevent negative values - don't update state at all
    if (isNaN(num) || num < 0) {
      e.preventDefault();
      return;
    }
    
    // Only update if valid positive number or zero
    setFormData((prev: any) => ({ ...prev, [field]: val }));
  };

  return (
    <div className="space-y-6">
      {/* Pasarkan Produk */}
      <div>
        <Label className="block mb-2">
          Pasarkan Produk <span className="text-red-500">*</span>
        </Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="product_type"
              value="marketplace"
              checked={formData.product_type === "marketplace"}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  product_type: e.target.value,
                }))
              }
              className="w-4 h-4"
            />
            <span>Toco Marketplace</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="product_type"
              value="classified"
              checked={formData.product_type === "classified"}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  product_type: e.target.value,
                }))
              }
              className="w-4 h-4"
            />
            <span>Toco Classified</span>
          </label>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {formData.product_type === "marketplace"
            ? "Transaksi melalui platform Toco"
            : "Media promosi, transaksi di luar platform"}
        </p>
      </div>

      {/* Varian Produk */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Varian Produk (Opsional)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowVariantForm(!showVariantForm)}
          >
            {showVariantForm ? "Tutup" : "Tambah Varian"}
          </Button>
        </div>

        {showVariantForm && (
          <div className="border rounded-lg p-4 mb-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="variantType">Tipe Varian</Label>
                <Input
                  id="variantType"
                  value={variantType}
                  onChange={(e) => setVariantType(e.target.value)}
                  placeholder="Contoh: Size, Color"
                  list="variant-types"
                />
                <datalist id="variant-types">
                  <option value="Size" />
                  <option value="Color" />
                  <option value="Material" />
                </datalist>
              </div>
              <div>
                <Label htmlFor="variantValues">
                  Nilai Varian (pisahkan dengan koma)
                </Label>
                <Input
                  id="variantValues"
                  value={variantValues}
                  onChange={(e) => setVariantValues(e.target.value)}
                  placeholder="Contoh: S, M, L, XL"
                />
              </div>
            </div>
            <Button type="button" onClick={handleAddVariant} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Varian
            </Button>
          </div>
        )}

        {formData.variants.length > 0 && (
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 mb-2 px-3 text-sm font-medium text-gray-500">
              <div className="col-span-3">Varian</div>
              <div className="col-span-2 text-center">Gambar</div>
              <div className="col-span-3">Harga</div>
              <div className="col-span-3">Stok</div>
              <div className="col-span-1"></div>
            </div>

            {formData.variants.map((variant: any, index: number) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 items-center p-3 border rounded-lg bg-white"
              >
                <div className="col-span-3 flex-1 overflow-hidden">
                  <span className="font-medium text-gray-900 block truncate">{variant.variant_name}:</span>
                  <span className="text-gray-600 block truncate">{variant.variant_value}</span>
                </div>

                <div className="col-span-2 flex justify-center">
                  <div className="relative h-10 w-10">
                    {variant.image_url ? (
                        <div className="group relative h-full w-full">
                           <img 
                              src={variant.image_url} 
                              alt="Variant" 
                              className="h-10 w-10 object-cover rounded-md border"
                           />
                           <button
                             type="button"
                             onClick={() => removeVariantImage(index)}
                             className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                              <X className="w-3 h-3" />
                           </button>
                        </div>
                    ) : (
                        <label className="cursor-pointer flex items-center justify-center h-10 w-10 bg-gray-100 rounded-md border border-dashed border-gray-300 hover:bg-gray-200">
                             {uploadingVariantIndex === index ? (
                                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                             ) : (
                                <ImageIcon className="w-4 h-4 text-gray-400" />
                             )}
                             <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handleVariantImageUpload(e, index)}
                                disabled={uploadingVariantIndex !== null}
                             />
                        </label>
                    )}
                  </div>
                </div>
                
                <div className="col-span-3">
                   <Input
                    type="number"
                    placeholder="Harga"
                    min="0"
                    step="1000"
                    value={variant.price}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                         // Logic deletion handled elsewhere or allowed empty
                         const newVariants = [...formData.variants];
                         newVariants[index].price = "";
                         setFormData((prev: any) => ({...prev, variants: newVariants}));
                         return;
                      }
                      const numVal = parseInt(val);
                      if (isNaN(numVal) || numVal < 0) { e.preventDefault(); return; }
                      
                      const newVariants = [...formData.variants];
                      newVariants[index].price = numVal;
                      setFormData((prev: any) => ({ ...prev, variants: newVariants }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e') e.preventDefault();
                    }}
                    className="h-9"
                  />
                </div>

                <div className="col-span-3">
                   <Input
                    type="number"
                    placeholder="Stok"
                    min="0"
                    value={variant.stock}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                         const newVariants = [...formData.variants];
                         newVariants[index].stock = "";
                         setFormData((prev: any) => ({...prev, variants: newVariants}));
                         return;
                      }
                      const numVal = parseInt(val);
                      if (isNaN(numVal) || numVal < 0) { e.preventDefault(); return; }

                      const newVariants = [...formData.variants];
                      newVariants[index].stock = numVal;
                      setFormData((prev: any) => ({ ...prev, variants: newVariants }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e') e.preventDefault();
                    }}
                    className="h-9"
                  />
                </div>

                <div className="col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 text-red-500 hover:bg-red-50"
                    onClick={() => handleRemoveVariant(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Harga & Diskon */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price" className="block mb-2">
            Harga Produk <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              Rp
            </span>
            <Input
              id="price"
              type="number"
              min="0"
              value={formData.price}
              onChange={(e) => handleNumberInput(e, "price")}
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e') e.preventDefault();
              }}
              placeholder="0"
              className="pl-10"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="discount" className="block mb-2">
            Diskon (%)
          </Label>
          <Input
            id="discount"
            type="number"
            min="0"
            max="100"
            value={formData.discount_percentage}
            onChange={(e) => handleNumberInput(e, "discount_percentage")}
            onKeyDown={(e) => {
              if (e.key === '-' || e.key === 'e') e.preventDefault();
            }}
            placeholder="0"
          />
        </div>
      </div>

      {/* Stok & SKU */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="stock" className="block mb-2">
            Stok Produk <span className="text-red-500">*</span>
          </Label>
          <Input
            id="stock"
            type="number"
            min="0"
            value={formData.stock_quantity}
            onChange={(e) => handleNumberInput(e, "stock_quantity")}
            onKeyDown={(e) => {
              if (e.key === '-' || e.key === 'e') e.preventDefault();
            }}
            placeholder="0"
            required
            disabled={formData.variants.length > 0}
          />
          {formData.variants.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">Stok diatur per varian</p>
          )}
        </div>

        <div>
          <Label htmlFor="sku" className="block mb-2">
            SKU
          </Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) =>
              setFormData((prev: any) => ({ ...prev, sku: e.target.value }))
            }
            placeholder="Contoh: PRD-001"
          />
        </div>
      </div>

      {/* Kondisi & Brand */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="condition" className="block mb-2">
            Kondisi Produk <span className="text-red-500">*</span>
          </Label>
          <select
            id="condition"
            value={formData.condition}
            onChange={(e) =>
              setFormData((prev: any) => ({
                ...prev,
                condition: e.target.value,
              }))
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            required
          >
            <option value="new">Baru</option>
            <option value="used">Bekas</option>
          </select>
        </div>

        <div>
          <Label htmlFor="brand" className="block mb-2">
            Brand
          </Label>
          <Input
            id="brand"
            value={formData.brand}
            onChange={(e) =>
              setFormData((prev: any) => ({ ...prev, brand: e.target.value }))
            }
            placeholder="Contoh: Nike, Adidas"
          />
        </div>
      </div>
    </div>
  );
}
