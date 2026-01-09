"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2,
  Info, ArrowLeft, Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import SellerSidebar from "@/components/layouts/SellerSidebar";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ImportResult {
  success: Array<{
    row: number;
    product_id: number;
    name: string;
    slug: string;
  }>;
  failed: Array<{
    row: number;
    data: any;
    error: string;
  }>;
  total: number;
}

export default function BulkProductImportView() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, token } = useAuth();
  
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [preview, setPreview] = useState<any[] | null>(null);

  // Check authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== "seller" && user?.role !== "admin")) {
    router.push("/login");
    return null;
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(csv|xlsx|xls)$/)) {
      toast.error("File harus berformat CSV atau Excel (.xlsx, .xls)");
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    setFile(selectedFile);
    setResult(null);
    parseFile(selectedFile);
  };

  const parseFile = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => !line.trim().startsWith('#') && line.trim());
      
      if (lines.length < 2) {
        toast.error("File kosong atau tidak valid");
        return;
      }

      // Parse CSV
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data = lines.slice(1, Math.min(6, lines.length)).map(line => {
        const values = parseCSVLine(line);
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      });

      setPreview(data);
    } catch (error) {
      console.error("Error parsing file:", error);
      toast.error("Gagal membaca file");
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result.map(v => v.replace(/^"|"$/g, ''));
  };

  const handleImport = async () => {
    if (!file || !token) return;

    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => !line.trim().startsWith('#') && line.trim());
      
      if (lines.length < 2) {
        toast.error("File tidak berisi data produk");
        setImporting(false);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      // Group by product name to handle variants
      const productGroups = new Map<string, any[]>();
      
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        const productName = row.name || '';
        if (! productName) continue;

        if (!productGroups.has(productName)) {
          productGroups.set(productName, []);
        }
        productGroups.get(productName)!.push(row);
      }

      // Build products array
      const products = Array.from(productGroups.entries()).map(([name, rows]) => {
        const firstRow = rows[0];
        const product: any = {
          name,
          category_id: parseInt(firstRow.category_id) || 1,
          description: firstRow.description || '',
          price: parseFloat(firstRow.price) || 0,
          stock_quantity: parseInt(firstRow.stock_quantity) || 0,
          weight_gram: parseInt(firstRow.weight_gram) || 0,
          sku: firstRow.sku || '',
          brand: firstRow.brand || '',
          condition: firstRow.condition || 'new',
          product_type: firstRow.product_type || 'marketplace',
          images: firstRow.images ? firstRow.images.split(';').filter((url: string) => url.trim()) : [],
        };

        // Handle variants
        const variants = [];
        for (const row of rows) {
          if (row.variant_name && row.variant_value) {
            variants.push({
              variant_name: row.variant_name,
              variant_value: row.variant_value,
              price: parseFloat(row.variant_price) || product.price,
              stock: parseInt(row.variant_stock) || 0,
              sku: row.sku || '',
            });
          }
        }
        
        if (variants.length > 0) {
          product.variants = variants;
          product.stock_quantity = 0; // Stock will be in variants
        }

        return product;
      });

      if (products.length > 50) {
        toast.error("Maksimal 50 produk per import");
        setImporting(false);
        return;
      }

      // Send to backend
      const response = await fetch(`${API_BASE_URL}/api/products/bulk-import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ products }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Gagal melakukan import");
        setImporting(false);
        return;
      }

      const data = await response.json();
      setResult(data.results);
      
      if (data.results.success.length > 0) {
        toast.success(`Berhasil import ${data.results.success.length} produk!`);
      }
      if (data.results.failed.length > 0) {
        toast.warning(`${data.results.failed.length} produk gagal diimport`);
      }
      
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Terjadi kesalahan saat import");
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/bulk-template`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        toast.error("Gagal download template");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'product_import_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Template berhasil didownload");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Gagal download template");
    }
  };

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

              <h1 className="text-2xl font-bold mb-2">Import Produk Massal</h1>
              <p className="text-gray-600">
                Upload file CSV atau Excel untuk menambahkan banyak produk sekaligus (maksimal 50 produk)
              </p>
            </div>

            {/* Instructions */}
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">Cara Import:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Download template CSV dengan klik tombol di bawah</li>
                    <li>Isi data produk sesuai kolom yang tersedia</li>
                    <li>Untuk varian, buat baris baru dengan nama produk yang sama tapi variasi berbeda</li>
                    <li>Simpan dan upload file CSV/Excel</li>
                    <li>Review preview dan klik "Mulai Import"</li>
                  </ol>
                </div>
              </AlertDescription>
            </Alert>

            {/* Download Template */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Step 1: Download Template
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={downloadTemplate} variant="outline" className="gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Download Template CSV
                </Button>
              </CardContent>
            </Card>

            {/* Upload File */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Step 2: Upload File
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-sm text-gray-600 mb-1">
                      {file ? file.name : "Klik untuk pilih file atau drag & drop"}
                    </p>
                    <p className="text-xs text-gray-500">
                      CSV or Excel (.csv, .xlsx, .xls) - Max 5MB
                    </p>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            {preview && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Preview Data (5 baris pertama)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(preview[0] || {}).slice(0, 6).map(key => (
                            <th key={key} className="border px-2 py-1 text-left">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((row, idx) => (
                          <tr key={idx}>
                            {Object.values(row).slice(0, 6).map((val: any, i) => (
                              <td key={i} className="border px-2 py-1">{String(val).substring(0, 30)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4 flex gap-3">
                    <Button 
                      onClick={handleImport} 
                      disabled={importing || !file}
                      className="gap-2"
                    >
                      {importing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Mulai Import
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setFile(null);
                        setPreview(null);
                      }}
                    >
                      Batal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {result && (
              <Card>
                <CardHeader>
                  <CardTitle>Hasil Import</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold">{result.total}</p>
                      <p className="text-sm text-gray-600">Total</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{result.success.length}</p>
                      <p className="text-sm text-gray-600">Berhasil</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{result.failed.length}</p>
                      <p className="text-sm text-gray-600">Gagal</p>
                    </div>
                  </div>

                  {result.success.length > 0 && (
                    <div>
                      <h4 className="font-semibold flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        Produk Berhasil Diimport
                      </h4>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {result.success.map((item) => (
                          <div key={item.row} className="text-sm p-2 bg-green-50 rounded">
                            Baris {item.row}: {item.name} (ID: {item.product_id})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.failed.length > 0 && (
                    <div>
                      <h4 className="font-semibold flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        Produk Gagal Diimport
                      </h4>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {result.failed.map((item) => (
                          <div key={item.row} className="text-sm p-2 bg-red-50 rounded">
                            <p className="font-medium">Baris {item.row}: {item.data.name || 'No name'}</p>
                            <p className="text-red-600">{item.error}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button onClick={() => router.push("/seller/products")}>
                      Lihat Daftar Produk
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setFile(null);
                        setPreview(null);
                        setResult(null);
                      }}
                    >
                      Import Lagi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
