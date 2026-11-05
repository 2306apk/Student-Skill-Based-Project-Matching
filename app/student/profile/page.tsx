'use client';

import React, { useEffect, useState } from 'react';
import { User, Mail, Award, BookOpen, UserCheck, Shield } from 'lucide-react';

export default function StudentProfilePage() {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/students/me');
        if (res.ok) {
          const data = await res.json();
          setStudent(data.student);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-500">Loading student profile...</div>;
  }

  if (!student) {
    return (
      <div className="bg-white p-6 rounded-lg border border-slate-200 text-sm text-slate-600">
        Profile record could not be loaded.
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Student Profile</h2>
        <p className="text-xs text-slate-500">
          Source of truth: MySQL <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">STUDENT</code> & <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">DEPARTMENT</code> tables
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-4">
          <div className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center text-xl font-bold">
            {student.name?.charAt(0)}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{student.name}</h3>
            <p className="text-xs text-slate-500">
              Student ID: <span className="font-mono text-slate-700 font-semibold">{student.student_id}</span>
            </p>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <BookOpen className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-slate-500">Department</div>
                <div className="text-sm font-semibold text-slate-800">{student.dept_name}</div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Award className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-slate-500">Current Year</div>
                <div className="text-sm font-semibold text-slate-800">Year {student.year} of 4</div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Shield className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-slate-500">Cumulative GPA (CGPA)</div>
                <div className="text-sm font-semibold text-slate-800">
                  {student.cgpa !== null ? `${student.cgpa} / 10.00` : 'Not recorded'}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <UserCheck className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-slate-500">Assigned Student Supervisor</div>
                <div className="text-sm font-semibold text-slate-800">
                  {student.supervisor_name ? `${student.supervisor_name} (ID: ${student.supervisor_id})` : 'None assigned (Independent)'}
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Mail className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <div className="text-xs font-medium text-slate-500">Registered Email Addresses (STUDENT_EMAIL)</div>
                <div className="mt-1 space-y-1">
                  {student.emails && student.emails.length > 0 ? (
                    student.emails.map((email: string, i: number) => (
                      <div key={i} className="text-xs font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200 inline-block mr-2">
                        {email}
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">No emails registered</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Integrity constraint:</span> CGPA check constraint enforces <code className="text-slate-700 font-mono">0 &lt;= cgpa &lt;= 10</code>. Year check constraint enforces <code className="text-slate-700 font-mono">1 &lt;= year &lt;= 4</code>.
        </div>
      </div>
    </div>
  );
}

