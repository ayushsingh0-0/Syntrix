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
    let isMounted = true;
    if (!currentOrg || !projectId) return;

    Promise.all([
      api.get(`/organizations/${currentOrg.id}/projects/${projectId}`),
      api.get(`/organizations/${currentOrg.id}/projects/${projectId}/members`),
      api.get(`/organizations/${currentOrg.id}/members`),
      api.get(`/organizations/${currentOrg.id}/teams`),
    ]).then(([projRes, membersRes, orgMembersRes, teamsRes]) => {
      if (!isMounted) return;
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
      setIsLoading(false);
    }).catch((err: unknown) => {
      if (!isMounted) return;
      showToast('error', getErrorMessage(err, 'Project not found'));
      navigate('/projects');
    });

    return () => {
      isMounted = false;
    };
  }, [currentOrg, projectId, navigate, showToast]);


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
      const { data } = await api.patch(`/organizations/${currentOrg.id}/projects/${projectId}/${action}`);
      setProject(data.data);
      showToast('success', `Project ${project.isArchived ? 'restored' : 'archived'}!`);
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, `Failed to ${action} project`));
    }
  };

  const handleDeleteProject = async () => {
    if (!currentOrg || !projectId || !project) return;
    if (!confirm(`Are you sure you want to permanently delete project "${project.name}"?`)) return;

    try {
      await api.delete(`/organizations/${currentOrg.id}/projects/${projectId}`);
      showToast('success', 'Project deleted successfully');
      navigate('/projects');
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to delete project'));
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

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!currentOrg || !projectId) return;
    if (!confirm(`Remove ${memberName} from this project?`)) return;

    try {
      await api.delete(`/organizations/${currentOrg.id}/projects/${projectId}/members/${userId}`);
      showToast('success', `${memberName} removed from project.`);
      fetchProjectData();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to remove member'));
    }
  };

  if (isLoading || !project) return <div>Loading project details...</div>;

  const existingMemberUserIds = members.map((m) => m.userId);
  const eligibleOrgMembers = orgMembers.filter((om) => !existingMemberUserIds.includes(om.userId));

  return (
    <div>
      {/* Breadcrumb & Navigation */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/projects"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            marginBottom: '10px',
          }}
        >
          <ArrowLeft size={14} />
          <span>Back to Projects</span>
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                fontFamily: 'var(--font-mono)',
                fontWeight: '800',
                fontSize: '1rem',
              }}
            >
              {project.key}
            </span>
            <h1 style={{ fontSize: '1.8rem' }}>{project.name}</h1>
            <span className="badge badge-primary">{project.status}</span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to={`/projects/${project.id}/analytics`} className="btn btn-secondary btn-sm">
              <BarChart2 size={14} color="var(--primary)" />
              <span>Analytics</span>
            </Link>
            <Link to={`/projects/${project.id}/sprints`} className="btn btn-secondary btn-sm">
              <Flame size={14} color="var(--amber)" />
              <span>Sprints</span>
            </Link>
            <Link to={`/projects/${project.id}/tasks`} className="btn btn-secondary btn-sm">
              <ListFilter size={14} />
              <span>Tasks</span>
            </Link>
            <Link to={`/projects/${project.id}/board`} className="btn btn-primary btn-sm">
              <Kanban size={14} />
              <span>Open Kanban Board</span>
            </Link>
            <button className="btn btn-secondary btn-sm" onClick={handleArchiveToggle}>
              {project.isArchived ? <RotateCcw size={14} /> : <Archive size={14} />}
              <span>{project.isArchived ? 'Restore' : 'Archive'}</span>
            </button>
          </div>



        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '24px',
        }}
      >
        {[
          { key: 'overview' as const, label: 'Overview', icon: <FolderKanban size={16} /> },
          { key: 'members' as const, label: `Members (${members.length})`, icon: <Users size={16} /> },
          { key: 'settings' as const, label: 'Settings', icon: <Settings size={16} /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}

            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === tab.key ? '#fff' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.key ? '700' : '500',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Description</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              {project.description || 'No description provided for this project.'}
            </p>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Properties</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Priority</span>
                <span className="badge badge-amber">{project.priority}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status</span>
                <span className="badge badge-emerald">{project.status}</span>
              </div>
              {project.team && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Team</span>
                  <span style={{ fontWeight: '600', color: 'var(--accent)' }}>{project.team.name}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Created</span>
                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div>
          {/* Add Member Form */}
          <form
            onSubmit={handleAddMember}
            className="card"
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              padding: '14px 18px',
              marginBottom: '20px',
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Add Member:</span>
            <select
              className="input-field"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              style={{ flex: 1 }}
            >
              <option value="">-- Choose organization member --</option>
              {eligibleOrgMembers.map((om) => (
                <option key={om.userId} value={om.userId}>
                  {om.user.name} ({om.user.email})
                </option>
              ))}
            </select>

            <select
              className="input-field"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as ProjectRole)}
              style={{ width: '120px' }}
            >
              <option value="MEMBER">MEMBER</option>
              <option value="LEAD">LEAD</option>
              <option value="VIEWER">VIEWER</option>
            </select>

            <button type="submit" className="btn btn-primary btn-sm" disabled={isAddingMember || !selectedUserId}>
              <UserPlus size={14} />
              <span>Add</span>
            </button>
          </form>

          {/* Members Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-default)' }}>
                  <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Member</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Project Role</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--bg-card)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700',
                            fontSize: '0.8rem',
                          }}
                        >
                          {m.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{m.user.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.user.bio || 'Project Member'}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      <select
                        className="input-field"
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.userId, e.target.value as ProjectRole)}
                        style={{ width: 'auto', padding: '4px 8px', fontSize: '0.8rem' }}
                      >
                        <option value="LEAD">LEAD</option>
                        <option value="MEMBER">MEMBER</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>
                    </td>

                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleRemoveMember(m.userId, m.user.name)}
                        style={{ color: 'var(--rose)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div style={{ maxWidth: '640px' }}>
          <form onSubmit={handleUpdateSettings} className="card" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Project Settings</h3>

            <div className="input-group">
              <label className="input-label">Project Name</label>
              <input
                type="text"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="input-group">
                <label className="input-label">Status</label>
                <select
                  className="input-field"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                >
                  <option value="PLANNING">PLANNING</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ON_HOLD">ON_HOLD</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Priority</label>
                <select
                  className="input-field"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as ProjectPriority)}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Assigned Team</label>
              <select className="input-field" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                <option value="">-- No Team (Org-wide) --</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea
                className="input-field"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                <Save size={16} />
                <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>

          {/* Danger Zone */}
          <div
            className="card"
            style={{
              borderColor: 'rgba(244, 63, 94, 0.3)',
              background: 'rgba(244, 63, 94, 0.04)',
            }}
          >
            <h3 style={{ fontSize: '1.1rem', color: 'var(--rose)', marginBottom: '8px' }}>Danger Zone</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Permanently delete this project and its tasks.
            </p>
            <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>
              <Trash2 size={14} />
              <span>Delete Project</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
