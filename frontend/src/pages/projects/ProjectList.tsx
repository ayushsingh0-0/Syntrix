import React, { useEffect, useState } from 'react';
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

  const fetchProjects = async () => {
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
  };

  useEffect(() => {
    let isMounted = true;
    if (!currentOrg) return;

    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('q', searchQuery.trim());
    if (statusFilter) params.append('status', statusFilter);
    if (priorityFilter) params.append('priority', priorityFilter);
    if (showArchived) params.append('isArchived', 'true');

    api
      .get(`/organizations/${currentOrg.id}/projects?${params.toString()}`)
      .then((res) => {
        if (isMounted) {
          setProjects(res.data.data || []);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

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

  const getPriorityBadge = (priority: ProjectPriority) => {
    switch (priority) {
      case 'URGENT':
        return { label: 'URGENT', bg: '#F5E1DB', color: '#9F5141' };
      case 'HIGH':
        return { label: 'HIGH', bg: '#F8EBD3', color: '#986A25' };
      case 'MEDIUM':
        return { label: 'MEDIUM', bg: 'var(--primary-soft)', color: '#20201D' };
      case 'LOW':
      default:
        return { label: 'LOW', bg: 'var(--surface-secondary)', color: 'var(--foreground-muted)' };
    }
  };

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'ACTIVE':
        return { label: 'ACTIVE', bg: '#E4EEE5', color: '#52755A' };
      case 'PLANNING':
        return { label: 'PLANNING', bg: 'var(--primary-soft)', color: '#20201D' };
      case 'ON_HOLD':
        return { label: 'ON_HOLD', bg: '#F8EBD3', color: '#986A25' };
      case 'COMPLETED':
        return { label: 'COMPLETED', bg: '#E4EEE5', color: '#52755A' };
      case 'ARCHIVED':
      default:
        return { label: 'ARCHIVED', bg: 'var(--surface-secondary)', color: 'var(--foreground-muted)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <FolderKanban size={20} color="var(--primary, #F5AE4D)" />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--foreground)' }}>
              Projects Directory
            </h1>
          </div>
          <p style={{ color: 'var(--foreground-secondary)', fontSize: '0.875rem' }}>
            Workspaces, tracking deliverables, and issue boards in {currentOrg?.name}
          </p>
        </div>

        {hasPermission('PROJECT_CREATE') && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              borderRadius: '12px',
              fontWeight: 700,
            }}
          >
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
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--surface)',
        }}
      >
        <div style={{ display: 'flex', flex: 1, minWidth: '240px', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Search by project name or key..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
            <Search
              size={16}
              color="var(--foreground-muted)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>

          <select
            className="input-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '130px', fontWeight: 600 }}
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
            style={{ width: '130px', fontWeight: 600 }}
          >
            <option value="">All Priorities</option>
            <option value="URGENT">URGENT</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        <button
          type="button"
          className={`btn ${showArchived ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setShowArchived(!showArchived)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px' }}
        >
          <Archive size={14} />
          <span>{showArchived ? 'Showing Archived' : 'Show Archived'}</span>
        </button>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--foreground-muted)' }}>
          Loading projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'var(--primary-soft)',
              color: '#20201D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <FolderKanban size={28} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 750, color: 'var(--foreground)', marginBottom: '6px' }}>
            No projects found
          </h3>
          <p style={{ color: 'var(--foreground-secondary)', fontSize: '0.875rem', marginBottom: '20px', maxWidth: '400px', margin: '0 auto 20px' }}>
            {searchQuery || statusFilter || priorityFilter
              ? 'No projects matched your filter criteria.'
              : 'Create a project to begin tracking tasks, boards, and sprints.'}
          </p>
          {hasPermission('PROJECT_CREATE') && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsCreateModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} />
              <span>Create Project</span>
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {projects.map((p) => {
            const stBadge = getStatusBadge(p.status);
            const prBadge = getPriorityBadge(p.priority);

            return (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '20px',
                  borderRadius: '18px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  textDecoration: 'none',
                  color: 'var(--foreground)',
                  transition: 'all 0.15s ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          background: 'var(--primary-soft)',
                          color: '#20201D',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '800',
                          fontSize: '0.8rem',
                        }}
                      >
                        {p.key}
                      </span>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 750, color: 'var(--foreground)' }}>{p.name}</h3>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          background: stBadge.bg,
                          color: stBadge.color,
                        }}
                      >
                        {stBadge.label}
                      </span>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          background: prBadge.bg,
                          color: prBadge.color,
                        }}
                      >
                        {prBadge.label}
                      </span>
                    </div>
                  </div>

                  <p style={{ color: 'var(--foreground-secondary)', fontSize: '0.85rem', marginBottom: '16px', minHeight: '38px', lineHeight: 1.5 }}>
                    {p.description || 'No description provided.'}
                  </p>

                  {p.team && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--primary-hover)', marginBottom: '12px', fontWeight: 650 }}>
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
                    color: 'var(--foreground-muted)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={14} />
                    <span>{p.memberCount || 0} Members</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => handleArchiveToggle(p.id, p.isArchived, e)}
                      title={p.isArchived ? 'Restore project' : 'Archive project'}
                      style={{ padding: '4px 8px', borderRadius: '6px' }}
                    >
                      {p.isArchived ? <RotateCcw size={14} color="#52755A" /> : <Archive size={14} />}
                    </button>
                    <span style={{ color: 'var(--primary-hover)', fontWeight: '650', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Open <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
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

export default ProjectList;
