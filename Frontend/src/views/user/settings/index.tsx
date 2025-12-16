"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, User, Lock, Bell, Shield } from "lucide-react";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Removed Navbar and Footer imports
// import Navbar from "@/components/composites/Navbar"; 
// import Footer from "@/components/layouts/Footer";

// Extend user type locally if needed until useAuth is fully synced across files
interface ExtendedUser {
  user_id: number;
  name: string;
  role: "customer" | "seller" | "admin";
  email?: string;
  phone_number?: string;
  google_id?: string;
}

export default function UserSettingsView() {
  const { user: authUser, logout } = useAuth();
  const user = authUser as unknown as ExtendedUser; // Cast to access new fields
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const isGoogleLogin = !!user.google_id;

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Password baru tidak cocok");
      return;
    }
    // Simulate API call
    toast.success("Password berhasil diubah (Simulasi)");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar handled by layout */}
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl pt-32">
        <div className="mb-6">
           <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Pengaturan Akun</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4 pl-0 hover:pl-2 transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan Akun</h1>
          <p className="text-gray-600">Kelola informasi profil dan keamanan akun Anda</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-0">
                <div className="flex flex-col">
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-4 ${
                      activeTab === "profile"
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-transparent text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Profil Saya
                  </button>
                  {!isGoogleLogin && (
                    <button
                      onClick={() => setActiveTab("security")}
                      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-4 ${
                        activeTab === "security"
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : "border-transparent text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                      Keamanan
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab("notifications")}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-4 ${
                      activeTab === "notifications"
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-transparent text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                    Notifikasi
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Area */}
          <div className="md:col-span-3">
            {activeTab === "profile" && (
              <Card>
                <CardHeader>
                  <CardTitle>Profil Saya</CardTitle>
                  <CardDescription>Kelola informasi akun Anda</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-orange-500 text-white text-xl">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                    {!isGoogleLogin && (
                      <div>
                        <Button variant="outline" size="sm">Ubah Foto</Button>
                        <p className="text-xs text-gray-500 mt-2">
                          Format gambar: .jpg, .jpeg, .png (Maks. 2MB)
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nama Lengkap</Label>
                      <Input id="name" defaultValue={user.name} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" defaultValue={user.email || ""} disabled className="bg-gray-100" />
                      <p className="text-xs text-gray-500">Email tidak dapat diubah (Login dengan {isGoogleLogin ? "Google" : "Email"})</p>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Nomor Telepon</Label>
                      <Input id="phone" defaultValue={user.phone_number || ""} placeholder="Belum diatur" />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => toast.success("Profil berhasil disimpan (Simulasi)")}>
                      Simpan Perubahan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "security" && (
              <Card>
                <CardHeader>
                  <CardTitle>Keamanan</CardTitle>
                  <CardDescription>Ubah kata sandi dan pengaturan keamanan lainnya</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="current-password">Kata Sandi Saat Ini</Label>
                      <Input 
                        id="current-password" 
                        type="password" 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="new-password">Kata Sandi Baru</Label>
                      <Input 
                        id="new-password" 
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="confirm-password">Konfirmasi Kata Sandi Baru</Label>
                      <Input 
                        id="confirm-password" 
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit">Ubah Kata Sandi</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {activeTab === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>Notifikasi</CardTitle>
                  <CardDescription>Atur preferensi notifikasi Anda</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label className="text-base">Notifikasi Pesanan</Label>
                        <p className="text-sm text-gray-500">
                          Terima update tentang status pesanan Anda
                        </p>
                      </div>
                      <input type="checkbox" className="toggle" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label className="text-base">Promo & Penawaran</Label>
                        <p className="text-sm text-gray-500">
                          Dapatkan info promo menarik dari Toco
                        </p>
                      </div>
                      <input type="checkbox" className="toggle" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Footer handled by layout or omitted */}
    </div>
  );
}
