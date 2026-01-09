import AdminSidebar from "@/components/layouts/AdminSidebar";

export const metadata = {
  title: 'Admin Dashboard',
  description: 'Tokoo Admin Dashboard',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 ml-64">
        {children}
      </div>
    </div>
  )
}
