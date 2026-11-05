'use client';

import React, { useEffect, useState } from 'react';
import { Briefcase, Users, Calendar, AlertCircle, CheckCircle2, Send } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function StudentBrowseProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDomain, setFilterDomain] = useState('');
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [projRes, appRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/applications'),
      ]);

      if (projRes.ok) {
        const pd = await projRes.json();
        setProjects(pd.projects || []);
      }
      if (appRes.ok) {
        const ad = await appRes.json();
        setApplications(ad.applications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const appliedProjectIds = new Set(applications.map((a) => a.project_id));

  async function handleApply(projectId: number, projectTitle: string) {
    setApplyingId(projectId);
    setFeedback(null);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Application rejected.');
      }

      setFeedback({
        type: 'success',
        text: `Application for "${projectTitle}" submitted successfully! Trigger Check_Application_Eligibility passed.`,
      });
      loadData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message,
      });
    } finally {
      setApplyingId(null);
    }
  }

  const filteredProjects = filterDomain
    ? projects.filter((p) => p.domain_name === filterDomain)
    : projects;

  const domains = Array.from(new Set(projects.map((p) => p.domain_name).filter(Boolean)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Browse Open Projects</h2>
          <p className="text-xs text-slate-500">
            Real-time capacity calculated with <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">LEFT JOIN</code> & <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">COUNT()</code>
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-600">Domain:</label>
          <select
            value={filterDomain}
            onChange={(e) => setFilterDomain(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="">All Domains</option>
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
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

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500">Loading project catalog...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="py-20 text-center text-xs text-slate-400">No projects found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredProjects.map((p) => {
            const hasApplied = appliedProjectIds.has(p.project_id);
            const isFull = p.slots_left <= 0;
            const isOpen = p.status === 'Open';

            return (
              <div
                key={p.project_id}
                className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                        Project #{p.project_id} • {p.domain_name}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">{p.title}</h3>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>

                  <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {p.description || 'No description provided.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs text-slate-600">
                    <div className="flex items-center space-x-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{p.client_name}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        <strong className="text-slate-800">{p.active_members}</strong> / {p.max_students} active
                        <span className={`ml-1 text-[11px] font-semibold ${isFull ? 'text-rose-600' : 'text-emerald-600'}`}>
                          ({p.slots_left} slots left)
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Required Skills */}
                  <div className="mt-4">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Required Skills
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {p.required_skills && p.required_skills.length > 0 ? (
                        p.required_skills.map((rs: any) => (
                          <span
                            key={rs.skill_id}
                            className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {rs.skill_name}{' '}
                            <span className="ml-1 text-[10px] text-slate-500 font-normal">
                              ({rs.required_level})
                            </span>
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-400">None specified</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {p.start_date || 'TBD'} &rarr; {p.end_date || 'TBD'}
                    </span>
                  </div>

                  <div>
                    {hasApplied ? (
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                        Applied
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApply(p.project_id, p.title)}
                        disabled={applyingId === p.project_id || !isOpen || isFull}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                          !isOpen || isFull
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                        }`}
                        title={
                          !isOpen
                            ? 'Project is not Open'
                            : isFull
                            ? 'Project has reached capacity'
                            : 'Apply now'
                        }
                      >
                        <Send className="w-3 h-3" />
                        <span>
                          {applyingId === p.project_id
                            ? 'Validating...'
                            : isFull
                            ? 'Full'
                            : !isOpen
                            ? 'Closed'
                            : 'Apply'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

