'use client';

import React, { useEffect, useState } from 'react';
import { FileCheck, Filter, CheckCircle2, XCircle, Award, AlertCircle } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterProjectId, setFilterProjectId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Select Modal State
  const [selectionTarget, setSelectionTarget] = useState<any | null>(null);
  const [assignedRole, setAssignedRole] = useState('Software Developer');
  const [selectLoading, setSelectLoading] = useState(false);
  const [selectError, setSelectError] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterProjectId) params.set('project_id', filterProjectId);
      if (filterStatus) params.set('status', filterStatus);

      const [appRes, projRes] = await Promise.all([
        fetch(`/api/applications?${params.toString()}`),
        fetch('/api/projects'),
      ]);

      if (appRes.ok) {
        const d = await appRes.json();
        setApplications(d.applications || []);
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
  }, [filterProjectId, filterStatus]);

  async function handleStatusChange(studentId: number, projectId: number, newStatus: string) {
    try {
      const res = await fetch(`/api/applications/${studentId}-${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      setFeedback({ type: 'success', text: `Application status changed to ${newStatus}.` });
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    }
  }

  async function handleExecuteSelection(e: React.FormEvent) {
    e.preventDefault();
    if (!selectionTarget) return;
    setSelectLoading(true);
    setSelectError(null);

    try {
      // Calls Stored Procedure: Select_Student_For_Project via API
      const res = await fetch('/api/memberships/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectionTarget.student_id,
          project_id: selectionTarget.project_id,
          role: assignedRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Selection failed');

      setSelectionTarget(null);
      setFeedback({
        type: 'success',
        text: `Transaction completed: ${data.message}`,
      });
      loadData();
    } catch (err: any) {
      setSelectError(err.message);
    } finally {
      setSelectLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Application Management & Shortlisting</h2>
        <p className="text-xs text-slate-500">
          Source: MySQL View <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">Project_Applicants</code> joining <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">APPLICATION</code>, <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">STUDENT</code>, and <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">PROJECT</code>
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

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-600">Filter Project:</label>
          <select
            value={filterProjectId}
            onChange={(e) => setFilterProjectId(e.target.value)}
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

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-600">Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="">All Statuses</option>
            <option value="Applied">Applied</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Selected">Selected</option>
            <option value="Rejected">Rejected</option>
            <option value="Withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">Querying Project_Applicants view...</div>
        ) : applications.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">No applications match criteria.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">CGPA</th>
                <th className="py-3 px-4">Target Project</th>
                <th className="py-3 px-4">Applied Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {applications.map((app, idx) => {
                const canShortlist = app.application_status === 'Applied';
                const canReject =
                  app.application_status === 'Applied' || app.application_status === 'Shortlisted';
                const canSelect =
                  app.application_status === 'Applied' || app.application_status === 'Shortlisted';

                return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{app.student_name}</div>
                      <div className="text-[11px] font-mono text-slate-400">ID #{app.student_id}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {app.cgpa !== null ? app.cgpa : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{app.project_title}</div>
                      <div className="text-[11px] text-slate-400 font-mono">Project #{app.project_id}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{app.application_date}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={app.application_status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      {canShortlist && (
                        <button
                          onClick={() =>
                            handleStatusChange(app.student_id, app.project_id, 'Shortlisted')
                          }
                          className="px-2 py-1 text-xs text-blue-700 hover:bg-blue-50 border border-blue-200 rounded transition-colors"
                        >
                          Shortlist
                        </button>
                      )}

                      {canSelect && (
                        <button
                          onClick={() => {
                            setSelectionTarget(app);
                            setAssignedRole('Developer');
                            setSelectError(null);
                          }}
                          className="px-2 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-300 rounded transition-colors"
                        >
                          Select (SP)
                        </button>
                      )}

                      {canReject && (
                        <button
                          onClick={() =>
                            handleStatusChange(app.student_id, app.project_id, 'Rejected')
                          }
                          className="px-2 py-1 text-xs text-rose-700 hover:bg-rose-50 border border-rose-200 rounded transition-colors"
                        >
                          Reject
                        </button>
                      )}

                      {!canShortlist && !canSelect && !canReject && (
                        <span className="text-[11px] text-slate-400 italic">Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Select Candidate Modal (Calls Select_Student_For_Project) */}
      <Modal
        isOpen={!!selectionTarget}
        onClose={() => setSelectionTarget(null)}
        title={`Execute Atomic Selection: ${selectionTarget?.student_name}`}
      >
        <form onSubmit={handleExecuteSelection} className="space-y-4">
          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded text-xs text-amber-900 leading-relaxed">
            <span className="font-bold">Transaction Warning:</span> This executes stored procedure{' '}
            <code className="bg-amber-100 font-mono px-1 py-0.5 rounded">Select_Student_For_Project(?, ?, ?)</code>.
            It starts a database transaction, locks the project row with{' '}
            <code className="bg-amber-100 font-mono px-1 py-0.5 rounded">SELECT ... FOR UPDATE</code>,
            updates the application status to <em>&apos;Selected&apos;</em>, and inserts a membership record into{' '}
            <code className="bg-amber-100 font-mono px-1 py-0.5 rounded">PROJECT_MEMBER</code> (firing the capacity trigger).
          </div>

          {selectError && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{selectError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Role</label>
            <input
              type="text"
              required
              value={assignedRole}
              onChange={(e) => setAssignedRole(e.target.value)}
              placeholder="e.g. AI Developer, Backend Engineer, Database Architect"
              className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={selectLoading}
              onClick={() => setSelectionTarget(null)}
              className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded text-xs font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectLoading}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-sm"
            >
              {selectLoading ? 'Executing Procedure...' : 'Commit Selection (SP)'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
