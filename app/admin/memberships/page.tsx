'use client';

import React, { useEffect, useState } from 'react';
import { UserCheck, Users, Briefcase, Calendar } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function AdminMembershipsPage() {
  const [memberships, setMemberships] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const url = selectedProjectId
        ? `/api/memberships?project_id=${selectedProjectId}`
        : '/api/memberships';

      const [memRes, projRes] = await Promise.all([fetch(url), fetch('/api/projects')]);

      if (memRes.ok) {
        const d = await memRes.json();
        setMemberships(d.memberships || []);
      }
      if (projRes.ok) {
        const p = await projRes.json();
        setProjects(p.projects || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedProjectId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Project Memberships & Allocation</h2>
          <p className="text-xs text-slate-500">
            Source: MySQL <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">PROJECT_MEMBER</code> table with trigger <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">Check_Project_Capacity</code>
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-600">Filter by Project:</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.project_id} value={p.project_id}>
                #{p.project_id} - {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Project Capacity Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {projects.map((p) => (
          <div key={p.project_id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 truncate max-w-[140px]">{p.title}</span>
              <StatusBadge status={p.status} />
            </div>
            <div className="mt-3 flex items-baseline justify-between text-xs">
              <span className="text-slate-500">Capacity:</span>
              <span className="font-mono">
                <strong className="text-slate-900">{p.active_members}</strong> / {p.max_students}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              {p.slots_left > 0 ? (
                <span className="text-emerald-600 font-semibold">{p.slots_left} slots available</span>
              ) : (
                <span className="text-rose-600 font-semibold">At capacity</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Memberships Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">Loading project memberships...</div>
        ) : memberships.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">
            No project members found for the current filter.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Assigned Project</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4">Member Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {memberships.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{m.student_name}</div>
                    <div className="text-[11px] font-mono text-slate-400">Student #{m.student_id}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800">{m.project_title}</div>
                    <div className="text-[11px] font-mono text-slate-400">Project #{m.project_id}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{m.role}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{m.joined_date || '—'}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={m.member_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

