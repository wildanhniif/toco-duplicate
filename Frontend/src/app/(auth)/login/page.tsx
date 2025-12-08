import { Metadata } from "next";
import LoginView from "@/views/auth/login";

export const metadata: Metadata = {
  title: "Tokoo - Login",
};

export default function LoginPage() {
  return <LoginView />;
}
