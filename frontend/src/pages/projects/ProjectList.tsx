import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Search,
  Users,
  Archive,
  RotateCcw,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { useOrg, useToast } from '../../context';
import { CreateProjectModal } from '../../components/modals/CreateProjectModal';
import api from '../../services/api';
import { getErrorMessage } from '../../utils/error';
import type { Project, ProjectStatus, ProjectPriority } from '../../types';

export const ProjectList: React.FC = () => {
  const { currentOrg, hasPermission } = useOrg();
  const { showToast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchProjects = useCallback(async () => {
    if (!currentOrg) return;
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (showArchived) params.append('isArchived', 'true');

      const { data } = await api.get(`/organizations/${currentOrg.id}/projects?${params.toString()}`);
      setProjects(data.data || []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg, searchQuery, statusFilter, priorityFilter, showArchived]);

  useEffect(() => {
    let isMounted = true;
    if (currentOrg) {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (showArchived) params.append('isArchived', 'true');

      api.get(`/organizations/${currentOrg.id}/projects?${params.toString()}`).then((res) => {
        if (isMounted) {
          setProjects(res.data.data || []);
          setIsLoading(false);
        }
      }).catch(() => {
        if (isMounted) setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [currentOrg, searchQuery, statusFilter, priorityFilter, showArchived]);

  const handleArchiveToggle = async (projectId: string, isArchived: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentOrg) return;

    const action = isArchived ? 'restore' : 'archive';
    try {
      await api.patch(`/organizations/${currentOrg.id}/projects/${projectId}/${action}`);
      showToast('success', `Project ${isArchived ? 'restored' : 'archived'} successfully!`);
      fetchProjects();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, `Failed to ${action} project`));
    }
  };

  const getPriorityBadgeClass = (priority: ProjectPriority) => {
    switch (priority) {
      case 'URGENT': return 'badge-rose';
      case 'HIGH': return 'badge-amber';
      case 'MEDIUM': return 'badge-primary';
      case 'LOW': return 'badge-neutral';
      default: return 'badge-neutral';
    }
  };

  const getStatusBadgeClass = (status: ProjectStatus) => {
    switch (status) {
      case 'ACTIVE': return 'badge-emerald';
      case 'PLANNING': return 'badge-cyan';
      case 'ON_HOLD': return 'badge-amber';
      case 'COMPLETED': return 'badge-primary';
      case 'ARCHIVED': return 'badge-neutral';
      default: return 'badge-neutral';
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '6px' }}>Projects Directory</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Workspaces, tracking deliverables, and issue boards in {currentOrg?.name}
          </p>
        </div>

        {hasPermission('PROJECT_CREATE') && (
          <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} />
            <span>Create Project</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div
        className="card"
        style={{
          padding: '12px 16px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flex: 1, minWidth: '240px', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="input-field"
              placeholder="Search by project name or key..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          <select
            className="input-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '130px' }}
          >
            <option value="">All Statuses</option>
            <option value="PLANNING">PLANNING</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ON_HOLD">ON_HOLD</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>

          <select
            className="input-field"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ width: '130px' }}
          >
            <option value="">All Priorities</option>
            <option value="URGENT">URGENT</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        <button
          className={`btn ${showArchived ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setShowArchived(!showArchived)}
        >
          <Archive size={14} />
          <span>{showArchived ? 'Showing Archived' : 'Show Archived'}</span>
        </button>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-secondary)' }}>
          Loading projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <FolderKanban size={40} color="var(--primary)" style={{ margin: '0 auto 14px auto' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>No projects found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '20px' }}>
            {searchQuery || statusFilter || priorityFilter
              ? 'No projects matched your filter criteria.'
              : 'Create a project to begin tracking tasks and sprints.'}
          </p>
          {hasPermission('PROJECT_CREATE') && (
            <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={16} />
              <span>Create Project</span>
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/projects/${p.id}`}
              className="card card-hoverable"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: 'var(--text-primary)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                      }}
                    >
                      {p.key}
                    </span>
                    <h3 style={{ fontSize: '1.1rem' }}>{p.name}</h3>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span className={`badge ${getStatusBadgeClass(p.status)}`}>
                      {p.status}
                    </span>
                    <span className={`badge ${getPriorityBadgeClass(p.priority)}`}>
                      {p.priority}
                    </span>
                  </div>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px', minHeight: '40px' }}>
                  {p.description || 'No description provided.'}
                </p>

                {p.team && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--accent)', marginBottom: '12px' }}>
                    <Layers size={14} />
                    <span>Team: {p.team.name}</span>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={14} />
                  <span>{p.memberCount || 0} Members</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => handleArchiveToggle(p.id, p.isArchived, e)}
                    title={p.isArchived ? 'Restore project' : 'Archive project'}
                    style={{ padding: '4px 8px' }}
                  >
                    {p.isArchived ? <RotateCcw size={14} color="var(--emerald)" /> : <Archive size={14} />}
                  </button>
                  <span style={{ color: 'var(--primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Open <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchProjects}
      />
    </div>
  );
};
