"use client";

import { useState, useEffect } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Upload, MapPin } from "lucide-react";
import Image from "next/image";
import LocationPickerModal from "@/components/composites/LocationPicker/LocationPickerModal";
import { useAuth } from "@/hooks/useAuth";
import SellerSidebar from "@/components/layouts/SellerSidebar";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle } from "lucide-react";

interface StoreData {
  name: string;
  slug: string;
  description: string;
  business_phone: string;
  show_phone_number: boolean;
  address_line: string;
  postal_code: string;
  province: string;
  city: string;
  district: string;
  subdistrict: string;
  province_id: string;
  city_id: string;
  district_id: string;
  subdistrict_id: string;
  latitude: string;
  longitude: string;
  use_cloudflare: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function SellerStoreSetupView() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [storeData, setStoreData] = useState<StoreData>({
    name: "",
    slug: "",
    description: "",
    business_phone: "",
    show_phone_number: false,
    address_line: "",
    postal_code: "",
    province: "",
    city: "",
    district: "",
    subdistrict: "",
    province_id: "",
    city_id: "",
    district_id: "",
    subdistrict_id: "",
    latitude: "",
    longitude: "",
    use_cloudflare: false,
  });

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(
    null
  );

  const [backgroundTemplates] = useState([
    "/store-bg-template-1.jpg",
    "/store-bg-template-2.jpg",
    "/store-bg-template-3.jpg",
    "/store-bg-template-4.jpg",
  ]);

