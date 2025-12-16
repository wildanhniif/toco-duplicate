import { Metadata } from "next";
import UserSettingsView from "@/views/user/settings";

export const metadata: Metadata = {
  title: "Pengaturan Akun - Toco",
};

export default function UserSettingsPage() {
  return <UserSettingsView />;
}
