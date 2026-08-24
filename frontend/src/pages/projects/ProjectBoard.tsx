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
  ListFilter,
  GripVertical,
  ArrowDown,
} from 'lucide-react';
import { useOrg, useToast } from '../../context';
import api from '../../services/api';
import { getErrorMessage } from '../../utils/error';
import { TaskDetailDrawer } from '../../components/tasks/TaskDetailDrawer';
import type {
  Board,
  BoardColumn,
  Task,
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
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [orgMembers, setOrgMembers] = useState<OrganizationMember[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Drag and Drop States
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

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
  const [newColumnColor, setNewColumnColor] = useState('#f5ae4d');
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
        const selected = bList.find((b) => b.isDefault) || bList[0];
        setActiveBoard(selected);
        setColumns(selected.columns || []);
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
    ])
      .then(([projRes, boardsRes, membersRes]) => {
        if (!isMounted) return;
        setProject(projRes.data.data);
        const bList: Board[] = boardsRes.data.data || [];
        setBoards(bList);
        if (bList.length > 0) {
          const selected = bList.find((b) => b.isDefault) || bList[0];
          setActiveBoard(selected);
          setColumns(selected.columns || []);
        }
        setOrgMembers(membersRes.data.data || []);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        showToast('error', getErrorMessage(err, 'Failed to load project board'));
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentOrg, projectId, showToast]);

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumnId(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumnId !== columnId) {
      setDragOverColumnId(columnId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, columnId: string) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverColumnId === columnId) {
      setDragOverColumnId(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);
    setDragOverColumnId(null);

    if (!taskId || !currentOrg || !projectId) return;

    // Find current task and source column
    let sourceColumn: BoardColumn | undefined;
    let draggedTask: Task | undefined;
    for (const col of columns) {
      const found = col.tasks.find((t) => t.id === taskId);
      if (found) {
        sourceColumn = col;
        draggedTask = found;
        break;
      }
    }

    if (!draggedTask || sourceColumn?.id === targetColumnId) return;

    const previousColumns = columns;
    const targetCol = columns.find((c) => c.id === targetColumnId);

    // 1. Optimistic UI update: instantly transition task across columns
    const updatedColumns = columns.map((col) => {
      if (col.id === sourceColumn?.id) {
        return {
          ...col,
          tasks: col.tasks.filter((t) => t.id !== taskId),
        };
      }
      if (col.id === targetColumnId) {
        return {
          ...col,
          tasks: [...col.tasks, { ...draggedTask!, columnId: targetColumnId }],
        };
      }
      return col;
    });

    setColumns(updatedColumns);
    showToast('success', `Moved ${draggedTask.key} to ${targetCol?.name || 'new column'}`);

    // 2. Fire backend move endpoint
    try {
      await api.patch(`/organizations/${currentOrg.id}/projects/${projectId}/tasks/${taskId}/move`, {
        columnId: targetColumnId,
        targetPosition: 65535.0,
      });
      // Silent sync with backend
      fetchBoardData();
    } catch (err: unknown) {
      setColumns(previousColumns); // Rollback on failure
      showToast('error', getErrorMessage(err, 'Failed to move task'));
    }
  };

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
        return (
          <span
            style={{
              fontSize: '0.675rem',
              fontWeight: 750,
              padding: '2px 6px',
              borderRadius: '6px',
              background: '#F5E1DB',
              color: '#9F5141',
            }}
          >
            URGENT
          </span>
        );
      case 'HIGH':
        return (
          <span
            style={{
              fontSize: '0.675rem',
              fontWeight: 750,
              padding: '2px 6px',
              borderRadius: '6px',
              background: '#F8EBD3',
              color: '#986A25',
            }}
          >
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span
            style={{
              fontSize: '0.675rem',
              fontWeight: 750,
              padding: '2px 6px',
              borderRadius: '6px',
              background: 'var(--primary-soft, #FCE5C2)',
              color: '#20201D',
            }}
          >
            MED
          </span>
        );
      case 'LOW':
        return (
          <span
            style={{
              fontSize: '0.675rem',
              fontWeight: 750,
              padding: '2px 6px',
              borderRadius: '6px',
              background: 'var(--surface-secondary, #EEEADF)',
              color: 'var(--foreground-secondary, #77756D)',
            }}
          >
            LOW
          </span>
        );
    }
  };

  if (isLoading || !project) {
    return (
      <div style={{ color: 'var(--foreground-secondary, #77756D)', padding: '40px 0', textAlign: 'center' }}>
        Loading Kanban board...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header & Breadcrumb */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Link
              to={`/projects/${project.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--foreground-secondary, #77756D)',
                fontSize: '0.825rem',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              <ArrowLeft size={14} />
              <span>{project.name}</span>
            </Link>
            <span style={{ color: 'var(--border, #DDD9CC)' }}>/</span>
            <span style={{ fontSize: '0.825rem', color: 'var(--foreground, #20201D)', fontWeight: 700 }}>
              {activeBoard?.name || 'Kanban Flow'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--primary-soft, #FCE5C2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#20201D',
              }}
            >
              <Kanban size={20} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {boards.length > 1 ? (
                <select
                  className="input-field"
                  value={activeBoard?.id}
                  onChange={(e) => {
                    const selected = boards.find((b) => b.id === e.target.value);
                    if (selected) {
                      setActiveBoard(selected);
                      setColumns(selected.columns || []);
                    }
                  }}
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: '10px',
                    background: 'var(--surface, #FFFDF8)',
                    borderColor: 'var(--border, #DDD9CC)',
                  }}
                >
                  {boards.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--foreground, #20201D)', margin: 0 }}>
                  {activeBoard?.name || 'Project Board'}
                </h1>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link
            to={`/projects/${project.id}/tasks`}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
          >
            <ListFilter size={14} />
            <span>List View</span>
          </Link>

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
          padding: '12px 18px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
          background: 'var(--surface, #FFFDF8)',
          border: '1px solid var(--border, #DDD9CC)',
          borderRadius: '14px',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '200px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Filter tasks by key or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              paddingLeft: '34px',
              paddingBottom: '8px',
              paddingTop: '8px',
              fontSize: '0.85rem',
              borderRadius: '10px',
              background: 'var(--background, #F5F3EB)',
              borderColor: 'var(--border, #DDD9CC)',
            }}
          />
          <Search
            size={15}
            color="var(--foreground-muted, #77756D)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
        </div>

        <select
          className="input-field"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={{
            width: '140px',
            padding: '7px 10px',
            fontSize: '0.85rem',
            borderRadius: '10px',
            background: 'var(--background, #F5F3EB)',
            borderColor: 'var(--border, #DDD9CC)',
          }}
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
          style={{
            width: '160px',
            padding: '7px 10px',
            fontSize: '0.85rem',
            borderRadius: '10px',
            background: 'var(--background, #F5F3EB)',
            borderColor: 'var(--border, #DDD9CC)',
          }}
        >
          <option value="">All Assignees</option>
          {orgMembers.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.user?.name}
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
          const isDragTarget = dragOverColumnId === column.id;

          return (
            <div
              key={column.id}
              className={`kanban-column-dropzone ${isDragTarget ? 'is-drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={(e) => handleDragLeave(e, column.id)}
              onDrop={(e) => handleDrop(e, column.id)}
              style={{
                flex: '0 0 310px',
                background: isDragTarget ? 'rgba(245, 174, 77, 0.08)' : 'var(--surface-secondary, #EEEADF)',
                borderRadius: '18px',
                border: isDragTarget ? '1.5px dashed var(--primary, #F5AE4D)' : '1px solid var(--border, #DDD9CC)',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: 'calc(100vh - 270px)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* Column Header */}
              <div
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border, #DDD9CC)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: column.color || 'var(--primary, #F5AE4D)',
                      boxShadow: '0 0 0 2px rgba(245, 174, 77, 0.2)',
                    }}
                  />
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--foreground, #20201D)' }}>
                    {column.name}
                  </span>
                  <span
                    style={{
                      fontSize: '0.725rem',
                      fontWeight: 750,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: isOverWip ? '#F5E1DB' : 'var(--surface, #FFFDF8)',
                      color: isOverWip ? '#9F5141' : 'var(--foreground-secondary, #77756D)',
                      border: '1px solid var(--border, #DDD9CC)',
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
                    style={{ padding: '4px', color: 'var(--foreground-muted, #77756D)' }}
                    title="Delete column"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {/* Tasks List */}
              <div
                style={{
                  padding: '12px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  flex: 1,
                  minHeight: '120px',
                }}
              >
                {filteredTasks.map((task) => {
                  const isBeingDragged = draggedTaskId === task.id;

                  return (
                    <div
                      key={task.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`card kanban-task-card ${isBeingDragged ? 'is-dragging' : ''}`}
                      style={{
                        padding: '14px',
                        background: 'var(--surface, #FFFDF8)',
                        border: '1px solid var(--border, #DDD9CC)',
                        borderRadius: '14px',
                        boxShadow: '0 2px 8px rgba(35, 31, 20, 0.04)',
                        cursor: 'grab',
                        position: 'relative',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <GripVertical size={13} color="var(--foreground-muted, #77756D)" style={{ opacity: 0.6 }} />
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontFamily: 'var(--font-mono, monospace)',
                              fontWeight: 800,
                              color: '#986A25',
                            }}
                          >
                            {task.key}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {getPriorityBadge(task.priority)}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTask(task.id, task.key, e)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--foreground-muted, #77756D)',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>

                      <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '8px', lineHeight: '1.35', color: 'var(--foreground, #20201D)' }}>
                        {task.title}
                      </div>

                      {task.description && (
                        <p
                          style={{
                            fontSize: '0.775rem',
                            color: 'var(--foreground-secondary, #77756D)',
                            marginBottom: '10px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: '1.4',
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
                          paddingTop: '10px',
                          borderTop: '1px solid var(--border-subtle, #EEEADF)',
                        }}
                      >
                        {/* Assignee Avatar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {task.assignee ? (
                            task.assignee.avatarUrl ? (
                              <img
                                src={task.assignee.avatarUrl}
                                alt={task.assignee.name}
                                style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border, #DDD9CC)' }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  background: 'var(--primary-soft, #FCE5C2)',
                                  color: '#20201D',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.675rem',
                                  fontWeight: 750,
                                }}
                              >
                                {task.assignee.name.charAt(0)}
                              </div>
                            )
                          ) : (
                            <div style={{ color: 'var(--foreground-muted, #77756D)', fontSize: '0.725rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <UserIcon size={13} />
                              <span>Unassigned</span>
                            </div>
                          )}
                        </div>

                        {/* Move Column Dropdown (Fallback quick action) */}
                        <select
                          className="input-field"
                          value={task.columnId || ''}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleMoveTask(task.id, e.target.value);
                          }}
                          style={{
                            width: 'auto',
                            padding: '3px 8px',
                            fontSize: '0.725rem',
                            fontWeight: 650,
                            borderRadius: '8px',
                            background: 'var(--surface-secondary, #EEEADF)',
                            borderColor: 'var(--border, #DDD9CC)',
                            color: 'var(--foreground, #20201D)',
                            cursor: 'pointer',
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
                  );
                })}

                {/* Animated Drop Placeholder Slot */}
                {isDragTarget && draggedTaskId && (
                  <div
                    className="kanban-drop-slot"
                    style={{
                      padding: '14px',
                      borderRadius: '14px',
                      border: '2px dashed var(--primary, #F5AE4D)',
                      background: 'var(--primary-soft, #FCE5C2)',
                      color: '#20201D',
                      textAlign: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 750,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <ArrowDown size={14} color="#986A25" />
                    <span>Drop task into {column.name}</span>
                  </div>
                )}

                {/* Inline Quick Task Creator */}
                {addingTaskInColumnId === column.id ? (
                  <form
                    onSubmit={(e) => handleQuickCreateTask(column.id, e)}
                    style={{
                      background: 'var(--surface, #FFFDF8)',
                      padding: '10px',
                      borderRadius: '12px',
                      border: '1px solid var(--border, #DDD9CC)',
                    }}
                  >
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Enter task title..."
                      value={quickTaskTitle}
                      onChange={(e) => setQuickTaskTitle(e.target.value)}
                      autoFocus
                      required
                      style={{ fontSize: '0.85rem', marginBottom: '8px', borderRadius: '8px' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setAddingTaskInColumnId(null);
                          setQuickTaskTitle('');
                        }}
                        style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '3px 10px', fontSize: '0.75rem' }}>
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
                      color: 'var(--foreground-muted, #77756D)',
                      border: '1px dashed var(--border, #DDD9CC)',
                      borderRadius: '12px',
                      padding: '8px 12px',
                      background: 'transparent',
                    }}
                  >
                    <Plus size={14} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 650 }}>Add Task</span>
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
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--foreground, #20201D)', margin: 0 }}>
                Add Board Column
              </h3>
              <button
                onClick={() => setIsColumnModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--foreground-muted, #77756D)', cursor: 'pointer' }}
              >
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
                  {['#f5ae4d', '#719879', '#c96d57', '#d9963d', '#817d73', '#d47a62'].map((color) => (
                    <div
                      key={color}
                      onClick={() => setNewColumnColor(color)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: color,
                        cursor: 'pointer',
                        border: newColumnColor === color ? '2px solid var(--foreground, #20201D)' : '2px solid transparent',
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
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--foreground, #20201D)', margin: 0 }}>
                Create Task
              </h3>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--foreground-muted, #77756D)', cursor: 'pointer' }}
              >
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
                      {m.user?.name} ({m.user?.email})
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

      {/* Task Detail Drawer */}
      {selectedTaskId && (
        <TaskDetailDrawer
          taskId={selectedTaskId}
          projectId={project.id}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={fetchBoardData}
          onTaskDeleted={fetchBoardData}
        />
      )}
    </div>
  );
};
