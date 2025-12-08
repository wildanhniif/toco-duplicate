import { Metadata } from "next"
import RegisterView from "@/views/auth/register"

export const metadata: Metadata = {
    title: "Tokoo - Register"
}

export default function RegisterPage() {
  return (
    <RegisterView />
  )
}
