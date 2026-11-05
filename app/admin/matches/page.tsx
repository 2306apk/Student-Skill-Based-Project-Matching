'use client';

import React, { useEffect, useState } from 'react';
import { Target, Award, CheckCircle, XCircle, UserCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';

export default function AdminMatchResultsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Selection Modal
  const [selectionTarget, setSelectionTarget] = useState<any | null>(null);
  const [assignedRole, setAssignedRole] = useState('Developer');
  const [selectLoading, setSelectLoading] = useState(false);
  const [selectError, setSelectError] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch('/api/projects');
        if (res.ok) {
          const d = await res.json();
          const projs = d.projects || [];
          setProjects(projs);
          if (projs.length > 0) {
            setSelectedProjectId(projs[0].project_id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadProjects();
  }, []);

  async function fetchMatches(projectId: number) {
    setLoading(true);
    setFeedback(null);
    try {
      // Calls Stored Procedure: CALL Get_Project_Matches(?)
      const res = await fetch(`/api/matches/project/${projectId}`);
      if (res.ok) {
        const d = await res.json();
        setMatches(d.matches || []);
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to call stored procedure');
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedProjectId) {
      fetchMatches(Number(selectedProjectId));
    }
  }, [selectedProjectId]);

  async function handleExecuteSelection(e: React.FormEvent) {
    e.preventDefault();
    if (!selectionTarget) return;
    setSelectLoading(true);
    setSelectError(null);

    try {
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
      if (!res.ok) throw new Error(data.error || 'Selection procedure failed');

      setSelectionTarget(null);
      setFeedback({
        type: 'success',
        text: `Transaction successful: ${data.message}`,
      });
      if (selectedProjectId) fetchMatches(Number(selectedProjectId));
    } catch (err: any) {
      setSelectError(err.message);
    } finally {
      setSelectLoading(false);
    }
  }

  const activeProject = projects.find((p) => p.project_id === Number(selectedProjectId));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Ranked Match Results (Stored Procedure)</h2>
          <p className="text-xs text-slate-500">
            Executes MySQL Stored Procedure <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded font-mono">CALL Get_Project_Matches(?)</code> ordering by match_score DESC
          </p>
        </div>

        {/* Project Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-700">Select Project:</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(Number(e.target.value))}
            className="px-3 py-1.5 border border-slate-300 rounded text-xs bg-white font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            {projects.map((p) => (
              <option key={p.project_id} value={p.project_id}>
                #{p.project_id} - {p.title} ({p.slots_left} slots left)
              </option>
            ))}
          </select>
        </div>
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

      {/* Selected Project Capacity Summary */}
      {activeProject && (
        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-semibold text-slate-800">{activeProject.title}</span> •{' '}
            <span className="text-slate-500">{activeProject.domain_name}</span> •{' '}
            <span className="text-slate-500">Client: {activeProject.client_name}</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-slate-600">
              Active: <strong className="text-slate-900">{activeProject.active_members}</strong> / {activeProject.max_students}
            </span>
            <StatusBadge status={activeProject.status} />
          </div>
        </div>
      )}

      {/* Ranked Candidate List */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">Executing stored procedure Get_Project_Matches...</div>
        ) : matches.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">
            No match results recorded for this project in MATCH_RESULT table.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {matches.map((m, rank) => (
              <div key={rank} className="p-5 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold font-mono">
                      #{rank + 1}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900">{m.student_name}</span>
                        <span className="font-mono text-[11px] text-slate-400">Student #{m.student_id}</span>
                        <StatusBadge status={m.match_status} />
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Result No: {m.result_no} • Evaluated for Project #{m.project_id}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Match Score</span>
                      <span className="text-lg font-black text-slate-900 font-mono">
                        {m.match_score}%
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectionTarget(m);
                        setAssignedRole('Developer');
                        setSelectError(null);
                      }}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 transition-colors"
                      title="Select candidate via transaction stored procedure"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Select Candidate</span>
                    </button>
                  </div>
                </div>

                {/* Matched vs Missing Skills */}
                <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-emerald-50/50 rounded border border-emerald-100">
                    <div className="flex items-center space-x-1.5 font-semibold text-emerald-900 mb-0.5">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      <span>Matched Skills:</span>
                    </div>
                    <span className="text-slate-700">
                      {m.matched_skills || <em className="text-slate-400">None</em>}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                    <div className="flex items-center space-x-1.5 font-semibold text-slate-700 mb-0.5">
                      <XCircle className="w-3 h-3 text-slate-400" />
                      <span>Missing Skills:</span>
                    </div>
                    <span className="text-slate-600">
                      {m.missing_skills || <strong className="text-emerald-700 font-medium">None (All Met)</strong>}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Select Candidate Modal (Transaction SP) */}
      <Modal
        isOpen={!!selectionTarget}
        onClose={() => setSelectionTarget(null)}
        title={`Execute Stored Procedure: Select_Student_For_Project`}
      >
        <form onSubmit={handleExecuteSelection} className="space-y-4">
          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded text-xs text-amber-900 leading-relaxed">
            <span className="font-bold">DBMS Concept 4 (Transactions):</span> This directly executes{' '}
            <code className="bg-amber-100 font-mono px-1 py-0.5 rounded">CALL Select_Student_For_Project(?, ?, ?)</code>.
            It performs atomic execution with row locking (<code className="bg-amber-100 font-mono px-1 py-0.5 rounded">FOR UPDATE</code>),
            validates application status, updates APPLICATION table to &apos;Selected&apos;, and inserts into PROJECT_MEMBER table.
          </div>

          {selectError && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{selectError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Candidate
            </label>
            <div className="text-xs p-2 bg-slate-100 rounded text-slate-800 font-semibold">
              {selectionTarget?.student_name} (#{selectionTarget?.student_id}) &rarr; Project #{selectionTarget?.project_id}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Role</label>
            <input
              type="text"
              required
              value={assignedRole}
              onChange={(e) => setAssignedRole(e.target.value)}
              placeholder="e.g. AI Specialist, Lead Architect"
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
              {selectLoading ? 'Running Procedure...' : 'Commit Transaction (SP)'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
