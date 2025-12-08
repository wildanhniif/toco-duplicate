"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SellerSidebar from "@/components/layouts/SellerSidebar";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ShippingSettings from "./ShippingSettings";

export default function SellerSettingsView() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get tab from URL
  const tabFromUrl = searchParams.get("type");
  const currentTab =
    tabFromUrl && ["info", "kurir", "template", "keamanan"].includes(tabFromUrl)
      ? tabFromUrl
      : "kurir";

  // Auth check
  useEffect(() => {
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "seller") {
    return null;
  }

  const handleTabChange = (value: string) => {
    router.push(`/seller/settings?type=${value}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <SellerSidebar />

        {/* Main Content */}
        <div className="flex-1 ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Back Button */}
            <div className="mb-4">
              <Link href="/seller/dashboard">
                <Button variant="outline" size="sm">
                  ← Kembali ke Dashboard
                </Button>
              </Link>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">Pengaturan Toko</h1>
              <p className="text-gray-600">
                Kelola layanan pengiriman dan template balasan toko Anda
              </p>
            </div>

            {/* Tabs */}
            <Tabs value={currentTab} onValueChange={handleTabChange}>
              <TabsList className="mb-6 border-b w-full justify-start rounded-none bg-transparent p-0">
                <TabsTrigger
                  value="info"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-500 data-[state=active]:bg-transparent"
                >
                  Informasi Toko
                </TabsTrigger>
                <TabsTrigger
                  value="kurir"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-500 data-[state=active]:bg-transparent"
                >
                  Layanan Pengiriman
                </TabsTrigger>
                <TabsTrigger
                  value="template"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-500 data-[state=active]:bg-transparent"
                >
                  Template Balasan
                </TabsTrigger>
                <TabsTrigger
                  value="keamanan"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-500 data-[state=active]:bg-transparent"
                >
                  Keamanan Akun
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info">
                <div className="bg-white rounded-lg border p-8 text-center">
                  <p className="text-gray-500">
                    Untuk mengubah informasi toko, silakan kunjungi halaman{" "}
                    <a
                      href="/seller/store/settings"
                      className="text-yellow-600 hover:underline"
                    >
                      Pengaturan Toko
                    </a>
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="kurir">
                <ShippingSettings />
              </TabsContent>

              <TabsContent value="template">
                <div className="bg-white rounded-lg border p-8 text-center">
                  <p className="text-gray-500">
                    Fitur Template Balasan akan segera hadir
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="keamanan">
                <div className="bg-white rounded-lg border p-8 text-center">
                  <p className="text-gray-500">
                    Fitur Keamanan Akun akan segera hadir
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
