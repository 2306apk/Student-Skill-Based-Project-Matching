'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, GraduationCap, ShieldCheck } from 'lucide-react';
import { SessionUser } from '@/types';

interface NavbarProps {
  user: SessionUser | null;
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded bg-slate-900 flex items-center justify-center text-white font-semibold">
          {user?.role === 'ADMIN' ? (
            <ShieldCheck className="w-5 h-5 text-amber-400" />
          ) : (
            <GraduationCap className="w-5 h-5 text-sky-400" />
          )}
        </div>
        <div>
          <h1 className="text-sm font-semibold text-slate-900 leading-tight">
            Student Skill–Project Matching
          </h1>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="text-right hidden sm:block">
          <div className="text-sm font-medium text-slate-800">{user?.name || user?.email}</div>
          <div className="flex items-center justify-end space-x-1.5">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                user?.role === 'ADMIN' ? 'bg-amber-500' : 'bg-sky-500'
              }`}
            />
            <span className="text-xs text-slate-500 uppercase tracking-wide">
              {user?.role} {user?.studentId ? `(#${user.studentId})` : ''}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded border border-slate-200 hover:border-rose-200 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}

