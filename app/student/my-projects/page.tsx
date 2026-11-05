'use client';

import React, { useEffect, useState } from 'react';
import { FolderGit2, Calendar, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function StudentMyProjectsPage() {
  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMemberships() {
      try {
        const res = await fetch('/api/memberships');
        if (res.ok) {
          const d = await res.json();
          setMemberships(d.memberships || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMemberships();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">My Project Memberships</h2>
        <p className="text-xs text-slate-500">
          Source: MySQL <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">PROJECT_MEMBER</code> table resulting from stored procedure executions
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">Loading project memberships...</div>
        ) : memberships.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">
            You are not currently assigned to any projects.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
            {memberships.map((m, idx) => (
              <div
                key={idx}
                className="p-5 rounded-lg border border-slate-200 bg-slate-50/40 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-mono text-slate-400">
                        Project #{m.project_id}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">
                        {m.project_title}
                      </h3>
                    </div>
                    <StatusBadge status={m.member_status} />
                  </div>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-slate-500">Assigned Role:</span>
                      <strong className="text-slate-800">{m.role}</strong>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-500">Joined Date:</span>
                      <span className="font-mono text-slate-700">{m.joined_date || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Project Status: <strong className="text-slate-700">{m.project_status}</strong></span>
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Active Development
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

