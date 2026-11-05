'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Briefcase,
  FileCheck,
  UserCheck,
  Award,
  Database,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function AdminDashboardOverview() {
  const [overview, setOverview] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [overRes, projRes, appRes] = await Promise.all([
          fetch('/api/analytics/overview'),
          fetch('/api/projects'),
          fetch('/api/applications'),
        ]);

        if (overRes.ok) setOverview(await overRes.json());
        if (projRes.ok) setProjects((await projRes.json()).projects || []);
        if (appRes.ok) setApplications((await appRes.json()).applications || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="py-24 text-center text-xs text-slate-500">Loading system overview...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Administrative Console
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">System Overview & Diagnostics</h2>
          <p className="text-xs text-slate-500 mt-1">
            Student Skill–Project Matching • Operational Dashboard
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/admin/matches"
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold shadow-sm transition-colors"
          >
            <span>Ranked Candidates (SP)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/admin/projects"
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded text-xs font-semibold transition-colors"
          >
            <span>Manage Projects</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Enrolled Students</span>
            <div className="w-7 h-7 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {overview?.totalStudents ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">MySQL STUDENT table count</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active / Total Projects</span>
            <div className="w-7 h-7 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {overview?.openProjects ?? 0}{' '}
            <span className="text-sm font-normal text-slate-500">
              / {overview?.totalProjects ?? 0}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">MySQL PROJECT table</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Applications</span>
            <div className="w-7 h-7 rounded bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {overview?.totalApplications ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Queried from Project_Applicants</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">MongoDB Audit Events</span>
            <div className="w-7 h-7 rounded bg-purple-50 text-purple-600 flex items-center justify-center">
              <Database className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {overview?.activityCount ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">activity_logs collection</div>
        </div>
      </div>

      {/* Two Columns: Project Capacity Status & Recent Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Capacity */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Project Capacity & Slots</h3>
              <p className="text-xs text-slate-500">Enforced by MySQL Check_Project_Capacity trigger</p>
            </div>
            <Link
              href="/admin/projects"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center space-x-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {projects.map((p) => {
              const percent = Math.min(100, Math.round((p.active_members / p.max_students) * 100));
              return (
                <div key={p.project_id} className="py-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div>
                      <span className="font-semibold text-slate-900">{p.title}</span>
                      <span className="ml-2 text-slate-400 font-mono text-[11px]">#{p.project_id}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-600 font-medium">
                        {p.active_members} / {p.max_students}
                      </span>
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        percent >= 100
                          ? 'bg-rose-500'
                          : percent >= 75
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Latest Applications</h3>
              <p className="text-xs text-slate-500">From Project_Applicants view</p>
            </div>
            <Link
              href="/admin/applications"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center space-x-1"
            >
              <span>Review all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {applications.slice(0, 5).map((app, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900">{app.student_name}</div>
                  <div className="text-[11px] text-slate-500">
                    Applying for: <span className="text-slate-700 font-medium">{app.project_title}</span>
                  </div>
                </div>
                <div className="text-right">
                  <StatusBadge status={app.application_status} />
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {app.application_date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

