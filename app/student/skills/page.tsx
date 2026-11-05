'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { ProficiencyLevel } from '@/types';

export default function StudentSkillsPage() {
  const [skills, setSkills] = useState<any[]>([]);
  const [availableSkills, setAvailableSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addSkillId, setAddSkillId] = useState('');
  const [addProficiency, setAddProficiency] = useState<ProficiencyLevel>('Intermediate');
  const [addExperience, setAddExperience] = useState('1.0');
  const [addError, setAddError] = useState<string | null>(null);

  // Edit Modal State
  const [editingSkill, setEditingSkill] = useState<any | null>(null);
  const [editProficiency, setEditProficiency] = useState<ProficiencyLevel>('Intermediate');
  const [editExperience, setEditExperience] = useState('1.0');
  const [editError, setEditError] = useState<string | null>(null);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [skillsRes, metaRes] = await Promise.all([
        fetch('/api/students/me/skills'),
        fetch('/api/metadata'),
      ]);

      if (skillsRes.ok) {
        const d = await skillsRes.json();
        setSkills(d.skills || []);
      }
      if (metaRes.ok) {
        const m = await metaRes.json();
        setAvailableSkills(m.skills || []);
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

  async function handleAddSkill(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    try {
      const res = await fetch('/api/students/me/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill_id: Number(addSkillId),
          proficiency_level: addProficiency,
          years_experience: Number(addExperience),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record skill');

      setIsAddOpen(false);
      setAddSkillId('');
      setMessage({ type: 'success', text: 'Skill added to STUDENT_SKILL profile.' });
      loadData();
    } catch (err: any) {
      setAddError(err.message);
    }
  }

  async function handleUpdateSkill(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSkill) return;
    setEditError(null);
    try {
      const res = await fetch(`/api/students/me/skills/${editingSkill.skill_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proficiency_level: editProficiency,
          years_experience: Number(editExperience),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update skill');

      setEditingSkill(null);
      setMessage({ type: 'success', text: 'Skill updated successfully.' });
      loadData();
    } catch (err: any) {
      setEditError(err.message);
    }
  }

  async function handleDeleteSkill(skillId: number, skillName: string) {
    if (!confirm(`Are you sure you want to remove ${skillName} from your profile?`)) return;

    try {
      const res = await fetch(`/api/students/me/skills/${skillId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete skill');

      setMessage({ type: 'success', text: `Removed ${skillName} from profile.` });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  // Filter skills not yet added
  const recordedSkillIds = new Set(skills.map((s) => s.skill_id));
  const unrecordedSkills = availableSkills.filter((s) => !recordedSkillIds.has(s.skill_id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">My Recorded Skills</h2>
          <p className="text-xs text-slate-500">
            Backed by MySQL view <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">Student_Skill_Profile</code> and table <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">STUDENT_SKILL</code>
          </p>
        </div>

        <button
          onClick={() => {
            setIsAddOpen(true);
            setAddError(null);
          }}
          className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Skill</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-3 rounded text-xs flex items-center space-x-2 border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Skills Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500">Loading skill records...</div>
        ) : skills.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No skills recorded in your profile yet. Click &quot;Add Skill&quot; above.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Skill ID</th>
                <th className="py-3 px-4">Skill Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Proficiency</th>
                <th className="py-3 px-4">Experience</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {skills.map((s) => (
                <tr key={s.skill_id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500">#{s.skill_id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{s.skill_name}</td>
                  <td className="py-3 px-4 text-slate-600">{s.skill_category}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={s.proficiency_level} />
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    {s.years_experience} {s.years_experience === 1 ? 'yr' : 'yrs'}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setEditingSkill(s);
                        setEditProficiency(s.proficiency_level);
                        setEditExperience(s.years_experience.toString());
                        setEditError(null);
                      }}
                      className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      title="Edit proficiency / experience"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSkill(s.skill_id, s.skill_name)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove skill"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Skill Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Record New Skill">
        <form onSubmit={handleAddSkill} className="space-y-4">
          {addError && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{addError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Skill</label>
            <select
              required
              value={addSkillId}
              onChange={(e) => setAddSkillId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
            >
              <option value="">-- Choose a skill from catalog --</option>
              {unrecordedSkills.map((sk) => (
                <option key={sk.skill_id} value={sk.skill_id}>
                  {sk.skill_name} ({sk.category_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Proficiency Level (CHECK Constraint)
            </label>
            <select
              value={addProficiency}
              onChange={(e) => setAddProficiency(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Years of Experience
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="40"
              required
              value={addExperience}
              onChange={(e) => setAddExperience(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded text-xs font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
            >
              Record Skill
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Skill Modal */}
      <Modal
        isOpen={!!editingSkill}
        onClose={() => setEditingSkill(null)}
        title={`Update Skill: ${editingSkill?.skill_name}`}
      >
        <form onSubmit={handleUpdateSkill} className="space-y-4">
          {editError && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Proficiency Level
            </label>
            <select
              value={editProficiency}
              onChange={(e) => setEditProficiency(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Years of Experience
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="40"
              required
              value={editExperience}
              onChange={(e) => setEditExperience(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingSkill(null)}
              className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded text-xs font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
