'use client';

import React, { useEffect, useState } from 'react';
import { Award, CheckCircle, XCircle } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function StudentMatchResultsPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMatches() {
      try {
        const res = await fetch('/api/matches/me');
        if (res.ok) {
          const data = await res.json();
          setMatches(data.matches || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Project Match Results</h2>
        <p className="text-xs text-slate-500">
          Queried directly from MySQL view <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">Project_Match_Summary</code> joining <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">MATCH_RESULT</code>, <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">STUDENT</code>, and <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">PROJECT</code>
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">Loading stored match evaluations...</div>
        ) : matches.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">
            No match results recorded for your profile.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {matches.map((m, idx) => (
              <div key={idx} className="p-5 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-mono text-slate-400">
                        Result #{m.result_no} • Project #{m.project_id}
                      </span>
                      <StatusBadge status={m.match_status} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{m.project_title}</h3>
                  </div>

                  <div className="flex items-center sm:flex-col sm:items-end justify-between">
                    <span className="text-[11px] font-medium text-slate-500">Stored Match Score</span>
                    <div className="text-xl font-extrabold text-slate-900 flex items-center space-x-1">
                      <Award className="w-5 h-5 text-amber-500" />
                      <span>{m.match_score}%</span>
                    </div>
                  </div>
                </div>

                {/* Matched vs Missing Skills */}
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-emerald-50/50 p-3 rounded border border-emerald-100">
                    <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-800 mb-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Matched Skills</span>
                    </div>
                    <p className="text-xs text-slate-700">
                      {m.matched_skills || <span className="text-slate-400 italic">None</span>}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded border border-slate-200">
                    <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 mb-1">
                      <XCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>Missing Skills</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {m.missing_skills || <span className="text-emerald-700 font-medium">All required skills met!</span>}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded text-xs text-slate-500">
        <span className="font-semibold text-slate-700">Database Grounding:</span> Stored scores represent precomputed algorithmic assessments recorded in the <code className="text-slate-700 font-mono">MATCH_RESULT</code> relational table with check constraints (<code className="text-slate-700 font-mono">0 &lt;= match_score &lt;= 100</code>).
      </div>
    </div>
  );
}
