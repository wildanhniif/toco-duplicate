"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SellerSidebar from "@/components/layouts/SellerSidebar";
import InformasiVoucher from "./components/form/InformasiVoucher";
import InformasiProgram from "./components/form/InformasiProgram";
import DetailPromo from "./components/form/DetailPromo";
import { toast } from "sonner";

export interface VoucherFormData {
  // Informasi Voucher
  voucher_type: "discount" | "free_shipping";
  target_type: "public" | "private";
  voucher_code: string;
  title: string;
  description: string;

  // Informasi Program
  start_date: string;
  end_date: string;
  quota: number;
  limit_per_user: number | null;
  has_limit: boolean;
  apply_to: "all_products" | "specific_products";
  product_ids: number[];

  // Detail Promo
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_discount: number;
  min_transaction: number;
}

export default function AddVoucherPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<VoucherFormData>({
    voucher_type: "discount",
    target_type: "public",
    voucher_code: "",
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    quota: 0,
    limit_per_user: null,
    has_limit: false,
    apply_to: "all_products",
    product_ids: [],
    discount_type: "percentage",
    discount_value: 0,
    max_discount: 0,
    min_transaction: 0,
  });

  // Calculate estimated cost
  const [estimatedCost, setEstimatedCost] = useState(0);

  useEffect(() => {
    let cost = 0;
    if (formData.voucher_type === "discount") {
      if (formData.discount_type === "percentage") {
        cost = formData.quota * formData.max_discount;
      } else {
        cost = formData.quota * formData.discount_value;
      }
    }
    setEstimatedCost(cost);
  }, [
    formData.quota,
    formData.discount_value,
    formData.discount_type,
    formData.max_discount,
    formData.voucher_type,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error("Judul promosi harus diisi");
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      toast.error("Periode promosi harus diisi");
      return;
    }

    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      toast.error("Tanggal berakhir harus setelah tanggal mulai");
      return;
    }

    if (formData.quota <= 0) {
      toast.error("Kuota promosi harus lebih dari 0");
      return;
    }

    if (formData.target_type === "private" && !formData.voucher_code.trim()) {
      toast.error("Kode voucher harus diisi untuk voucher khusus");
      return;
    }

    if (formData.voucher_type === "discount" && formData.discount_value <= 0) {
      toast.error("Nominal diskon harus lebih dari 0");
      return;
    }

    if (
      formData.discount_type === "percentage" &&
      formData.discount_value > 100
    ) {
      toast.error("Persentase diskon maksimal 100%");
      return;
    }

    if (
      formData.apply_to === "specific_products" &&
      formData.product_ids.length === 0
    ) {
      toast.error("Pilih minimal 1 produk untuk penerapan voucher");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");

      const payload = {
        ...formData,
        limit_per_user: formData.has_limit ? formData.limit_per_user : null,
      };

      const response = await fetch("http://localhost:5000/api/vouchers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Voucher berhasil dibuat!");
        router.push("/seller/vouchers");
      } else {
        const error = await response.json();
        toast.error(error.message || "Gagal membuat voucher");
      }
    } catch (error) {
      console.error("Error creating voucher:", error);
      toast.error("Terjadi kesalahan saat membuat voucher");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <SellerSidebar />

      <div className="flex-1 ml-64 min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Tambah Voucher
              </h1>
              <p className="text-gray-600 mt-1">
                Buat voucher promosi baru untuk toko Anda
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Informasi Voucher */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">
                1. Informasi Voucher
              </h2>
              <InformasiVoucher formData={formData} setFormData={setFormData} />
            </Card>

            {/* Section 2: Informasi Program */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">
                2. Informasi Program
              </h2>
              <InformasiProgram formData={formData} setFormData={setFormData} />
            </Card>

            {/* Section 3: Detail Promo */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">3. Detail Promo</h2>
              <DetailPromo
                formData={formData}
                setFormData={setFormData}
                estimatedCost={estimatedCost}
              />
            </Card>

            {/* Actions */}
            <div className="flex gap-3 justify-end sticky bottom-0 bg-white p-4 border-t shadow-lg rounded-lg">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                <X className="w-4 h-4 mr-2" />
                Batalkan
              </Button>
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Voucher
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
