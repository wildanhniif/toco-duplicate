import AdminSidebar from "@/components/layouts/AdminSidebar";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";

const inter = Inter({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tokoo Admin",
  description: "Admin Panel for Tokoo",
};

export default function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-gray-100`}>
        <div className="flex min-h-screen">
          <AdminSidebar />
          <div className="flex-1 ml-64">
             {children}
          </div>
        </div>
      </body>
    </html>
  );
}
