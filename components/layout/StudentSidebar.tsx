'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  Wrench,
  Briefcase,
  Award,
  Send,
  FolderGit2,
  History,
} from 'lucide-react';

const studentNavItems = [
  { href: '/student/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/student/profile', label: 'My Profile', icon: User },
  { href: '/student/skills', label: 'My Skills', icon: Wrench },
  { href: '/student/projects', label: 'Browse Projects', icon: Briefcase },
  { href: '/student/matches', label: 'Match Results', icon: Award },
  { href: '/student/applications', label: 'My Applications', icon: Send },
  { href: '/student/my-projects', label: 'My Projects', icon: FolderGit2 },
  { href: '/student/activity', label: 'Activity History', icon: History },
];

export function StudentSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4">
      <nav className="space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Student Portal
        </div>
        {studentNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-500">
        <div className="font-semibold text-slate-700">Relational & NoSQL</div>
        <div className="mt-1 text-[11px] leading-relaxed">
          Queries MySQL views & procedures; logs activity to MongoDB.
        </div>
      </div>
    </aside>
  );
}
