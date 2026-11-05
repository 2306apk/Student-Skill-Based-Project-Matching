'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Database, BarChart3, TrendingUp, Layers, Award } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

const CHART_COLORS = ['#102a43', '#243b53', '#334e68', '#486581', '#627d98', '#829ab1'];

export default function AdminAnalyticsPage() {
  const [sqlData, setSqlData] = useState<any>(null);
  const [mongoData, setMongoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const [projRes, actRes] = await Promise.all([
          fetch('/api/analytics/projects'),
          fetch('/api/analytics/activity'),
        ]);

        if (projRes.ok) setSqlData(await projRes.json());
        if (actRes.ok) setMongoData(await actRes.json());
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading) {
    return <div className="py-24 text-center text-xs text-slate-500">Executing database analytics queries...</div>;
  }

  const applicantsChartData =
    sqlData?.applicantsByProject?.map((p: any) => ({
      name: p.project_title.length > 18 ? p.project_title.slice(0, 18) + '...' : p.project_title,
      applicants: p.applicant_count,
    })) || [];

  const scoresChartData =
    sqlData?.matchScoresByProject?.map((p: any) => ({
      name: p.project_title.length > 18 ? p.project_title.slice(0, 18) + '...' : p.project_title,
      avgScore: Number(p.avg_score),
      bestScore: Number(p.best_score),
    })) || [];

  const mongoEventsChartData =
    mongoData?.eventsByType?.map((e: any) => ({
      name: e._id,
      count: e.count,
    })) || [];

  const dailyTrendData =
    mongoData?.dailyTrend?.map((d: any) => ({
      date: d._id,
      events: d.count,
    })) || [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Advanced Database Analytics & Aggregations</h2>
        <p className="text-xs text-slate-500">
          Real database executions demonstrating SQL Aggregates, Views, Subqueries, and MongoDB Aggregation Pipelines
        </p>
      </div>

      {/* SECTION 1: SQL Relational Analytics */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
          <Database className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            SQL Relational Queries (MySQL 8.4)
          </h3>
        </div>

        {/* Chart Row 1: Applicants per Project & Average/Best Match Scores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Applicants per Project */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <div className="mb-4">
              <h4 className="text-xs font-bold text-slate-900">
                1. Applicants by Project (GROUP BY & COUNT)
              </h4>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                SELECT project_title, COUNT(*) FROM Project_Applicants GROUP BY ...
              </p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={applicantsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '4px', borderColor: '#e2e8f0' }} />
                  <Bar dataKey="applicants" fill="#243b53" radius={[4, 4, 0, 0]} name="Applicants" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Average & Best Match Score per Project */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <div className="mb-4">
              <h4 className="text-xs font-bold text-slate-900">
                2. Match Score Distribution (AVG & MAX Aggregates)
              </h4>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                SELECT ROUND(AVG(match_score), 2), MAX(match_score) FROM Project_Match_Summary GROUP BY ...
              </p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoresChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '4px', borderColor: '#e2e8f0' }} />
                  <Bar dataKey="avgScore" fill="#627d98" radius={[4, 4, 0, 0]} name="Average Score %" />
                  <Bar dataKey="bestScore" fill="#102a43" radius={[4, 4, 0, 0]} name="Top Score %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Table Queries: Skills Per Student & Projects with Multiple Applicants */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Skills per student */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <div className="mb-3">
              <h4 className="text-xs font-bold text-slate-900">
                3. Skills Per Student (GROUP BY student_id & COUNT)
              </h4>
              <p className="text-[11px] text-slate-400 font-mono">
                SELECT student_name, COUNT(skill_id), AVG(years_experience) FROM Student_Skill_Profile ...
              </p>
            </div>
            <table className="w-full text-left text-xs border border-slate-100 rounded">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                  <th className="py-2 px-3">Student</th>
                  <th className="py-2 px-3">Skill Count</th>
                  <th className="py-2 px-3">Avg Experience</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sqlData?.skillsPerStudent?.map((s: any) => (
                  <tr key={s.student_id}>
                    <td className="py-2 px-3 font-semibold text-slate-800">{s.student_name}</td>
                    <td className="py-2 px-3 font-mono">{s.skill_count} skills</td>
                    <td className="py-2 px-3 font-mono">{s.avg_experience} yrs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Projects with Multiple Applicants (HAVING) */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <div className="mb-3">
              <h4 className="text-xs font-bold text-slate-900">
                4. Projects with &gt; 1 Applicant (HAVING COUNT(*) &gt; 1)
              </h4>
              <p className="text-[11px] text-slate-400 font-mono">
                SELECT project_title, COUNT(*) FROM Project_Applicants GROUP BY ... HAVING COUNT(*) &gt; 1
              </p>
            </div>
            <table className="w-full text-left text-xs border border-slate-100 rounded">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                  <th className="py-2 px-3">Project Title</th>
                  <th className="py-2 px-3">Applicants Count</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sqlData?.projectsWithMultipleApplicants?.map((p: any) => (
                  <tr key={p.project_id}>
                    <td className="py-2 px-3 font-semibold text-slate-800">{p.project_title}</td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">
                      {p.applicants} applicants
                    </td>
                    <td className="py-2 px-3 text-emerald-700 font-medium">Multiple Candidates</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subquery Demo: Matches Above Overall Average */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="mb-3">
            <h4 className="text-xs font-bold text-slate-900">
              5. Candidates Above Overall Average Match Score (SUBQUERY)
            </h4>
            <p className="text-[11px] text-slate-400 font-mono">
              SELECT * FROM Project_Match_Summary WHERE match_score &gt; (SELECT AVG(match_score) FROM MATCH_RESULT)
            </p>
          </div>
          <table className="w-full text-left text-xs border border-slate-100 rounded">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                <th className="py-2 px-3">Student Name</th>
                <th className="py-2 px-3">Project Title</th>
                <th className="py-2 px-3">Match Score</th>
                <th className="py-2 px-3">Match Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sqlData?.matchesAboveAverage?.map((m: any, idx: number) => (
                <tr key={idx}>
                  <td className="py-2 px-3 font-semibold text-slate-800">{m.student_name}</td>
                  <td className="py-2 px-3 text-slate-700">{m.project_title}</td>
                  <td className="py-2 px-3 font-mono font-bold text-slate-900">{m.match_score}%</td>
                  <td className="py-2 px-3">
                    <StatusBadge status={m.match_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: MongoDB NoSQL Aggregation Pipelines */}
      <div className="space-y-6 pt-4 border-t border-slate-200">
        <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
          <Layers className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            MongoDB NoSQL Aggregation Pipelines (MongoDB 7.0)
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Event Breakdown by Type */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <div className="mb-4">
              <h4 className="text-xs font-bold text-slate-900">
                6. Activity Count by Event Type ($group &amp; $sort)
              </h4>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                db.activity_logs.aggregate([ &#123; $group: &#123; _id: &quot;$eventType&quot;, count: &#123; $sum: 1 &#125; &#125; &#125; ])
              </p>
            </div>
            <div className="h-64">
              {mongoEventsChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No MongoDB events logged yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mongoEventsChartData} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748b' }} width={120} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '4px', borderColor: '#e2e8f0' }} />
                    <Bar dataKey="count" fill="#334e68" radius={[0, 4, 4, 0]} name="Logged Events" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Daily Activity Timeline */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <div className="mb-4">
              <h4 className="text-xs font-bold text-slate-900">
                7. Daily Timeline Trend ($match, $project, $group)
              </h4>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                db.activity_logs.aggregate([ &#123; $project: &#123; dateStr: &#123; $substr: [&quot;$timestamp&quot;, 0, 10] &#125; &#125; &#125; ... ])
              </p>
            </div>
            <div className="h-64">
              {dailyTrendData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No activity trend data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '4px', borderColor: '#e2e8f0' }} />
                    <Line type="monotone" dataKey="events" stroke="#102a43" strokeWidth={2} dot={{ r: 4 }} name="Total Events" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