  // Check authentication
  useEffect(() => {
    // Wait for auth state to be loaded
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user?.role !== "seller") {
      router.push("/");
      return;
    }
  }, [user, isAuthenticated, isLoading, router]);

  // Auto-generate slug from store name
  const handleNameChange = (value: string) => {
    setStoreData((prev) => ({
      ...prev,
      name: value,
      slug: value
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, ""),
    }));
  };

  // Handle image uploads
  const handleProfileImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const preview = URL.createObjectURL(file);
      setProfilePreview(preview);
    }
  };

  const handleBackgroundImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setBackgroundImage(file);
      const preview = URL.createObjectURL(file);
      setBackgroundPreview(preview);
    }
  };

  // Handle template selection
  const selectBackgroundTemplate = (templateUrl: string) => {
    setBackgroundPreview(templateUrl);
    setBackgroundImage(null); // Clear custom upload
  };

  // Handle location selection
  const handleLocationSelect = (locationData: {
    address_line: string;
    postal_code: string;
    province: string;
    city: string;
    district: string;
    subdistrict: string;
    province_id: string;
    city_id: string;
    district_id: string;
    subdistrict_id: string;
    latitude: string;
    longitude: string;
  }) => {
    setStoreData((prev) => ({
      ...prev,
      address_line: locationData.address_line,
      postal_code: locationData.postal_code,
      province: locationData.province,
      city: locationData.city,
      district: locationData.district,
      subdistrict: locationData.subdistrict,
      province_id: locationData.province_id,
      city_id: locationData.city_id,
      district_id: locationData.district_id,
      subdistrict_id: locationData.subdistrict_id,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
    }));
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const token = localStorage.getItem("auth_token");

      // Create FormData for file uploads
      const formData = new FormData();

      // Add images if selected
      if (profileImage) {
        formData.append("profile_image", profileImage);
      }
      if (backgroundImage) {
        formData.append("background_image", backgroundImage);
      }

      // Add all store data fields
      Object.keys(storeData).forEach((key) => {
        const value = storeData[key as keyof StoreData];
        formData.append(
          key,
          typeof value === "boolean" ? value.toString() : value
        );
      });

      const response = await fetch(`${API_BASE_URL}/api/sellers/stores/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Informasi toko berhasil disimpan!");
        setTimeout(() => {
          router.push("/seller/dashboard");
        }, 2000);
      } else {
        setError(data.message || "Gagal menyimpan informasi toko");
      }
    } catch (error) {
      console.error("Error updating store:", error);
      setError("Terjadi kesalahan saat menyimpan informasi toko");
    } finally {
      setLoading(false);
    }
  };

  // Show loading while auth state is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  // Redirect is happening in useEffect if not authenticated
  if (!isAuthenticated || user?.role !== "seller") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <SellerSidebar />

        {/* Main Content */}
        <div className="flex-1 ml-64 p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">Setup Informasi Toko</h1>
              <p className="text-gray-600">
                Lengkapi informasi toko Anda untuk mulai berjualan
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Store Profile Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Profil Toko
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Image Upload */}
                  <div>
                    <Label htmlFor="profile-image" className="block mb-2">
                      Upload Gambar Profil Toko
                    </Label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-gray-100 border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden">
                        {profilePreview ? (
                          <Image
                            src={profilePreview}
                            alt="Profile preview"
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Upload className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <Input
                        id="profile-image"
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageChange}
                        className="max-w-xs"
                      />
                    </div>
                  </div>

                  {/* Background Image/Template Selection */}
                  <div>
                    <Label className="block mb-2">Background Toko</Label>
                    <p className="text-sm text-gray-600 mb-4">
                      Pilih gambar sendiri atau gunakan template yang tersedia
                    </p>

                    {/* Custom Upload */}
                    <div className="mb-4">
                      <Label
                        htmlFor="background-image"
                        className="block mb-2 text-sm"
                      >
                        Upload Gambar Sendiri
                      </Label>
                      <Input
                        id="background-image"
                        type="file"
                        accept="image/*"
                        onChange={handleBackgroundImageChange}
                        className="max-w-xs"
                      />
                    </div>

                    {/* Template Selection */}
                    <div>
                      <Label className="block mb-2 text-sm">
                        Atau Pilih Template
                      </Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {backgroundTemplates.map((template, index) => (
                          <div
                            key={index}
                            className={`w-full h-24 bg-gray-100 border-2 rounded-lg cursor-pointer overflow-hidden ${
                              backgroundPreview === template
                                ? "border-blue-500"
                                : "border-dashed border-gray-300"
                            }`}
                            onClick={() => selectBackgroundTemplate(template)}
                          >
                            <div className="w-full h-full bg-linear-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                              <span className="text-white text-xs">
                                Template {index + 1}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Background Preview */}
                    {backgroundPreview && (
                      <div className="mt-4">
                        <Label className="block mb-2 text-sm">
                          Preview Background
                        </Label>
                        <div className="w-full h-32 bg-gray-100 border rounded-lg overflow-hidden">
                          {backgroundImage ? (
                            <Image
                              src={backgroundPreview}
                              alt="Background preview"
                              width={400}
                              height={128}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-linear-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                              <span className="text-white">
                                Template Dipilih
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Store Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Toko</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="store-name" className="block mb-2">
                      Nama Toko
                    </Label>
                    <Input
                      id="store-name"
                      value={storeData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Masukkan nama toko Anda"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="store-url" className="block mb-2">
                      Link URL Toko
                    </Label>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <span className="text-gray-600 text-sm">
                        http://localhost:3000/store/
                      </span>
                      <span className="font-mono text-sm font-medium text-blue-600">
                        {storeData.slug || "nama-toko"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <span className="inline-block w-1 h-1 bg-blue-500 rounded-full"></span>
                      URL ini otomatis dibuat dari nama toko dan tidak dapat
                      diubah
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="business-phone" className="block mb-2">
                      Nomor Telepon Usaha
                    </Label>
                    <Input
                      id="business-phone"
                      type="tel"
                      value={storeData.business_phone}
                      onChange={(e) =>
                        setStoreData((prev) => ({
                          ...prev,
                          business_phone: e.target.value,
                        }))
                      }
                      placeholder="Masukkan nomor telepon usaha"
                      required
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="show-phone"
                      checked={storeData.show_phone_number}
                      onChange={(e) =>
                        setStoreData((prev) => ({
                          ...prev,
                          show_phone_number: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                    <Label htmlFor="show-phone" className="text-sm">
                      Tampilkan nomor telepon usaha
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500">
                    Jika diaktifkan, pengguna dapat mengakses nomor teleponmu
                    melalui halaman detail produk (Khusus produk classified)
                  </p>

                  <div>
                    <Label htmlFor="description" className="block mb-2">
                      Deskripsi Toko
                    </Label>
                    <Textarea
                      id="description"
                      value={storeData.description}
                      onChange={(e) =>
                        setStoreData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Ceritakan tentang toko Anda..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Location Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Lokasi Toko
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <LocationPickerModal
                    onLocationSelect={handleLocationSelect}
                    currentLocation={storeData}
                  />

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="address" className="block mb-2">
                        Detail Alamat
                      </Label>
                      <Textarea
                        id="address"
                        value={storeData.address_line}
                        onChange={(e) =>
                          setStoreData((prev) => ({
                            ...prev,
                            address_line: e.target.value,
                          }))
                        }
                        placeholder="Masukkan alamat lengkap"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="postal-code" className="block mb-2">
                        Kode Pos
                      </Label>
                      <Input
                        id="postal-code"
                        value={storeData.postal_code}
                        onChange={(e) =>
                          setStoreData((prev) => ({
                            ...prev,
                            postal_code: e.target.value,
                          }))
                        }
                        placeholder="Contoh: 12345"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="province" className="block mb-2">
                        Provinsi
                      </Label>
                      <Input
                        id="province"
                        value={storeData.province}
                        onChange={(e) =>
                          setStoreData((prev) => ({
                            ...prev,
                            province: e.target.value,
                          }))
                        }
                        placeholder="Pilih provinsi"
                        readOnly
                        autoComplete="off"
                      />
                    </div>

                    <div>
                      <Label htmlFor="city" className="block mb-2">
                        Kota/Kabupaten
                      </Label>
                      <Input
                        id="city"
                        value={storeData.city}
                        onChange={(e) =>
                          setStoreData((prev) => ({
                            ...prev,
                            city: e.target.value,
                          }))
                        }
                        placeholder="Pilih kota/kabupaten"
                        readOnly
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="district" className="block mb-2">
                        Kecamatan
                      </Label>
                      <Input
                        id="district"
                        value={storeData.district}
                        onChange={(e) =>
                          setStoreData((prev) => ({
                            ...prev,
                            district: e.target.value,
                          }))
                        }
                        placeholder="Pilih kecamatan"
                        readOnly
                        autoComplete="off"
                      />
                    </div>

                    <div>
                      <Label htmlFor="subdistrict" className="block mb-2">
                        Kelurahan
                      </Label>
                      <Input
                        id="subdistrict"
                        value={storeData.subdistrict}
                        onChange={(e) =>
                          setStoreData((prev) => ({
                            ...prev,
                            subdistrict: e.target.value,
                          }))
                        }
                        placeholder="Pilih kelurahan"
                        readOnly
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    Catatan: Provinsi, Kota, Kecamatan, dan Kelurahan otomatis
                    terisi setelah kamu memilih lokasi lewat tombol
                    <span className="font-semibold"> Pilih Lokasi </span>
                    di atas.
                  </p>
                </CardContent>
              </Card>

              {/* Additional Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Pengaturan Tambahan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="use-cloudflare"
                      checked={storeData.use_cloudflare}
                      onChange={(e) =>
                        setStoreData((prev) => ({
                          ...prev,
                          use_cloudflare: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                    <Label htmlFor="use-cloudflare" className="text-sm">
                      Gunakan Cloudflare untuk optimasi gambar
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Error/Success Messages */}
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-700">{success}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="px-8">
                  {loading ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
