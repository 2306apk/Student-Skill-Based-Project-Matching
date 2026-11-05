'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Wrench,
  Send,
  CheckCircle2,
  FolderGit2,
  Award,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function StudentDashboardOverview() {
  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [profRes, skillsRes, appsRes, memRes, matchRes] = await Promise.all([
          fetch('/api/students/me'),
          fetch('/api/students/me/skills'),
          fetch('/api/applications'),
          fetch('/api/memberships'),
          fetch('/api/matches/me'),
        ]);

        if (profRes.ok) setProfile((await profRes.json()).student);
        if (skillsRes.ok) setSkills((await skillsRes.json()).skills || []);
        if (appsRes.ok) setApplications((await appsRes.json()).applications || []);
        if (memRes.ok) setMemberships((await memRes.json()).memberships || []);
        if (matchRes.ok) setMatches((await matchRes.json()).matches || []);
      } catch (err) {
        console.error('Error fetching student overview:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500 text-sm">
        Loading student profile and records...
      </div>
    );
  }

  const shortlistedCount = applications.filter((a) => a.application_status === 'Shortlisted').length;
  const selectedCount = applications.filter((a) => a.application_status === 'Selected').length;
  const bestMatch = matches.length > 0 ? matches[0] : null;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Student Dashboard
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Welcome back, {profile?.name || 'Student'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Department of {profile?.dept_name} • Year {profile?.year} • CGPA:{' '}
            <span className="font-semibold text-slate-800">{profile?.cgpa ?? 'N/A'}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/student/projects"
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold shadow-sm transition-colors"
          >
            <span>Browse Projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/student/skills"
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded text-xs font-semibold transition-colors"
          >
            <span>Update Skills</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Recorded Skills</span>
            <div className="w-7 h-7 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wrench className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{skills.length}</div>
          <div className="mt-1 text-[11px] text-slate-400">Queried from Student_Skill_Profile</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Submitted Applications</span>
            <div className="w-7 h-7 rounded bg-amber-50 text-amber-600 flex items-center justify-center">
              <Send className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{applications.length}</div>
          <div className="mt-1 text-[11px] text-slate-400">Total active & past applications</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Shortlisted / Selected</span>
            <div className="w-7 h-7 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {shortlistedCount + selectedCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {selectedCount} selected, {shortlistedCount} shortlisted
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Project Memberships</span>
            <div className="w-7 h-7 rounded bg-purple-50 text-purple-600 flex items-center justify-center">
              <FolderGit2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{memberships.length}</div>
          <div className="mt-1 text-[11px] text-slate-400">Active development roles</div>
        </div>
      </div>

      {/* Two Columns: Recent Applications & Top Stored Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Recent Applications</h3>
              <p className="text-xs text-slate-500">Live statuses from APPLICATION table</p>
            </div>
            <Link
              href="/student/applications"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {applications.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                You have not submitted any applications yet.
              </div>
            ) : (
              applications.slice(0, 4).map((app, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-slate-800">{app.project_title}</div>
                    <div className="text-[11px] text-slate-400">Applied on: {app.application_date}</div>
                  </div>
                  <StatusBadge status={app.application_status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Match Results */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Stored Project Matches</h3>
              <p className="text-xs text-slate-500">From Project_Match_Summary view</p>
            </div>
            <Link
              href="/student/matches"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {matches.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No match results recorded yet.
              </div>
            ) : (
              matches.slice(0, 4).map((m, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div className="max-w-[70%]">
                    <div className="text-xs font-medium text-slate-800 truncate">
                      {m.project_title}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      Matched: <span className="text-slate-600">{m.matched_skills || 'None'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">{m.match_score}%</div>
                    <StatusBadge status={m.match_status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
