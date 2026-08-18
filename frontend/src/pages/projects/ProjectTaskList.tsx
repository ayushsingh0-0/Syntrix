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
  X,
} from 'lucide-react';
import { useOrg, useToast } from '../../context';
import api from '../../services/api';
import { getErrorMessage } from '../../utils/error';
import { TaskDetailDrawer } from '../../components/tasks/TaskDetailDrawer';
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
        api.get(`/organizations/${currentOrg.id}/projects/${projectId}/tasks?${queryParams.toString()}`),
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

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return <span className="badge badge-rose">URGENT</span>;
      case 'HIGH':
        return <span className="badge badge-amber">HIGH</span>;
      case 'MEDIUM':
        return <span className="badge badge-primary">MED</span>;
      case 'LOW':
        return <span className="badge badge-neutral">LOW</span>;
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'TODO':
        return <span className="badge badge-neutral">To Do</span>;
      case 'IN_PROGRESS':
        return <span className="badge badge-primary">In Progress</span>;
      case 'REVIEW':
        return <span className="badge badge-amber">Review</span>;
      case 'DONE':
        return <span className="badge badge-emerald">Done</span>;
      case 'CANCELLED':
        return <span className="badge badge-rose">Cancelled</span>;
    }
  };

  if (isLoading || !project) {
    return <div style={{ color: 'var(--text-secondary)', padding: '20px 0' }}>Loading tasks...</div>;
  }

  return (
    <div>
      {/* Header & Breadcrumb */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Link
              to={`/projects/${project.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--text-muted)',
                fontSize: '0.825rem',
              }}
            >
              <ArrowLeft size={14} />
              <span>{project.name}</span>
            </Link>
            <span style={{ color: 'var(--border-subtle)' }}>/</span>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Tasks</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <ListFilter size={18} />
            </div>
            <h1 style={{ fontSize: '1.6rem' }}>Tasks ({totalCount})</h1>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to={`/projects/${project.id}/board`} className="btn btn-secondary btn-sm">
            <Kanban size={14} />
            <span>Kanban Board</span>
          </Link>

          <button className="btn btn-primary btn-sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={14} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className="card"
        style={{
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search by title or key..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            style={{ paddingLeft: '34px', fontSize: '0.85rem' }}
          />
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        <select
          className="input-field"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={{ width: '130px', fontSize: '0.85rem' }}
        >
          <option value="">All Statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="REVIEW">Review</option>
          <option value="DONE">Done</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          className="input-field"
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter(e.target.value);
            setPage(1);
          }}
          style={{ width: '130px', fontSize: '0.85rem' }}
        >
          <option value="">All Priorities</option>
          <option value="URGENT">URGENT</option>
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
        </select>

        <select
          className="input-field"
          value={assigneeFilter}
          onChange={(e) => {
            setAssigneeFilter(e.target.value);
            setPage(1);
          }}
          style={{ width: '150px', fontSize: '0.85rem' }}
        >
          <option value="">All Assignees</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.user.name}
            </option>
          ))}
        </select>

        <select
          className="input-field"
          value={labelFilter}
          onChange={(e) => {
            setLabelFilter(e.target.value);
            setPage(1);
          }}
          style={{ width: '140px', fontSize: '0.85rem' }}
        >
          <option value="">All Labels</option>
          {labels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      {/* Task List Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '100px' }}>Key</th>
              <th>Title</th>
              <th style={{ width: '120px' }}>Status</th>
              <th style={{ width: '90px' }}>Priority</th>
              <th style={{ width: '150px' }}>Labels</th>
              <th style={{ width: '140px' }}>Assignee</th>
              <th style={{ width: '120px' }}>Due Date</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No tasks found matching your filters.
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: '700',
                        color: 'var(--primary)',
                        fontSize: '0.825rem',
                      }}
                    >
                      {task.key}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>
                      {task.title}
                    </div>
                    {task.description && (
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          maxWidth: '450px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {task.description}
                      </div>
                    )}
                  </td>
                  <td>{getStatusBadge(task.status)}</td>
                  <td>{getPriorityBadge(task.priority)}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {task.labels && task.labels.length > 0 ? (
                        task.labels.map((tl) => (
                          <span
                            key={tl.label.id}
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: '700',
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-full)',
                              background: `${tl.label.color}20`,
                              color: tl.label.color,
                              border: `1px solid ${tl.label.color}40`,
                            }}
                          >
                            {tl.label.name}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {task.assignee ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {task.assignee.avatarUrl ? (
                          <img
                            src={task.assignee.avatarUrl}
                            alt={task.assignee.name}
                            style={{ width: '20px', height: '20px', borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: 'var(--radius-full)',
                              background: 'var(--bg-surface)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.65rem',
                              fontWeight: '700',
                            }}
                          >
                            {task.assignee.name.charAt(0)}
                          </div>
                        )}
                        <span style={{ fontSize: '0.8rem' }}>{task.assignee.name}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Unassigned</span>
                    )}
                  </td>
                  <td>
                    {task.dueDate ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-surface)',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Page {page} of {totalPages} ({totalCount} total tasks)
            </span>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Task Detail Drawer */}
      {selectedTaskId && (
        <TaskDetailDrawer
          taskId={selectedTaskId}
          projectId={project.id}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={fetchTasks}
          onTaskDeleted={fetchTasks}
        />
      )}

      {/* Quick Create Task Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Create Task</h3>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask}>
              <div className="input-group">
                <label className="input-label">Task Title</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="What needs to be done?"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Column</label>
                  <select
                    className="input-field"
                    value={newTaskColumnId}
                    onChange={(e) => setNewTaskColumnId(e.target.value)}
                  >
                    {columns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Priority</label>
                  <select
                    className="input-field"
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Assignee</label>
                <select
                  className="input-field"
                  value={newTaskAssigneeId}
                  onChange={(e) => setNewTaskAssigneeId(e.target.value)}
                >
                  <option value="">-- Unassigned --</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user.name} ({m.user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isCreatingTask || !newTaskTitle.trim()}>
                  {isCreatingTask ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
