
import { Metadata } from 'next';
import AdminDashboardView from '@/views/admin/dashboard';

export const metadata: Metadata = {
  title: 'Admin Dashboard - Toco',
  description: 'Halaman dashboard untuk admin Toco',
};

export default function AdminDashboardPage() {
  return <AdminDashboardView />;
}
