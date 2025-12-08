import { Metadata } from "next"
import HomeView from "@/views/home"

export const metadata: Metadata = {
  title: "Tokoo: Jual Beli & Iklan Baris"
}

export default function HomePage() {
  return (
    <HomeView />
  )
}
