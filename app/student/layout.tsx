import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { Navbar } from '@/components/layout/Navbar';
import { StudentSidebar } from '@/components/layout/StudentSidebar';

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'STUDENT') {
    redirect('/admin/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar user={user} />
      <div className="flex-1 flex">
        <StudentSidebar />
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl">{children}</main>
      </div>
    </div>
  );
}

