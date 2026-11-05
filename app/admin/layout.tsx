import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { Navbar } from '@/components/layout/Navbar';
import { AdminSidebar } from '@/components/layout/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'ADMIN') {
    redirect('/student/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar user={user} />
      <div className="flex-1 flex">
        <AdminSidebar />
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl">{children}</main>
      </div>
    </div>
  );
}

