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
import { Button } from '../../components/common/Button';
import { Input, Select } from '../../components/common/FormComponents';
import { EmptyState } from '../../components/common/EmptyState';
import { CardSkeleton } from '../../components/common/Skeleton';
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

      const { data } = await api.get(
        `/organizations/${currentOrg.id}/projects?${params.toString()}`
      );
      setProjects(data.data || []);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg, searchQuery, statusFilter, priorityFilter, showArchived]);

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

  const handleArchiveToggle = async (
    projectId: string,
    isArchived: boolean,
    e: React.MouseEvent
  ) => {
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

  const priorityStyles: Record<ProjectPriority, string> = {
    URGENT: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    HIGH: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    MEDIUM: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    LOW: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  const statusStyles: Record<ProjectStatus, string> = {
    ACTIVE: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    PLANNING: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    ON_HOLD: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    COMPLETED: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    ARCHIVED: 'bg-slate-800 text-slate-400 border-slate-700',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Projects Directory</h1>
          <p className="text-xs text-slate-400 mt-1">
            Workspaces, tracking deliverables, and issue boards in{' '}
            <span className="text-slate-200 font-semibold">{currentOrg?.name}</span>
          </p>
        </div>

        {hasPermission('PROJECT_CREATE') && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Project
          </Button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[240px]">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search projects by title or key..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="w-36">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'PLANNING', label: 'PLANNING' },
                { value: 'ACTIVE', label: 'ACTIVE' },
                { value: 'ON_HOLD', label: 'ON_HOLD' },
                { value: 'COMPLETED', label: 'COMPLETED' },
              ]}
            />
          </div>

          <div className="w-36">
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              options={[
                { value: '', label: 'All Priorities' },
                { value: 'URGENT', label: 'URGENT' },
                { value: 'HIGH', label: 'HIGH' },
                { value: 'MEDIUM', label: 'MEDIUM' },
                { value: 'LOW', label: 'LOW' },
              ]}
            />
          </div>
        </div>

        <Button
          variant={showArchived ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setShowArchived(!showArchived)}
          leftIcon={<Archive className="w-3.5 h-3.5" />}
        >
          {showArchived ? 'Showing Archived' : 'Show Archived'}
        </Button>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <CardSkeleton count={3} />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects found"
          description={
            searchQuery || statusFilter || priorityFilter
              ? 'No projects matched your search or filter criteria.'
              : 'Create a project to begin tracking tasks, sprints, and delivery velocity.'
          }
          icon={<FolderKanban className="w-8 h-8 text-indigo-400" />}
          actionLabel={hasPermission('PROJECT_CREATE') ? 'Create Project' : undefined}
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/projects/${p.id}`}
              className="group bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-5 shadow-lg transition-all duration-200 flex flex-col justify-between hover:shadow-indigo-500/5 hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 group-hover:scale-105 transition-transform">
                      {p.key}
                    </span>
                    <h3 className="font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                      {p.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        statusStyles[p.status] || statusStyles.ACTIVE
                      }`}
                    >
                      {p.status}
                    </span>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        priorityStyles[p.priority] || priorityStyles.MEDIUM
                      }`}
                    >
                      {p.priority}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {p.description || 'No description provided.'}
                </p>

                {p.team && (
                  <div className="flex items-center gap-1.5 text-xs text-violet-300 mb-3 font-medium">
                    <Layers className="w-3.5 h-3.5 text-violet-400" />
                    <span>Team: {p.team.name}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>{p.memberCount || 0} Members</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleArchiveToggle(p.id, p.isArchived, e)}
                    title={p.isArchived ? 'Restore project' : 'Archive project'}
                    className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    {p.isArchived ? (
                      <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Archive className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <span className="text-indigo-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Open <ArrowRight className="w-3.5 h-3.5" />
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
