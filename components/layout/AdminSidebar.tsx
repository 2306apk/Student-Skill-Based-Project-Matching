'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileCheck,
  Target,
  UserCheck,
  BarChart3,
} from 'lucide-react';

const adminNavItems = [
  { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/students', label: 'Student Management', icon: Users },
  { href: '/admin/projects', label: 'Project Management', icon: Briefcase },
  { href: '/admin/applications', label: 'Application Management', icon: FileCheck },
  { href: '/admin/matches', label: 'Match Results (SP)', icon: Target },
  { href: '/admin/memberships', label: 'Project Memberships', icon: UserCheck },
  { href: '/admin/analytics', label: 'Analytics & Aggregations', icon: BarChart3 },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4">
      <nav className="space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Admin Control
        </div>
        {adminNavItems.map((item) => {
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
        <div className="font-semibold text-slate-700">Database Engine</div>
        <div className="mt-1 text-[11px] leading-relaxed">
          Row-level transactions via <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">Select_Student_For_Project</code>.
        </div>
      </div>
    </aside>
  );
}

