"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, AlertCircle, CheckCircle, Eye } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import SellerSidebar from "@/components/layouts/SellerSidebar";

interface StoreData {
  name: string;
  slug: string;
  description: string;
  business_phone: string;
  show_phone_number: boolean;
  profile_image_url: string | null;
  background_image_url: string | null;
  holiday_start_date: string;
  holiday_end_date: string;
}

interface AboutPageData {
  title: string;
  thumbnail: File | null;
  thumbnail_preview: string | null;
  content: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function SellerStoreSettingsView() {
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
    profile_image_url: null,
    background_image_url: null,
    holiday_start_date: "",
    holiday_end_date: "",
  });

  const [aboutPageData, setAboutPageData] = useState<AboutPageData>({
    title: "",
    thumbnail: null,
    thumbnail_preview: null,
    content: "",
  });

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(
    null
  );

  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

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

  // Fetch store data on mount
  useEffect(() => {
    const fetchStoreData = async () => {
      if (!isAuthenticated || user?.role !== "seller") return;

      const authToken = localStorage.getItem("auth_token");
      if (!authToken) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/sellers/stores/me`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStoreData({
            name: data.store.name || "",
            slug: data.store.slug || "",
            description: data.store.description || "",
            business_phone: data.store.business_phone || "",
            show_phone_number: data.store.show_phone_number || false,
            profile_image_url: data.store.profile_image_url || null,
            background_image_url: data.store.background_image_url || null,
            holiday_start_date: data.store.holiday_start_date || "",
            holiday_end_date: data.store.holiday_end_date || "",
          });

          if (data.store.profile_image_url) {
            setProfilePreview(data.store.profile_image_url);
          }
          if (data.store.background_image_url) {
            setBackgroundPreview(data.store.background_image_url);
          }
        }
      } catch (error) {
        console.error("Error fetching store data:", error);
      }
    };

    fetchStoreData();
  }, [isAuthenticated, user]);

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

  const handleAboutThumbnailChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setAboutPageData((prev) => ({
        ...prev,
        thumbnail: file,
        thumbnail_preview: URL.createObjectURL(file),
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const token = localStorage.getItem("auth_token");
      const formData = new FormData();

      // Add images if selected
      if (profileImage) {
        formData.append("profile_image", profileImage);
      }
      if (backgroundImage) {
        formData.append("background_image", backgroundImage);
      }

      // Add store data fields
      formData.append("name", storeData.name);
      formData.append("description", storeData.description);
      formData.append("business_phone", storeData.business_phone);
      formData.append(
        "show_phone_number",
        storeData.show_phone_number.toString()
      );
      formData.append("holiday_start_date", storeData.holiday_start_date);
      formData.append("holiday_end_date", storeData.holiday_end_date);

      const response = await fetch(`${API_BASE_URL}/api/sellers/stores/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Informasi toko berhasil diperbarui!");
        // Refresh data
        setTimeout(() => {
          window.location.reload();
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

  const handleSaveAboutPage = async () => {
    if (
      !aboutPageData.title ||
      !aboutPageData.thumbnail ||
      !aboutPageData.content
    ) {
      setError("Semua field halaman tentang toko wajib diisi");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("auth_token");
      const formData = new FormData();

      formData.append("title", aboutPageData.title);
      formData.append("thumbnail", aboutPageData.thumbnail);
      formData.append("content", aboutPageData.content);

      const response = await fetch(`${API_BASE_URL}/api/sellers/stores/about`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Halaman tentang toko berhasil disimpan!");
        setShowAboutDialog(false);
        // Reset form
        setAboutPageData({
          title: "",
          thumbnail: null,
          thumbnail_preview: null,
          content: "",
        });
      } else {
        setError(data.message || "Gagal menyimpan halaman tentang toko");
      }
    } catch (error) {
      console.error("Error saving about page:", error);
      setError("Terjadi kesalahan saat menyimpan halaman");
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
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">Pengaturan Toko</h1>
              <p className="text-gray-600">
                Kelola informasi toko dan halaman tentang toko Anda
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Store Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Toko</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Holiday Dates */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Tanggal Libur Toko</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Saat toko libur, pembeli akan tetap bisa memesan produkmu
                      namun kamu bisa memprosesnya setelah toko aktif kembali.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="holiday-start" className="block mb-2">
                          Tanggal Mulai Libur
                        </Label>
                        <Input
                          id="holiday-start"
                          type="date"
                          value={storeData.holiday_start_date}
                          onChange={(e) =>
                            setStoreData((prev) => ({
                              ...prev,
                              holiday_start_date: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="holiday-end" className="block mb-2">
                          Tanggal Selesai Libur
                        </Label>
                        <Input
                          id="holiday-end"
                          type="date"
                          value={storeData.holiday_end_date}
                          onChange={(e) =>
                            setStoreData((prev) => ({
                              ...prev,
                              holiday_end_date: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Images */}
                    <div className="space-y-6">
                      {/* Profile Image Upload */}
                      <div>
                        <Label htmlFor="profile-image" className="block mb-2">
                          Profil Toko
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

                      {/* Background Image Upload */}
                      <div>
                        <Label
                          htmlFor="background-image"
                          className="block mb-2"
                        >
                          Background Toko
                        </Label>
                        <div className="space-y-3">
                          <Input
                            id="background-image"
                            type="file"
                            accept="image/*"
                            onChange={handleBackgroundImageChange}
                          />
                          {backgroundPreview && (
                            <div className="w-full h-32 bg-gray-100 border rounded-lg overflow-hidden">
                              <Image
                                src={backgroundPreview}
                                alt="Background preview"
                                width={400}
                                height={128}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Text Fields */}
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="store-name" className="block mb-2">
                          Nama Toko
                        </Label>
                        <Input
                          id="store-name"
                          value={storeData.name}
                          onChange={(e) =>
                            setStoreData((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          placeholder="Nama toko Anda"
                          required
                        />
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
                          placeholder="08xxxxxxxxxx"
                          required
                        />
                      </div>

                      <div className="flex items-start space-x-2">
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
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded mt-1"
                        />
                        <div>
                          <Label
                            htmlFor="show-phone"
                            className="text-sm font-medium"
                          >
                            Tampilkan No. Telepon Usaha
                          </Label>
                          <p className="text-xs text-gray-500 mt-1">
                            Jika diaktifkan, pengguna dapat mengakses nomor
                            teleponmu melalui halaman detail produk (Khusus
                            produk classified)
                          </p>
                        </div>
                      </div>

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
                    </div>
                  </div>

                  <Separator />

                  {/* About Page Button */}
                  <div>
                    <Dialog
                      open={showAboutDialog}
                      onOpenChange={setShowAboutDialog}
                    >
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline">
                          Atur Halaman Tentang Toko
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Halaman Tentang Toko</DialogTitle>
                          <DialogDescription>
                            Buat konten menarik untuk memperkenalkan toko Anda
                            kepada pembeli
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                          {/* Title */}
                          <div>
                            <Label htmlFor="about-title" className="block mb-2">
                              Judul Konten{" "}
                              <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="about-title"
                              value={aboutPageData.title}
                              onChange={(e) =>
                                setAboutPageData((prev) => ({
                                  ...prev,
                                  title: e.target.value,
                                }))
                              }
                              placeholder="Contoh: Tentang Kami"
                              required
                            />
                          </div>

                          {/* Thumbnail */}
                          <div>
                            <Label
                              htmlFor="about-thumbnail"
                              className="block mb-2"
                            >
                              Thumbnail <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="about-thumbnail"
                              type="file"
                              accept="image/*"
                              onChange={handleAboutThumbnailChange}
                              required
                            />
                            {aboutPageData.thumbnail_preview && (
                              <div className="mt-3 w-full h-48 bg-gray-100 border rounded-lg overflow-hidden">
                                <Image
                                  src={aboutPageData.thumbnail_preview}
                                  alt="Thumbnail preview"
                                  width={400}
                                  height={192}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div>
                            <Label
                              htmlFor="about-content"
                              className="block mb-2"
                            >
                              Isi Konten <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                              id="about-content"
                              value={aboutPageData.content}
                              onChange={(e) =>
                                setAboutPageData((prev) => ({
                                  ...prev,
                                  content: e.target.value,
                                }))
                              }
                              placeholder="Tulis konten tentang toko Anda..."
                              rows={8}
                              required
                            />
                          </div>

                          {/* Preview Button */}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowPreviewDialog(true)}
                            className="w-full"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Lihat Preview
                          </Button>

                          {/* Action Buttons */}
                          <div className="flex gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowAboutDialog(false)}
                              className="flex-1"
                            >
                              Batalkan
                            </Button>
                            <Button
                              type="button"
                              onClick={handleSaveAboutPage}
                              disabled={loading}
                              className="flex-1"
                            >
                              {loading ? "Menyimpan..." : "Simpan"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
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
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/seller/dashboard")}
                >
                  Batalkan
                </Button>
                <Button type="submit" disabled={loading} className="px-8">
                  {loading ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Halaman Tentang Toko</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {/* Preview Content */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">
                {aboutPageData.title || "Judul Konten"}
              </h2>

              {aboutPageData.thumbnail_preview && (
                <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={aboutPageData.thumbnail_preview}
                    alt="Thumbnail"
                    width={800}
                    height={256}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">
                  {aboutPageData.content ||
                    "Isi konten akan ditampilkan di sini..."}
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button onClick={() => setShowPreviewDialog(false)}>
                Tutup Preview
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
