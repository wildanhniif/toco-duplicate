"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import SellerOauthLoginButton from "../composites/Auth/SellerOauthLoginButton";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

type SellerAuthLayoutProps = {
  title: string;
  children: React.ReactNode;
};

export default function SellerAuthLayout(props: SellerAuthLayoutProps) {
  const { title, children } = props;
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect unauthenticated users to login page first
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      // User is not authenticated, redirect to regular login first
      window.location.href = "/login?redirect_to_seller=true";
      return;
    }

    // User is authenticated, they can proceed with seller login
    // (the SellerLoginForm will handle the seller registration logic)
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect is happening in useEffect
    return null;
  }

  return (
    <div className="relative flex flex-col w-full max-w-[1440px] h-full p-4 lg:p-14 z-10">
      <div className="hidden lg:flex justify-start w-full h-fit">
        <Link href="/" className="text-2xl font-semibold">
          Toco <span className="text-primary">Seller</span>
        </Link>
      </div>
      <div className="flex items-center">
        <div className="hidden lg:flex justify-center items-center w-full">
          <Image src="/auth.svg" alt="Auth Image" width={450} height={450} />
        </div>
        <div className="flex items-center justify-center w-full">
          <Card className="w-full py-8 gap-8 lg:max-w-lg">
            <CardHeader className="px-8">
              <CardTitle className="text-3xl font-bold">{title}</CardTitle>
              <CardDescription>
                Belum punya akun?{" "}
                <Link href="/register" className="font-bold text-primary">
                  Daftar Sekarang
                </Link>
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8">
              {children}
              <p className="flex justify-center my-4 text-sm text-center text-muted-foreground">
                atau masuk dengan
              </p>
              <SellerOauthLoginButton />
            </CardContent>
            <CardFooter className="flex flex-col items-center px-8">
              <p className="text-center text-sm">
                Ingin berbelanja saja?{" "}
                <Link href="/login" className="font-bold text-primary">
                  Login sebagai Pembeli
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
