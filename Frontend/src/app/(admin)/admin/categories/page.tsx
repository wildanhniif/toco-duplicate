
import { Metadata } from 'next';
import AdminCategoriesView from '@/views/admin/categories';

export const metadata: Metadata = {
  title: 'Kelola Kategori - Admin Toco',
  description: 'Halaman pengelolaan kategori produk untuk admin Toco',
};

export default function AdminCategoriesPage() {
  return <AdminCategoriesView />;
}
