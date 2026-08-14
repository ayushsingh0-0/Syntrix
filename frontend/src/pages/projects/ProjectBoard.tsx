import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Kanban,
  Plus,
  Search,
  Trash2,
  X,
  ArrowLeft,
  User as UserIcon,
} from 'lucide-react';
import { useOrg, useToast } from '../../context';
import api from '../../services/api';
import { getErrorMessage } from '../../utils/error';
import type {
  Board,
  TaskPriority,
  Project,
  OrganizationMember,
} from '../../types';


export const ProjectBoard: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentOrg, hasPermission } = useOrg();
  const { showToast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoard, setActiveBoard] = useState<Board | null>(null);
  const [orgMembers, setOrgMembers] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  // Inline Quick Task Create per column
  const [addingTaskInColumnId, setAddingTaskInColumnId] = useState<string | null>(null);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');

  // Create Column Modal
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnColor, setNewColumnColor] = useState('#3b82f6');
  const [newColumnWip, setNewColumnWip] = useState<number | ''>('');
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);

  // Create Task Full Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskColumnId, setTaskColumnId] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('MEDIUM');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskEstimatedHours, setTaskEstimatedHours] = useState<number | ''>('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const fetchBoardData = useCallback(async () => {
    if (!currentOrg || !projectId) return;
    try {
      const [projRes, boardsRes, membersRes] = await Promise.all([
        api.get(`/organizations/${currentOrg.id}/projects/${projectId}`),
        api.get(`/organizations/${currentOrg.id}/projects/${projectId}/boards`),
        api.get(`/organizations/${currentOrg.id}/members`),
      ]);

      setProject(projRes.data.data);
      const bList: Board[] = boardsRes.data.data || [];
      setBoards(bList);
      if (bList.length > 0) {
        setActiveBoard(bList.find((b) => b.isDefault) || bList[0]);
      }
      setOrgMembers(membersRes.data.data || []);
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to load project board'));
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg, projectId, showToast]);

  useEffect(() => {
    let isMounted = true;
    if (!currentOrg || !projectId) return;

    Promise.all([
      api.get(`/organizations/${currentOrg.id}/projects/${projectId}`),
      api.get(`/organizations/${currentOrg.id}/projects/${projectId}/boards`),
      api.get(`/organizations/${currentOrg.id}/members`),
    ]).then(([projRes, boardsRes, membersRes]) => {
      if (!isMounted) return;
      setProject(projRes.data.data);
      const bList: Board[] = boardsRes.data.data || [];
      setBoards(bList);
      if (bList.length > 0) {
        setActiveBoard(bList.find((b) => b.isDefault) || bList[0]);
      }
      setOrgMembers(membersRes.data.data || []);
      setIsLoading(false);
    }).catch((err: unknown) => {
      if (!isMounted) return;
      showToast('error', getErrorMessage(err, 'Failed to load project board'));
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [currentOrg, projectId, showToast]);

  const handleQuickCreateTask = async (columnId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !projectId || !quickTaskTitle.trim()) return;

    try {
      await api.post(`/organizations/${currentOrg.id}/projects/${projectId}/tasks`, {
        title: quickTaskTitle.trim(),
        columnId,
        priority: 'MEDIUM',
      });
      setQuickTaskTitle('');
      setAddingTaskInColumnId(null);
      fetchBoardData();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to create task'));
    }
  };

  const handleCreateFullTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !projectId || !taskTitle.trim()) return;

    setIsCreatingTask(true);
    try {
      await api.post(`/organizations/${currentOrg.id}/projects/${projectId}/tasks`, {
        title: taskTitle.trim(),
        description: taskDescription.trim() || null,
        columnId: taskColumnId || null,
        priority: taskPriority,
        assigneeId: taskAssigneeId || null,
        dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : null,
        estimatedHours: taskEstimatedHours ? Number(taskEstimatedHours) : null,
      });
      showToast('success', 'Task created successfully!');
      setIsTaskModalOpen(false);
      setTaskTitle('');
      setTaskDescription('');
      setTaskAssigneeId('');
      setTaskDueDate('');
      setTaskEstimatedHours('');
      fetchBoardData();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to create task'));
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleMoveTask = async (taskId: string, targetColumnId: string) => {
    if (!currentOrg || !projectId) return;

    try {
      await api.patch(`/organizations/${currentOrg.id}/projects/${projectId}/tasks/${taskId}/move`, {
        columnId: targetColumnId,
        targetPosition: 65535.0,
      });
      fetchBoardData();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to move task'));
    }
  };

  const handleDeleteTask = async (taskId: string, taskKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentOrg || !projectId) return;
    if (!confirm(`Delete task ${taskKey}?`)) return;

    try {
      await api.delete(`/organizations/${currentOrg.id}/projects/${projectId}/tasks/${taskId}`);
      showToast('success', `Task ${taskKey} deleted.`);
      fetchBoardData();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to delete task'));
    }
  };

  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !projectId || !activeBoard || !newColumnName.trim()) return;

    setIsCreatingColumn(true);
    try {
      await api.post(
        `/organizations/${currentOrg.id}/projects/${projectId}/boards/${activeBoard.id}/columns`,
        {
          name: newColumnName.trim(),
          color: newColumnColor,
          wipLimit: newColumnWip ? Number(newColumnWip) : null,
        }
      );
      showToast('success', 'Column added to board!');
      setIsColumnModalOpen(false);
      setNewColumnName('');
      setNewColumnWip('');
      fetchBoardData();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to add column'));
    } finally {
      setIsCreatingColumn(false);
    }
  };

  const handleDeleteColumn = async (columnId: string, columnName: string) => {
    if (!currentOrg || !projectId || !activeBoard) return;
    if (!confirm(`Delete column "${columnName}"?`)) return;

    try {
      await api.delete(
        `/organizations/${currentOrg.id}/projects/${projectId}/boards/${activeBoard.id}/columns/${columnId}`
      );
      showToast('success', `Column "${columnName}" removed.`);
      fetchBoardData();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to delete column'));
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return <span className="badge badge-rose" style={{ fontSize: '0.65rem' }}>URGENT</span>;
      case 'HIGH':
        return <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>HIGH</span>;
      case 'MEDIUM':
        return <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>MED</span>;
      case 'LOW':
        return <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>LOW</span>;
    }
  };

  if (isLoading || !project) {
    return <div style={{ color: 'var(--text-secondary)', padding: '20px 0' }}>Loading Kanban board...</div>;
  }

  const columns = activeBoard?.columns || [];

  return (
    <div>
      {/* Top Header & Breadcrumb */}
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
            <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
              {activeBoard?.name || 'Kanban Board'}
            </span>
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
              <Kanban size={18} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {boards.length > 1 ? (
                <select
                  className="input-field"
                  value={activeBoard?.id}
                  onChange={(e) => {
                    const selected = boards.find((b) => b.id === e.target.value);
                    if (selected) setActiveBoard(selected);
                  }}
                  style={{ fontSize: '1.4rem', fontWeight: '800', padding: '2px 8px' }}
                >
                  {boards.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <h1 style={{ fontSize: '1.6rem' }}>{activeBoard?.name || 'Project Board'}</h1>
              )}
            </div>
          </div>
        </div>


        <div style={{ display: 'flex', gap: '10px' }}>
          {hasPermission('PROJECT_UPDATE') && (
            <button className="btn btn-secondary btn-sm" onClick={() => setIsColumnModalOpen(true)}>
              <Plus size={14} />
              <span>Add Column</span>
            </button>
          )}

          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              if (columns.length > 0) setTaskColumnId(columns[0].id);
              setIsTaskModalOpen(true);
            }}
          >
            <Plus size={14} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className="card"
        style={{
          padding: '10px 16px',
          marginBottom: '20px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Filter tasks by key or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '34px', paddingBottom: '6px', paddingTop: '6px', fontSize: '0.85rem' }}
          />
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        <select
          className="input-field"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={{ width: '130px', padding: '6px 8px', fontSize: '0.85rem' }}
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
          onChange={(e) => setAssigneeFilter(e.target.value)}
          style={{ width: '150px', padding: '6px 8px', fontSize: '0.85rem' }}
        >
          <option value="">All Assignees</option>
          {orgMembers.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.user.name}
            </option>
          ))}
        </select>
      </div>

      {/* Kanban Multi-Column Board */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          overflowX: 'auto',
          paddingBottom: '24px',
          minHeight: 'calc(100vh - 280px)',
          alignItems: 'flex-start',
        }}
      >
        {columns.map((column) => {
          const filteredTasks = column.tasks.filter((t) => {
            const matchesQuery =
              !searchQuery ||
              t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              t.key.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesPriority = !priorityFilter || t.priority === priorityFilter;
            const matchesAssignee = !assigneeFilter || t.assigneeId === assigneeFilter;
            return matchesQuery && matchesPriority && matchesAssignee;
          });

          const isOverWip = column.wipLimit && column.tasks.length > column.wipLimit;

          return (
            <div
              key={column.id}
              style={{
                flex: '0 0 310px',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-default)',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: 'calc(100vh - 270px)',
              }}
            >
              {/* Column Header */}
              <div
                style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: 'var(--radius-full)',
                      background: column.color || 'var(--primary)',
                    }}
                  />
                  <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{column.name}</span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-full)',
                      background: isOverWip ? 'rgba(244, 63, 94, 0.2)' : 'var(--bg-card)',
                      color: isOverWip ? 'var(--rose)' : 'var(--text-muted)',
                    }}
                  >
                    {column.tasks.length}
                    {column.wipLimit ? ` / ${column.wipLimit}` : ''}
                  </span>
                </div>

                {hasPermission('PROJECT_UPDATE') && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleDeleteColumn(column.id, column.name)}
                    style={{ padding: '2px 4px', color: 'var(--text-muted)' }}
                    title="Delete column"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              {/* Tasks List */}
              <div
                style={{
                  padding: '10px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  flex: 1,
                }}
              >
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="card"
                    style={{
                      padding: '12px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '700',
                          color: 'var(--primary)',
                        }}
                      >
                        {task.key}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {getPriorityBadge(task.priority)}
                        <button
                          onClick={(e) => handleDeleteTask(task.id, task.key, e)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '2px',
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>

                    <div style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '8px', lineHeight: '1.3' }}>
                      {task.title}
                    </div>

                    {task.description && (
                      <p
                        style={{
                          fontSize: '0.775rem',
                          color: 'var(--text-secondary)',
                          marginBottom: '10px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {task.description}
                      </p>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '8px',
                        borderTop: '1px solid var(--border-subtle)',
                      }}
                    >
                      {/* Assignee Avatar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {task.assignee ? (
                          task.assignee.avatarUrl ? (
                            <img
                              src={task.assignee.avatarUrl}
                              alt={task.assignee.name}
                              style={{ width: '22px', height: '22px', borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '22px',
                                height: '22px',
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
                          )
                        ) : (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.725rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <UserIcon size={12} />
                            <span>Unassigned</span>
                          </div>
                        )}
                      </div>

                      {/* Move Column Dropdown */}
                      <select
                        className="input-field"
                        value={task.columnId || ''}
                        onChange={(e) => handleMoveTask(task.id, e.target.value)}
                        style={{
                          width: 'auto',
                          padding: '2px 6px',
                          fontSize: '0.725rem',
                          background: 'var(--bg-surface)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        {columns.map((c) => (
                          <option key={c.id} value={c.id}>
                            → {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}

                {/* Inline Quick Task Creator */}
                {addingTaskInColumnId === column.id ? (
                  <form
                    onSubmit={(e) => handleQuickCreateTask(column.id, e)}
                    style={{ background: 'var(--bg-card)', padding: '8px', borderRadius: 'var(--radius-md)' }}
                  >
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Enter task title..."
                      value={quickTaskTitle}
                      onChange={(e) => setQuickTaskTitle(e.target.value)}
                      autoFocus
                      required
                      style={{ fontSize: '0.85rem', marginBottom: '6px' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setAddingTaskInColumnId(null);
                          setQuickTaskTitle('');
                        }}
                        style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                        Add
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setAddingTaskInColumnId(column.id)}
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      color: 'var(--text-muted)',
                      border: '1px dashed var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '6px 10px',
                    }}
                  >
                    <Plus size={14} />
                    <span style={{ fontSize: '0.8rem' }}>Add Task</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Column Modal */}
      {isColumnModalOpen && (
        <div className="modal-overlay" onClick={() => setIsColumnModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Add Board Column</h3>
              <button onClick={() => setIsColumnModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateColumn}>
              <div className="input-group">
                <label className="input-label">Column Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Quality Assurance"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="input-group">
                <label className="input-label">Column Color</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {['#64748b', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#f59e0b', '#06b6d4'].map((color) => (
                    <div
                      key={color}
                      onClick={() => setNewColumnColor(color)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: 'var(--radius-full)',
                        background: color,
                        cursor: 'pointer',
                        border: newColumnColor === color ? '2px solid #fff' : '2px solid transparent',
                        transform: newColumnColor === color ? 'scale(1.15)' : 'none',
                        transition: 'transform 0.15s ease',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Work In Progress (WIP) Limit (Optional)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="e.g. 5"
                  min={1}
                  value={newColumnWip}
                  onChange={(e) => setNewColumnWip(e.target.value ? Number(e.target.value) : '')}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsColumnModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isCreatingColumn || !newColumnName.trim()}>
                  {isCreatingColumn ? 'Creating...' : 'Create Column'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Full Modal */}
      {isTaskModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTaskModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Create Task</h3>
              <button onClick={() => setIsTaskModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateFullTask}>
              <div className="input-group">
                <label className="input-label">Task Title</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="What needs to be done?"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Column</label>
                  <select
                    className="input-field"
                    value={taskColumnId}
                    onChange={(e) => setTaskColumnId(e.target.value)}
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
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
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
                  value={taskAssigneeId}
                  onChange={(e) => setTaskAssigneeId(e.target.value)}
                >
                  <option value="">-- Unassigned --</option>
                  {orgMembers.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user.name} ({m.user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Description (Optional)</label>
                <textarea
                  className="input-field"
                  placeholder="Add context, acceptance criteria, or technical details..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Due Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Estimated Hours</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="e.g. 4"
                    min={0.5}
                    step={0.5}
                    value={taskEstimatedHours}
                    onChange={(e) => setTaskEstimatedHours(e.target.value ? Number(e.target.value) : '')}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsTaskModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isCreatingTask || !taskTitle.trim()}>
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
