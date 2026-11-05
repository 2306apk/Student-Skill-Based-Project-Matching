'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Users, Briefcase, AlertCircle, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { ProjectStatus } from '@/types';

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<any>({ clients: [], domains: [], skills: [] });
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createProjectId, setCreateProjectId] = useState('');
  const [createTitle, setCreateTitle] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createStartDate, setCreateStartDate] = useState('');
  const [createEndDate, setCreateEndDate] = useState('');
  const [createMaxStudents, setCreateMaxStudents] = useState('4');
  const [createStatus, setCreateStatus] = useState<ProjectStatus>('Open');
  const [createClientId, setCreateClientId] = useState('');
  const [createDomainId, setCreateDomainId] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Modal
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editMaxStudents, setEditMaxStudents] = useState('4');
  const [editStatus, setEditStatus] = useState<ProjectStatus>('Open');
  const [editError, setEditError] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [projRes, metaRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/metadata'),
      ]);

      if (projRes.ok) {
        const pd = await projRes.json();
        setProjects(pd.projects || []);
      }
      if (metaRes.ok) {
        setMetadata(await metaRes.json());
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

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: Number(createProjectId),
          title: createTitle,
          description: createDesc || null,
          start_date: createStartDate || null,
          end_date: createEndDate || null,
          max_students: Number(createMaxStudents),
          status: createStatus,
          client_id: Number(createClientId),
          domain_id: Number(createDomainId),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create project');

      setIsCreateOpen(false);
      setCreateProjectId('');
      setCreateTitle('');
      setCreateDesc('');
      setFeedback({ type: 'success', text: `Project #${createProjectId} created successfully in MySQL database.` });
      loadData();
    } catch (err: any) {
      setCreateError(err.message);
    }
  }

  async function handleUpdateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProject) return;
    setEditError(null);

    try {
      const res = await fetch(`/api/projects/${editingProject.project_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDesc || null,
          max_students: Number(editMaxStudents),
          status: editStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update project');

      setEditingProject(null);
      setFeedback({
        type: 'success',
        text: `Project #${editingProject.project_id} updated. Trigger Check_Project_Max_Students_Update verified.`,
      });
      loadData();
    } catch (err: any) {
      setEditError(err.message);
    }
  }

  async function handleDeleteProject(projectId: number, projectTitle: string) {
    if (
      !confirm(
        `Are you sure you want to permanently delete Project #${projectId} ("${projectTitle}")?\n\nWARNING: All associated applications, skills, and memberships will cascade or be checked.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete project');

      setFeedback({ type: 'success', text: `Project #${projectId} deleted successfully.` });
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Project Management</h2>
          <p className="text-xs text-slate-500">
            Source: MySQL <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">PROJECT</code>, <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">CLIENT</code>, and <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">DOMAIN</code> tables
          </p>
        </div>

        <button
          onClick={() => {
            setIsCreateOpen(true);
            setCreateError(null);
          }}
          className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Project</span>
        </button>
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

      {/* Projects Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">Loading project records...</div>
        ) : projects.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">No projects defined in database.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Project Title</th>
                <th className="py-3 px-4">Domain</th>
                <th className="py-3 px-4">Client Organization</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {projects.map((p) => (
                <tr key={p.project_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-600">#{p.project_id}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{p.title}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">{p.description}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-700">{p.domain_name}</td>
                  <td className="py-3 px-4 text-slate-600">{p.client_name}</td>
                  <td className="py-3 px-4 font-mono">
                    <span className="font-bold text-slate-900">{p.active_members}</span> / {p.max_students}
                    <span className="ml-1 text-[11px] text-slate-500">({p.slots_left} slots)</span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5">
                    <button
                      onClick={() => {
                        setEditingProject(p);
                        setEditTitle(p.title);
                        setEditDesc(p.description || '');
                        setEditMaxStudents(p.max_students.toString());
                        setEditStatus(p.status);
                        setEditError(null);
                      }}
                      className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      title="Edit project"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(p.project_id, p.title)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete project"
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

      {/* Create Project Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Project">
        <form onSubmit={handleCreateProject} className="space-y-4">
          {createError && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project ID</label>
              <input
                type="number"
                required
                value={createProjectId}
                onChange={(e) => setCreateProjectId(e.target.value)}
                placeholder="e.g. 505"
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Students (CHECK &gt; 0)</label>
              <input
                type="number"
                min="1"
                required
                value={createMaxStudents}
                onChange={(e) => setCreateMaxStudents(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Project Title</label>
            <input
              type="text"
              required
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder="e.g. Distributed Database Engine"
              className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
              placeholder="Detailed description of the project requirements and deliverables..."
              className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Client Organization</label>
              <select
                required
                value={createClientId}
                onChange={(e) => setCreateClientId(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
              >
                <option value="">-- Choose Client --</option>
                {metadata.clients.map((c: any) => (
                  <option key={c.client_id} value={c.client_id}>
                    {c.org_name} ({c.contact_name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Domain</label>
              <select
                required
                value={createDomainId}
                onChange={(e) => setCreateDomainId(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
              >
                <option value="">-- Choose Domain --</option>
                {metadata.domains.map((d: any) => (
                  <option key={d.domain_id} value={d.domain_id}>
                    {d.domain_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={createStartDate}
                onChange={(e) => setCreateStartDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={createEndDate}
                onChange={(e) => setCreateEndDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded text-xs font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
            >
              Insert Project
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        title={`Edit Project #${editingProject?.project_id}`}
      >
        <form onSubmit={handleUpdateProject} className="space-y-4">
          {editError && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Max Students (Trigger Check)
              </label>
              <input
                type="number"
                min="1"
                required
                value={editMaxStudents}
                onChange={(e) => setEditMaxStudents(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Current active members: {editingProject?.active_members}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Closed">Closed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingProject(null)}
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
