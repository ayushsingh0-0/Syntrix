import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FolderKanban,
  Users,
  Settings,
  UserPlus,
  Trash2,
  Archive,
  RotateCcw,
  ArrowLeft,
  Save,
  Kanban,
  ListFilter,
  Flame,
  BarChart2,
} from 'lucide-react';
import { useOrg, useToast } from '../../context';
import api from '../../services/api';
import { getErrorMessage } from '../../utils/error';
import { Button } from '../../components/common/Button';
import { FormField, Input, Textarea, Select } from '../../components/common/FormComponents';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DataTable, type DataTableColumn } from '../../components/common/DataTable';
import type {
  Project,
  ProjectMember,
  OrganizationMember,
  Team,
  ProjectStatus,
  ProjectPriority,
  ProjectRole,
} from '../../types';

export const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentOrg } = useOrg();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [orgMembers, setOrgMembers] = useState<OrganizationMember[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'settings'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Settings form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('ACTIVE');
  const [priority, setPriority] = useState<ProjectPriority>('MEDIUM');
  const [teamId, setTeamId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Add member form state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<ProjectRole>('MEMBER');
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Delete Project Confirm Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Remove Member Confirm Dialog
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  const fetchProjectData = useCallback(async () => {
    if (!currentOrg || !projectId) return;
    try {
      const [projRes, membersRes, orgMembersRes, teamsRes] = await Promise.all([
        api.get(`/organizations/${currentOrg.id}/projects/${projectId}`),
        api.get(`/organizations/${currentOrg.id}/projects/${projectId}/members`),
        api.get(`/organizations/${currentOrg.id}/members`),
        api.get(`/organizations/${currentOrg.id}/teams`),
      ]);

      const p: Project = projRes.data.data;
      setProject(p);
      setName(p.name);
      setDescription(p.description || '');
      setStatus(p.status);
      setPriority(p.priority);
      setTeamId(p.teamId || '');

      setMembers(membersRes.data.data || []);
      setOrgMembers(orgMembersRes.data.data || []);
      setTeams(teamsRes.data.data || []);
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Project not found'));
      navigate('/projects');
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg, projectId, navigate, showToast]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !projectId) return;

    setIsSaving(true);
    try {
      const { data } = await api.put(`/organizations/${currentOrg.id}/projects/${projectId}`, {
        name: name.trim(),
        description: description.trim() || null,
        status,
        priority,
        teamId: teamId || null,
      });
      setProject(data.data);
      showToast('success', 'Project settings updated!');
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to update project'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchiveToggle = async () => {
    if (!currentOrg || !projectId || !project) return;
    const action = project.isArchived ? 'restore' : 'archive';

    try {
      const { data } = await api.patch(
        `/organizations/${currentOrg.id}/projects/${projectId}/${action}`
      );
      setProject(data.data);
      showToast('success', `Project ${project.isArchived ? 'restored' : 'archived'}!`);
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, `Failed to ${action} project`));
    }
  };

  const confirmDeleteProject = async () => {
    if (!currentOrg || !projectId || !project) return;
    setIsDeleting(true);
    try {
      await api.delete(`/organizations/${currentOrg.id}/projects/${projectId}`);
      showToast('success', 'Project deleted successfully');
      navigate('/projects');
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to delete project'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !projectId || !selectedUserId) return;

    setIsAddingMember(true);
    try {
      await api.post(`/organizations/${currentOrg.id}/projects/${projectId}/members`, {
        userId: selectedUserId,
        role: selectedRole,
      });
      showToast('success', 'Member added to project!');
      setSelectedUserId('');
      fetchProjectData();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to add member'));
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: ProjectRole) => {
    if (!currentOrg || !projectId) return;
    try {
      await api.patch(`/organizations/${currentOrg.id}/projects/${projectId}/members/${userId}`, {
        role: newRole,
      });
      showToast('success', 'Project role updated!');
      fetchProjectData();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to update role'));
    }
  };

  const confirmRemoveMember = async () => {
    if (!currentOrg || !projectId || !memberToRemove) return;
    setIsRemovingMember(true);
    try {
      await api.delete(
        `/organizations/${currentOrg.id}/projects/${projectId}/members/${memberToRemove.id}`
      );
      showToast('success', `${memberToRemove.name} removed from project.`);
      setMemberToRemove(null);
      fetchProjectData();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to remove member'));
    } finally {
      setIsRemovingMember(false);
    }
  };

  if (isLoading || !project) {
    return <div className="text-slate-400 py-12 text-center text-xs">Loading project details...</div>;
  }

  const existingMemberUserIds = members.map((m) => m.userId);
  const eligibleOrgMembers = orgMembers.filter((om) => !existingMemberUserIds.includes(om.userId));

  const memberColumns: DataTableColumn<ProjectMember>[] = [
    {
      key: 'user',
      header: 'Collaborator',
      render: (m) => (
        <div className="flex items-center gap-3">
          {m.user?.avatarUrl ? (
            <img
              src={m.user.avatarUrl}
              alt={m.user.name}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400">
              {m.user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-semibold text-sm text-slate-100">{m.user?.name}</div>
            <div className="text-xs text-slate-400">{m.user?.bio || 'Project Member'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Assigned Role',
      render: (m) => (
        <select
          className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={m.role}
          onChange={(e) => handleRoleChange(m.userId, e.target.value as ProjectRole)}
        >
          <option value="LEAD">LEAD</option>
          <option value="MEMBER">MEMBER</option>
          <option value="VIEWER">VIEWER</option>
        </select>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (m) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMemberToRemove({ id: m.userId, name: m.user.name })}
          className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Quick Action Links */}
      <div className="space-y-3">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded text-sm font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
              {project.key}
            </span>
            <h1 className="text-2xl font-bold text-slate-100">{project.name}</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
              {project.status}
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <Link to={`/projects/${project.id}/analytics`}>
              <Button variant="secondary" size="sm" leftIcon={<BarChart2 className="w-3.5 h-3.5 text-indigo-400" />}>
                Analytics
              </Button>
            </Link>
            <Link to={`/projects/${project.id}/sprints`}>
              <Button variant="secondary" size="sm" leftIcon={<Flame className="w-3.5 h-3.5 text-amber-400" />}>
                Sprints
              </Button>
            </Link>
            <Link to={`/projects/${project.id}/tasks`}>
              <Button variant="secondary" size="sm" leftIcon={<ListFilter className="w-3.5 h-3.5" />}>
                Tasks
              </Button>
            </Link>
            <Link to={`/projects/${project.id}/board`}>
              <Button variant="primary" size="sm" leftIcon={<Kanban className="w-3.5 h-3.5" />}>
                Kanban Board
              </Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={handleArchiveToggle}>
              {project.isArchived ? (
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Archive className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-px">
        {[
          { key: 'overview' as const, label: 'Overview', icon: <FolderKanban className="w-4 h-4" /> },
          {
            key: 'members' as const,
            label: `Members (${members.length})`,
            icon: <Users className="w-4 h-4" />,
          },
          { key: 'settings' as const, label: 'Settings', icon: <Settings className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
            <h3 className="text-base font-semibold text-slate-100">Project Mission & Description</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {project.description || 'No description provided for this project.'}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4">
            <h3 className="text-base font-semibold text-slate-100">Properties & Governance</h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Priority</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {project.priority}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Lifecycle Status</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {project.status}
                </span>
              </div>
              {project.team && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Assigned Team</span>
                  <span className="font-semibold text-violet-300">{project.team.name}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Created Date</span>
                <span className="text-slate-200 font-mono">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Add Member Form */}
          <form
            onSubmit={handleAddMember}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-3 shadow-lg"
          >
            <span className="text-xs font-bold text-slate-200">Add Collaborator:</span>
            <div className="flex-1 min-w-[200px]">
              <Select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                options={[
                  { value: '', label: '-- Choose workspace member --' },
                  ...eligibleOrgMembers.map((om) => ({
                    value: om.userId,
                    label: `${om.user.name} (${om.user.email})`,
                  })),
                ]}
              />
            </div>

            <div className="w-36">
              <Select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as ProjectRole)}
                options={[
                  { value: 'MEMBER', label: 'MEMBER' },
                  { value: 'LEAD', label: 'LEAD' },
                  { value: 'VIEWER', label: 'VIEWER' },
                ]}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isAddingMember}
              disabled={!selectedUserId}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Add
            </Button>
          </form>

          {/* Members Table */}
          <DataTable
            columns={memberColumns}
            data={members}
            isLoading={false}
            emptyTitle="No project members"
            emptyDescription="Add collaborators from the workspace to begin assigning tasks."
          />
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl space-y-6">
          <form
            onSubmit={handleUpdateSettings}
            className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-4"
          >
            <h3 className="text-base font-semibold text-slate-100">Project Configuration</h3>

            <FormField label="Project Name" required>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Status">
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  options={[
                    { value: 'PLANNING', label: 'PLANNING' },
                    { value: 'ACTIVE', label: 'ACTIVE' },
                    { value: 'ON_HOLD', label: 'ON_HOLD' },
                    { value: 'COMPLETED', label: 'COMPLETED' },
                    { value: 'ARCHIVED', label: 'ARCHIVED' },
                  ]}
                />
              </FormField>

              <FormField label="Priority">
                <Select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as ProjectPriority)}
                  options={[
                    { value: 'LOW', label: 'LOW' },
                    { value: 'MEDIUM', label: 'MEDIUM' },
                    { value: 'HIGH', label: 'HIGH' },
                    { value: 'URGENT', label: 'URGENT' },
                  ]}
                />
              </FormField>
            </div>

            <FormField label="Assigned Team">
              <Select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                options={[
                  { value: '', label: '-- No Team (Org-wide) --' },
                  ...teams.map((t) => ({ value: t.id, label: t.name })),
                ]}
              />
            </FormField>

            <FormField label="Description">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </FormField>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Settings
              </Button>
            </div>
          </form>

          {/* Danger Zone */}
          <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-6 shadow-lg space-y-4">
            <h3 className="text-base font-semibold text-rose-400">Danger Zone</h3>
            <p className="text-xs text-slate-300">
              Permanently delete this project and all associated tasks, comments, and milestones.
            </p>
            <div className="flex justify-end">
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Delete Project
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Project Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDeleteProject}
        isLoading={isDeleting}
        title={`Delete Project "${project.name}"`}
        message="Are you sure you want to permanently delete this project? All associated tasks, boards, and milestones will be permanently removed."
        confirmText="Delete Project"
        variant="danger"
      />

      {/* Remove Member Dialog */}
      <ConfirmDialog
        isOpen={Boolean(memberToRemove)}
        onClose={() => setMemberToRemove(null)}
        onConfirm={confirmRemoveMember}
        isLoading={isRemovingMember}
        title="Remove Member from Project"
        message={`Are you sure you want to remove ${memberToRemove?.name} from this project?`}
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
};
