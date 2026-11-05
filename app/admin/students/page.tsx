'use client';

import React, { useEffect, useState } from 'react';
import { Search, Filter, Eye, Award, BookOpen, Mail } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Profile Modal
  const [activeStudent, setActiveStudent] = useState<any | null>(null);
  const [studentSkills, setStudentSkills] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  async function loadStudents() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedDept) params.set('dept_id', selectedDept);
      if (selectedYear) params.set('year', selectedYear);

      const [studRes, metaRes] = await Promise.all([
        fetch(`/api/students?${params.toString()}`),
        fetch('/api/metadata'),
      ]);

      if (studRes.ok) {
        const d = await studRes.json();
        setStudents(d.students || []);
      }
      if (metaRes.ok) {
        const m = await metaRes.json();
        setDepartments(m.departments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, [selectedDept, selectedYear]);

  async function viewProfile(student: any) {
    setActiveStudent(student);
    setModalLoading(true);
    try {
      const res = await fetch(`/api/students/${student.student_id}/skills`);
      if (res.ok) {
        const d = await res.json();
        setStudentSkills(d.skills || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Student Directory & Academic Records</h2>
        <p className="text-xs text-slate-500">
          Source: MySQL <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">STUDENT</code>, <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">DEPARTMENT</code>, and view <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">Student_Skill_Profile</code>
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadStudents();
          }}
          className="flex-1 w-full md:max-w-md relative"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name or student ID..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
          />
        </form>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.dept_id} value={d.dept_id}>
                {d.dept_name}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="">All Years</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">Querying student database...</div>
        ) : students.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">No student records match the query.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Year</th>
                <th className="py-3 px-4">CGPA</th>
                <th className="py-3 px-4">Supervisor</th>
                <th className="py-3 px-4">Skills</th>
                <th className="py-3 px-4 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {students.map((s) => (
                <tr key={s.student_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-600">#{s.student_id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{s.name}</td>
                  <td className="py-3 px-4 text-slate-600">{s.dept_name}</td>
                  <td className="py-3 px-4 text-slate-700">Year {s.year}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                    {s.cgpa !== null ? s.cgpa : '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {s.supervisor_name || <span className="italic text-slate-400">None</span>}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      {s.total_skills} {s.total_skills === 1 ? 'skill' : 'skills'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => viewProfile(s)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Student Skill Profile Modal (View: Student_Skill_Profile) */}
      <Modal
        isOpen={!!activeStudent}
        onClose={() => setActiveStudent(null)}
        title={`Student Skill Profile: ${activeStudent?.name} (#${activeStudent?.student_id})`}
        maxWidth="max-w-2xl"
      >
        {activeStudent && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded border border-slate-200 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-400">Department:</span>{' '}
                <strong className="text-slate-800">{activeStudent.dept_name}</strong>
              </div>
              <div>
                <span className="text-slate-400">Academic Year:</span>{' '}
                <strong className="text-slate-800">Year {activeStudent.year}</strong>
              </div>
              <div>
                <span className="text-slate-400">CGPA:</span>{' '}
                <strong className="text-slate-800">{activeStudent.cgpa}</strong>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Recorded Skills (from Student_Skill_Profile view)
                </h4>
                <span className="text-[11px] text-slate-500">
                  {studentSkills.length} total recorded
                </span>
              </div>

              {modalLoading ? (
                <div className="py-10 text-center text-xs text-slate-500">Loading skill records...</div>
              ) : studentSkills.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded border border-slate-100">
                  Student has no recorded skills.
                </div>
              ) : (
                <table className="w-full text-left border-collapse border border-slate-200 rounded">
                  <thead>
                    <tr className="bg-slate-100 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                      <th className="py-2 px-3">Skill</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3">Proficiency</th>
                      <th className="py-2 px-3">Experience</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {studentSkills.map((sk) => (
                      <tr key={sk.skill_id}>
                        <td className="py-2 px-3 font-semibold text-slate-900">{sk.skill_name}</td>
                        <td className="py-2 px-3 text-slate-600">{sk.skill_category}</td>
                        <td className="py-2 px-3">
                          <StatusBadge status={sk.proficiency_level} />
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-700">
                          {sk.years_experience} yrs
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveStudent(null)}
                className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
              >
                Close Profile
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
