import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ListFilter,
  Plus,
  Search,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Kanban,
  CheckCircle2,
} from 'lucide-react';
import { useOrg, useToast } from '../../context';
import api from '../../services/api';
import { getErrorMessage } from '../../utils/error';
import { TaskDetailDrawer } from '../../components/tasks/TaskDetailDrawer';
import { DataTable, type DataTableColumn } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { FormField, Input, Select } from '../../components/common/FormComponents';
import type {
  Task,
  TaskPriority,
  TaskStatus,
  Project,
  Label,
  OrganizationMember,
  BoardColumn,
} from '../../types';

export const ProjectTaskList: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentOrg } = useOrg();
  const { showToast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [labelFilter, setLabelFilter] = useState('');

  // Selected Task for Detail Drawer
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Quick Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('MEDIUM');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState('');
  const [newTaskColumnId, setNewTaskColumnId] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!currentOrg || !projectId) return;
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (searchQuery) queryParams.append('q', searchQuery);
      if (statusFilter) queryParams.append('status', statusFilter);
      if (priorityFilter) queryParams.append('priority', priorityFilter);
      if (assigneeFilter) queryParams.append('assigneeId', assigneeFilter);
      if (labelFilter) queryParams.append('labelId', labelFilter);

      const [projRes, tasksRes, labelsRes, membersRes, boardsRes] = await Promise.all([
        api.get(`/organizations/${currentOrg.id}/projects/${projectId}`),
        api.get(
          `/organizations/${currentOrg.id}/projects/${projectId}/tasks?${queryParams.toString()}`
        ),
        api.get(`/organizations/${currentOrg.id}/labels`),
        api.get(`/organizations/${currentOrg.id}/members`),
        api.get(`/organizations/${currentOrg.id}/projects/${projectId}/boards`),
      ]);

      setProject(projRes.data.data);
      setTasks(tasksRes.data.data || []);
      if (tasksRes.data.meta) {
        setTotalPages(tasksRes.data.meta.totalPages || 1);
        setTotalCount(tasksRes.data.meta.total || 0);
      }
      setLabels(labelsRes.data.data || []);
      setMembers(membersRes.data.data || []);

      const bList = boardsRes.data.data || [];
      if (bList.length > 0) {
        setColumns(bList[0].columns || []);
        if (!newTaskColumnId && bList[0].columns?.length > 0) {
          setNewTaskColumnId(bList[0].columns[0].id);
        }
      }
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to load task list'));
    } finally {
      setIsLoading(false);
    }
  }, [
    currentOrg,
    projectId,
    page,
    limit,
    searchQuery,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    labelFilter,
    newTaskColumnId,
    showToast,
  ]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !projectId || !newTaskTitle.trim()) return;

    setIsCreatingTask(true);
    try {
      await api.post(`/organizations/${currentOrg.id}/projects/${projectId}/tasks`, {
        title: newTaskTitle.trim(),
        priority: newTaskPriority,
        assigneeId: newTaskAssigneeId || null,
        columnId: newTaskColumnId || null,
      });

      showToast('success', 'Task created successfully!');
      setIsCreateModalOpen(false);
      setNewTaskTitle('');
      setNewTaskAssigneeId('');
      fetchTasks();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to create task'));
    } finally {
      setIsCreatingTask(false);
    }
  };

  const priorityStyles: Record<TaskPriority, string> = {
    URGENT: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    HIGH: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    MEDIUM: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    LOW: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  const statusStyles: Record<TaskStatus, string> = {
    TODO: 'bg-slate-800 text-slate-300 border-slate-700',
    IN_PROGRESS: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    REVIEW: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    DONE: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    CANCELLED: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  };

  const dataColumns: DataTableColumn<Task>[] = [
    {
      key: 'key',
      header: 'Key',
      render: (t) => (
        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
          {t.key}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Title & Summary',
      render: (t) => (
        <div>
          <div className="font-semibold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors">
            {t.title}
          </div>
          {t.description && (
            <div className="text-xs text-slate-400 max-w-md truncate mt-0.5">{t.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
            statusStyles[t.status] || statusStyles.TODO
          }`}
        >
          {t.status.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (t) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
            priorityStyles[t.priority] || priorityStyles.MEDIUM
          }`}
        >
          {t.priority}
        </span>
      ),
    },
    {
      key: 'labels',
      header: 'Labels',
      render: (t) => (
        <div className="flex flex-wrap gap-1">
          {t.labels && t.labels.length > 0 ? (
            t.labels.map((tl) => (
              <span
                key={tl.label.id}
                className="px-2 py-0.2 rounded-full text-[10px] font-medium border"
                style={{
                  backgroundColor: `${tl.label.color}15`,
                  color: tl.label.color,
                  borderColor: `${tl.label.color}35`,
                }}
              >
                {tl.label.name}
              </span>
            ))
          ) : (
            <span className="text-slate-600 text-xs">—</span>
          )}
        </div>
      ),
    },
    {
      key: 'assignee',
      header: 'Assignee',
      render: (t) => (
        <div>
          {t.assignee ? (
            <div className="flex items-center gap-2">
              {t.assignee.avatarUrl ? (
                <img
                  src={t.assignee.avatarUrl}
                  alt={t.assignee.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-indigo-400">
                  {t.assignee.name.charAt(0)}
                </div>
              )}
              <span className="text-xs text-slate-200">{t.assignee.name}</span>
            </div>
          ) : (
            <span className="text-xs text-slate-500">Unassigned</span>
          )}
        </div>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (t) => (
        <span className="text-xs text-slate-400 font-mono">
          {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link
              to={`/projects/${project?.id}`}
              className="hover:text-slate-200 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{project?.name || 'Project'}</span>
            </Link>
            <span>/</span>
            <span className="text-slate-200 font-medium">Tasks</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <ListFilter className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Task Backlog ({totalCount})
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/projects/${project?.id}/board`}>
            <Button variant="secondary" size="sm" leftIcon={<Kanban className="w-4 h-4" />}>
              Board
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Task
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-3 shadow-lg">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by title, key, or description..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="w-36">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'TODO', label: 'To Do' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'REVIEW', label: 'Review' },
              { value: 'DONE', label: 'Done' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          />
        </div>

        <div className="w-36">
          <Select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Priorities' },
              { value: 'URGENT', label: 'URGENT' },
              { value: 'HIGH', label: 'HIGH' },
              { value: 'MEDIUM', label: 'MEDIUM' },
              { value: 'LOW', label: 'LOW' },
            ]}
          />
        </div>

        <div className="w-40">
          <Select
            value={assigneeFilter}
            onChange={(e) => {
              setAssigneeFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Assignees' },
              ...members.map((m) => ({ value: m.userId, label: m.user.name })),
            ]}
          />
        </div>

        <div className="w-36">
          <Select
            value={labelFilter}
            onChange={(e) => {
              setLabelFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Labels' },
              ...labels.map((l) => ({ value: l.id, label: l.name })),
            ]}
          />
        </div>
      </div>

      {/* Task DataTable */}
      <DataTable
        columns={dataColumns}
        data={tasks}
        isLoading={isLoading}
        onRowClick={(task) => setSelectedTaskId(task.id)}
        emptyTitle="No tasks found"
        emptyDescription="No tasks match the active filters or this project is empty."
        emptyIcon={<CheckCircle2 className="w-8 h-8" />}
      />

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 shadow-lg">
          <span>
            Page {page} of {totalPages} ({totalCount} total items)
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Task Detail Drawer */}
      {selectedTaskId && project && (
        <TaskDetailDrawer
          taskId={selectedTaskId}
          projectId={project.id}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={fetchTasks}
          onTaskDeleted={fetchTasks}
        />
      )}

      {/* Quick Create Task Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Task"
        subtitle={`Add a new task item to ${project?.name}`}
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <FormField label="Task Title" required>
            <Input
              type="text"
              placeholder="What needs to be accomplished?"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              required
              autoFocus
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Board Column">
              <Select
                value={newTaskColumnId}
                onChange={(e) => setNewTaskColumnId(e.target.value)}
                options={columns.map((c) => ({ value: c.id, label: c.name }))}
              />
            </FormField>

            <FormField label="Priority">
              <Select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                options={[
                  { value: 'LOW', label: 'LOW' },
                  { value: 'MEDIUM', label: 'MEDIUM' },
                  { value: 'HIGH', label: 'HIGH' },
                  { value: 'URGENT', label: 'URGENT' },
                ]}
              />
            </FormField>
          </div>

          <FormField label="Assignee">
            <Select
              value={newTaskAssigneeId}
              onChange={(e) => setNewTaskAssigneeId(e.target.value)}
              options={[
                { value: '', label: '-- Unassigned --' },
                ...members.map((m) => ({
                  value: m.userId,
                  label: `${m.user.name} (${m.user.email})`,
                })),
              ]}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="secondary" size="md" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isCreatingTask}
              disabled={!newTaskTitle.trim()}
            >
              Create Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
