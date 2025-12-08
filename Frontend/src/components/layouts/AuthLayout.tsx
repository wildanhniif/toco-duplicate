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
import OauthLoginButton from "../composites/Auth/OauthLoginButton";

type AuthLayoutProps = {
  title: string;
  typeForm: "login" | "register";
  children: React.ReactNode;
};

export default function AuthLayout(props: AuthLayoutProps) {
  const { title, typeForm, children } = props;
  return (
    <div className="relative flex flex-col w-full max-w-[1440px] h-full p-4 lg:p-14 z-10">
      <div className="hidden lg:flex justify-start w-full h-fit">
        <Link href="/" className="text-2xl font-semibold">
          Tokoo
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
              <AuthNavigations typeForm={typeForm} />
            </CardHeader>
            <CardContent className="px-8">
              {children}
              {typeForm === "login" && (
                <>
                  <p className="flex justify-center my-4 text-sm text-center text-muted-foreground">
                    atau masuk dengan
                  </p>
                  <OauthLoginButton />
                </>
              )}
            </CardContent>
            <CardFooter className="flex flex-col items-center px-8">
              <p className="text-center text-sm">Butuh Bantuan?</p>
              <p className="text-center text-sm">
                Kunjungi{" "}
                <Link href="/" className="font-bold">
                  Pusat Bantuan
                </Link>{" "}
                atau{" "}
                <Link href="/" className="font-bold">
                  Hubungi Minkoo
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

const AuthNavigations = ({ typeForm }: { typeForm: "login" | "register" }) => {
  return (
    <CardDescription>
      {typeForm === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
      <Link
        href={typeForm === "login" ? "/register" : "/login"}
        className="font-bold text-primary"
      >
        {typeForm === "login" ? "Daftar Sekarang" : "Masuk"}
      </Link>
    </CardDescription>
  );
};
