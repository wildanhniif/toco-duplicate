
import { Metadata } from 'next';
import AdminBannersView from '@/views/admin/banners';

export const metadata: Metadata = {
  title: 'Kelola Banner - Admin Toco',
  description: 'Halaman pengelolaan banner untuk admin Toco',
};

export default function AdminBannersPage() {
  return <AdminBannersView />;
}
