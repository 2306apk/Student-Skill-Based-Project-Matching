'use client';

import React, { useEffect, useState } from 'react';
import { Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function StudentApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function loadApplications() {
    setLoading(true);
    try {
      const res = await fetch('/api/applications');
      if (res.ok) {
        const d = await res.json();
        setApplications(d.applications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  async function handleWithdraw(studentId: number, projectId: number, projectTitle: string) {
    if (!confirm(`Are you sure you want to withdraw your application for "${projectTitle}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/applications/${studentId}-${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Withdrawn' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to withdraw application');

      setFeedback({ type: 'success', text: `Application for "${projectTitle}" withdrawn.` });
      loadApplications();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">My Applications</h2>
        <p className="text-xs text-slate-500">
          Source: MySQL <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">APPLICATION</code> table with status CHECK constraints
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded text-xs flex items-center space-x-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">Loading your applications...</div>
        ) : applications.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">
            You have not submitted any applications yet.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Project Title</th>
                <th className="py-3 px-4">Project Status</th>
                <th className="py-3 px-4">Application Date</th>
                <th className="py-3 px-4">Application Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {applications.map((app, idx) => {
                const canWithdraw =
                  app.application_status !== 'Withdrawn' &&
                  app.application_status !== 'Selected' &&
                  app.application_status !== 'Rejected';

                return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {app.project_title}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={app.project_status} />
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {app.application_date}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={app.application_status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {canWithdraw ? (
                        <button
                          onClick={() =>
                            handleWithdraw(app.student_id, app.project_id, app.project_title)
                          }
                          className="px-2.5 py-1 text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded transition-colors"
                        >
                          Withdraw
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">No action</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

