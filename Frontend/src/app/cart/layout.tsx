import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import NavbarLayout from "@/components/layouts/NavbarLayout";
import { Toaster } from "sonner";
import AddressGate from "@/components/composites/Address/AddressGate";

const inter = Inter({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tokoo - Keranjang Belanja",
  description: "Kelola produk di keranjang belanja Tokoo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <NavbarLayout />
        <AddressGate>{children}</AddressGate>
        <Toaster richColors position="top-center" closeButton />
      </body>
    </html>
  );
}
