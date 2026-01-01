"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import SellerSidebar from "@/components/layouts/SellerSidebar";

// Import field sections
import BasicInfoSection from "./sections/BasicInfoSection";
import MarketplaceFields from "./sections/MarketplaceFields";
import MotorFields from "./sections/MotorFields";
import CarFields from "./sections/CarFields";
import PropertyFields from "./sections/PropertyFields";
import ShippingInfoSection from "./sections/ShippingInfoSection";
import ProductStatusSection from "./sections/ProductStatusSection";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Category {
  category_id: number;
  name: string;
  slug: string;
  category_type: string;
}

interface ProductFormViewProps {
  productId?: string;
}

export default function ProductFormView({ productId }: ProductFormViewProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, token } = useAuth();

  const [loading, setLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEditMode = !!productId;

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  // Form state
  const [formData, setFormData] = useState({
    // Basic info
    name: "",
    description: "",
    category_id: "",
    images: [] as string[],

    // Product type
    product_type: "marketplace",

    // Marketplace fields
    price: "",
    discount_percentage: "0",
    stock_quantity: "",
    sku: "",
    condition: "new",
    brand: "",

    // Variants
    has_variants: false,
    variants: [] as any[],

    // Shipping (marketplace only)
    weight_gram: "",
    dimensions: {
      length: "",
      width: "",
      height: "",
    },
    is_preorder: false,
    use_store_courier: false,
    insurance: "optional",

    // Classified specs
    motor_specs: {
      brand: "",
      year: "",
      model: "",
      transmission: "manual",
      mileage: "",
      engine_capacity: "",
      color: "",
      fuel_type: "",
      tax_expiry_date: "",
      completeness: "",
      location: {
        name: "",
        lat: "",
        lng: "",
      },
    },

    mobil_specs: {
      brand: "",
      model: "",
      year: "",
      transmission: "manual",
      mileage: "",
      license_plate: "",
      color: "",
      fuel_type: "",
      engine_capacity: "",
      seat_capacity: "",
      tax_expiry_date: "",
      completeness: "",
      location: {
        name: "",
        lat: "",
        lng: "",
      },
    },

    property_specs: {
      transaction_type: "sale",
      property_type: "",
      building_area: "",
      land_area: "",
      bedrooms: "",
      bathrooms: "",
      floors: "",
      certificate_type: "",
      facilities: "",
      location: {
        name: "",
        lat: "",
        lng: "",
      },
    },

    // Status
    is_active: true,
  });

  // Auth check
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || user?.role !== "seller") {
      router.push("/login");
      return;
    }
    
    // Redirect if user doesn't have a store yet
    if (!user.store_id) {
      router.push("/seller/store/setup");
    }
  }, [user, isAuthenticated, isLoading, router]);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch product data for edit mode
  useEffect(() => {
    if (isEditMode && productId && token) {
      fetchProductData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, productId, token]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      if (response.ok) {
        const data = await response.json();
        // Backend returns array directly, not { categories: [...] }
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProductData = async () => {
    setFetchingProduct(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/products/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Gagal memuat data produk");
      }

      const product = await response.json();

      // Pre-fill form dengan data produk
      setFormData({
        name: product.name || "",
        description: product.description || "",
        category_id: product.category_id?.toString() || "",
        images: product.images?.map((img: any) => img.url) || [],
        product_type: product.product_type || "marketplace",
        price: product.price?.toString() || "",
        discount_percentage: product.discount_percentage?.toString() || "0",
        stock_quantity: product.stock_quantity?.toString() || "",
        sku: product.sku || "",
        condition: product.condition || "new",
        brand: product.brand || "",
        has_variants: false,
        variants: [],
        weight_gram: product.weight_gram?.toString() || "",
        dimensions: {
          length: product.length_mm?.toString() || "",
          width: product.width_mm?.toString() || "",
          height: product.height_mm?.toString() || "",
        },
        is_preorder: product.is_preorder || false,
        use_store_courier: false,
        insurance: "optional",
        is_active: product.status === "active",
        motor_specs: product.motor_specs || {
          brand: "",
          year: "",
          model: "",
          transmission: "manual",
          mileage: "",
          engine_capacity: "",
          color: "",
          fuel_type: "",
          tax_expiry_date: "",
          completeness: "",
          location: { name: "", lat: "", lng: "" },
        },
        mobil_specs: product.mobil_specs || {
          brand: "",
          model: "",
          year: "",
          transmission: "manual",
          mileage: "",
          license_plate: "",
          color: "",
          fuel_type: "",
          engine_capacity: "",
          seat_count: "",
          tax_expiry_date: "",
          completeness: "",
          location: { name: "", lat: "", lng: "" },
        },
        property_specs: product.property_specs || {
          transaction_type: "sell",
          price: "",
          building_area: "",
          land_area: "",
          bedrooms: "",
          bathrooms: "",
          floors: "",
          certificate: "",
          facilities: "",
          location: { name: "", lat: "", lng: "" },
        },
      });

      // Set selected category
      if (product.category_id) {
        const category = categories.find(
          (c) => c.category_id === product.category_id
        );
        if (category) {
          setSelectedCategory(category);
        }
      }
    } catch (err: any) {
      console.error("Error fetching product:", err);
      setError(err.message || "Gagal memuat data produk");
    } finally {
      setFetchingProduct(false);
    }
  };

  // Handle category change
  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find(
      (c) => c.category_id === parseInt(categoryId)
    );
    setSelectedCategory(category || null);

    setFormData((prev) => ({
      ...prev,
      category_id: categoryId,
    }));

    // Auto-set product type for classified categories
    if (category) {
      const slug = category.slug.toLowerCase();
      if (
        slug.includes("motor") ||
        slug.includes("mobil") ||
        slug.includes("properti") ||
        slug.includes("rumah") ||
        slug.includes("kost")
      ) {
        setFormData((prev) => ({ ...prev, product_type: "classified" }));
      }
    }
  };

  // Determine which fields to show
  const getCategoryType = ():
    | "motor"
    | "mobil"
    | "property"
    | "marketplace" => {
    if (!selectedCategory) return "marketplace";

    const slug = selectedCategory.slug.toLowerCase();

    if (slug.includes("motor") || slug.includes("sepeda-motor")) return "motor";
    if (slug.includes("mobil") || slug.includes("car")) return "mobil";
    if (
      slug.includes("properti") ||
      slug.includes("rumah") ||
      slug.includes("kost") ||
      slug.includes("apartemen")
    ) {
      return "property";
    }

    return "marketplace";
  };

  const categoryType = getCategoryType();

  // Handle submit
  const handleSubmit = async (saveAndAddNew = false) => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const token = localStorage.getItem("auth_token");

      // Prepare payload based on category type
      const payload: any = {
        name: formData.name,
        description: formData.description,
        category_id: parseInt(formData.category_id),
        product_type: formData.product_type,
        images: formData.images,
        status: formData.is_active ? "active" : "draft",
      };

      if (categoryType === "motor") {
        payload.price = parseFloat(formData.price);
        payload.motor_specs = {
          brand: formData.motor_specs.brand,
          year: parseInt(formData.motor_specs.year),
          model: formData.motor_specs.model,
          transmission: formData.motor_specs.transmission,
          mileage: formData.motor_specs.mileage
            ? parseInt(formData.motor_specs.mileage)
            : null,
          engine_capacity: formData.motor_specs.engine_capacity
            ? parseInt(formData.motor_specs.engine_capacity)
            : null,
          color: formData.motor_specs.color,
          fuel_type: formData.motor_specs.fuel_type,
          tax_expiry_date: formData.motor_specs.tax_expiry_date || null,
          completeness: formData.motor_specs.completeness,
          location: {
            name: formData.motor_specs.location.name,
            lat: parseFloat(formData.motor_specs.location.lat),
            lng: parseFloat(formData.motor_specs.location.lng),
          },
        };
      } else if (categoryType === "mobil") {
        payload.price = parseFloat(formData.price);
        payload.mobil_specs = {
          brand: formData.mobil_specs.brand,
          model: formData.mobil_specs.model,
          year: parseInt(formData.mobil_specs.year),
          transmission: formData.mobil_specs.transmission,
          mileage: formData.mobil_specs.mileage
            ? parseInt(formData.mobil_specs.mileage)
            : null,
          license_plate: formData.mobil_specs.license_plate,
          color: formData.mobil_specs.color,
          fuel_type: formData.mobil_specs.fuel_type,
          engine_capacity: formData.mobil_specs.engine_capacity
            ? parseInt(formData.mobil_specs.engine_capacity)
            : null,
          seat_capacity: formData.mobil_specs.seat_capacity
            ? parseInt(formData.mobil_specs.seat_capacity)
            : null,
          tax_expiry_date: formData.mobil_specs.tax_expiry_date || null,
          completeness: formData.mobil_specs.completeness,
          location: {
            name: formData.mobil_specs.location.name,
            lat: parseFloat(formData.mobil_specs.location.lat),
            lng: parseFloat(formData.mobil_specs.location.lng),
          },
        };
      } else if (categoryType === "property") {
        payload.price = parseFloat(formData.price);
        payload.property_specs = {
          transaction_type: formData.property_specs.transaction_type,
          property_type: formData.property_specs.property_type,
          building_area: formData.property_specs.building_area
            ? parseInt(formData.property_specs.building_area)
            : null,
          land_area: formData.property_specs.land_area
            ? parseInt(formData.property_specs.land_area)
            : null,
          bedrooms: formData.property_specs.bedrooms
            ? parseInt(formData.property_specs.bedrooms)
            : null,
          bathrooms: formData.property_specs.bathrooms
            ? parseInt(formData.property_specs.bathrooms)
            : null,
          floors: formData.property_specs.floors
            ? parseInt(formData.property_specs.floors)
            : null,
          certificate_type: formData.property_specs.certificate_type,
          facilities: formData.property_specs.facilities,
          location: {
            name: formData.property_specs.location.name,
            lat: parseFloat(formData.property_specs.location.lat),
            lng: parseFloat(formData.property_specs.location.lng),
          },
        };
      } else {
        // Marketplace
        // Marketplace
        payload.price = parseFloat(formData.price) || 0;
        payload.discount_percentage = parseInt(formData.discount_percentage) || 0;
        payload.stock_quantity = parseInt(formData.stock_quantity) || 0;
        payload.sku = formData.sku;
        payload.condition = formData.condition;
        payload.brand = formData.brand;
        payload.weight_gram = parseInt(formData.weight_gram) || 0;
        payload.dimensions = {
          length: parseInt(formData.dimensions.length) || 0,
          width: parseInt(formData.dimensions.width) || 0,
          height: parseInt(formData.dimensions.height) || 0,
        };
        payload.is_preorder = formData.is_preorder;
        payload.use_store_courier = formData.use_store_courier;
        payload.insurance = formData.insurance;

        if (formData.variants && formData.variants.length > 0) {
           // 1. Group for "variants" (Attributes definitions)
           const groupedVariants = new Map();
           formData.variants.forEach((v: any) => {
               if (!groupedVariants.has(v.variant_name)) {
                   groupedVariants.set(v.variant_name, new Set());
               }
               groupedVariants.get(v.variant_name).add(v.variant_value);
           });
       
           payload.variants = Array.from(groupedVariants.entries()).map(([name, values]) => ({
               name,
               options: Array.from(values as Set<string>)
           }));
       
           // 2. Map for "skus" (Actual Inventory Items)
           payload.skus = formData.variants.map((v: any, index: number) => ({
               sku_code: v.sku || `${formData.sku || 'SKU'}-${Date.now()}-${index}`,
               price: parseInt(v.price) || payload.price,
               stock_quantity: parseInt(v.stock) || 0,
               option_map: {
                   [v.variant_name]: v.variant_value
               },
               weight_gram: payload.weight_gram, // Inherit from main product
               dimensions: payload.dimensions
           }));

            // Sync total stock
            payload.stock_quantity = payload.skus.reduce((acc: number, sku: any) => acc + sku.stock_quantity, 0);
        }
      }

      // Determine URL and method based on mode
      const url = isEditMode
        ? `${API_BASE_URL}/api/products/${productId}`
        : `${API_BASE_URL}/api/products`;
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        const successMessage = isEditMode
          ? "Produk berhasil diperbarui!"
          : "Produk berhasil ditambahkan!";
        setSuccess(successMessage);

        if (saveAndAddNew && !isEditMode) {
          // Reset form only for create mode
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          // Redirect to product list
          setTimeout(() => {
            router.push("/seller/products");
          }, 1000);
        }
      } else {
        setError(
          data.message ||
            (isEditMode
              ? "Gagal memperbarui produk"
              : "Gagal menambahkan produk")
        );
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Terjadi kesalahan saat menyimpan produk");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || fetchingProduct) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {fetchingProduct ? "Memuat data produk..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "seller") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <SellerSidebar />

        <div className="flex-1 ml-64 p-8">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/seller/products")}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>

              <h1 className="text-2xl font-bold">
                {isEditMode ? "Edit Produk" : "Tambah Produk"}
              </h1>
              <p className="text-gray-600">
                {isEditMode
                  ? "Perbarui informasi produk Anda"
                  : "Isi informasi produk dengan lengkap dan benar"}
              </p>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-6 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                <span className="text-green-700">{success}</span>
              </div>
            )}

            <div className="space-y-6">
              {/* 1. Informasi Dasar */}
              <Card>
                <CardHeader>
                  <CardTitle>1. Informasi Dasar</CardTitle>
                </CardHeader>
                <CardContent>
                  <BasicInfoSection
                    formData={formData}
                    setFormData={setFormData}
                    categories={categories}
                    onCategoryChange={handleCategoryChange}
                  />
                </CardContent>
              </Card>

              {/* 2. Informasi Penjualan */}
              {formData.category_id && (
                <Card>
                  <CardHeader>
                    <CardTitle>2. Informasi Penjualan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {categoryType === "motor" && (
                      <MotorFields
                        formData={formData}
                        setFormData={setFormData}
                      />
                    )}
                    {categoryType === "mobil" && (
                      <CarFields
                        formData={formData}
                        setFormData={setFormData}
                      />
                    )}
                    {categoryType === "property" && (
                      <PropertyFields
                        formData={formData}
                        setFormData={setFormData}
                      />
                    )}
                    {categoryType === "marketplace" && (
                      <MarketplaceFields
                        formData={formData}
                        setFormData={setFormData}
                      />
                    )}
                  </CardContent>
                </Card>
              )}

              {/* 3. Informasi Pengiriman (Marketplace only) */}
              {categoryType === "marketplace" && formData.category_id && (
                <Card>
                  <CardHeader>
                    <CardTitle>3. Informasi Pengiriman</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ShippingInfoSection
                      formData={formData}
                      setFormData={setFormData}
                    />
                  </CardContent>
                </Card>
              )}

              {/* 4. Status Produk */}
              {formData.category_id && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {categoryType === "marketplace"
                        ? "4. Status Produk"
                        : "3. Status Produk"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProductStatusSection
                      formData={formData}
                      setFormData={setFormData}
                    />
                  </CardContent>
                </Card>
              )}

              <Separator />

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => router.push("/seller/products")}
                  disabled={loading}
                >
                  Batalkan
                </Button>
                {!isEditMode && (
                  <Button
                    variant="outline"
                    onClick={() => handleSubmit(true)}
                    disabled={
                      loading || !formData.name || !formData.category_id
                    }
                  >
                    {loading ? "Menyimpan..." : "Simpan & Tambah Baru"}
                  </Button>
                )}
                <Button
                  onClick={() => handleSubmit(false)}
                  disabled={loading || !formData.name || !formData.category_id}
                  className="min-w-[120px]"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Menyimpan...
                    </>
                  ) : isEditMode ? (
                    "Perbarui Produk"
                  ) : (
                    "Simpan Produk"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
