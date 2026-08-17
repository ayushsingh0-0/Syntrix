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
} from 'lucide-react';
import { useOrg, useToast } from '../../context';
import api from '../../services/api';
import { getErrorMessage } from '../../utils/error';
import { TaskDetailDrawer } from '../../components/tasks/TaskDetailDrawer';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { FormField, Input, Select, Textarea } from '../../components/common/FormComponents';
import type { Board, TaskPriority, Project, OrganizationMember } from '../../types';

export const ProjectBoard: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentOrg, hasPermission } = useOrg();
  const { showToast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoard, setActiveBoard] = useState<Board | null>(null);
  const [orgMembers, setOrgMembers] = useState<OrganizationMember[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
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
    fetchBoardData();
  }, [fetchBoardData]);

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
      await api.patch(
        `/organizations/${currentOrg.id}/projects/${projectId}/tasks/${taskId}/move`,
        {
          columnId: targetColumnId,
          targetPosition: 65535.0,
        }
      );
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

  const priorityStyles: Record<TaskPriority, string> = {
    URGENT: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    HIGH: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    MEDIUM: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    LOW: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  if (isLoading || !project) {
    return (
      <div className="text-slate-400 py-12 text-center text-xs">Loading Kanban board...</div>
    );
  }

  const columns = activeBoard?.columns || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link
              to={`/projects/${project.id}`}
              className="hover:text-slate-200 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{project.name}</span>
            </Link>
            <span>/</span>
            <span className="text-slate-200 font-medium">
              {activeBoard?.name || 'Kanban Board'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Kanban className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              {boards.length > 1 ? (
                <select
                  className="bg-slate-900 border border-slate-700 text-lg font-bold text-slate-100 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={activeBoard?.id}
                  onChange={(e) => {
                    const selected = boards.find((b) => b.id === e.target.value);
                    if (selected) setActiveBoard(selected);
                  }}
                >
                  {boards.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <h1 className="text-2xl font-bold text-slate-100">
                  {activeBoard?.name || 'Project Board'}
                </h1>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/projects/${project.id}/tasks`}>
            <Button variant="secondary" size="sm" leftIcon={<ListFilter className="w-3.5 h-3.5" />}>
              List View
            </Button>
          </Link>

          {hasPermission('PROJECT_UPDATE') && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsColumnModalOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Column
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (columns.length > 0) setTaskColumnId(columns[0].id);
              setIsTaskModalOpen(true);
            }}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            New Task
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-3 shadow-lg">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Filter tasks by key or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="w-40">
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

        <div className="w-48">
          <Select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            options={[
              { value: '', label: 'All Assignees' },
              ...orgMembers.map((m) => ({ value: m.userId, label: m.user.name })),
            ]}
          />
        </div>
      </div>

      {/* Kanban Multi-Column Board */}
      <div className="flex gap-4 overflow-x-auto pb-6 min-h-[calc(100vh-320px)] items-start">
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
              className="flex-shrink-0 w-80 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col max-h-[calc(100vh-300px)] shadow-xl"
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: column.color || '#6366f1' }}
                  />
                  <span className="font-bold text-xs text-slate-100">{column.name}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                      isOverWip
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {column.tasks.length}
                    {column.wipLimit ? ` / ${column.wipLimit}` : ''}
                  </span>
                </div>

                {hasPermission('PROJECT_UPDATE') && (
                  <button
                    onClick={() => handleDeleteColumn(column.id, column.name)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                    title="Delete column"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Task Cards Container */}
              <div className="p-2.5 overflow-y-auto space-y-2.5 flex-1">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="group bg-slate-950/70 hover:bg-slate-950 border border-slate-800/80 hover:border-indigo-500/40 rounded-lg p-3 shadow-md transition-all duration-150 cursor-pointer hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-indigo-400">
                        {task.key}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${
                            priorityStyles[task.priority] || priorityStyles.MEDIUM
                          }`}
                        >
                          {task.priority}
                        </span>
                        <button
                          onClick={(e) => handleDeleteTask(task.id, task.key, e)}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-0.5 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="font-semibold text-xs text-slate-100 group-hover:text-indigo-300 transition-colors leading-snug mb-2">
                      {task.title}
                    </div>

                    {task.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                      {/* Assignee */}
                      <div>
                        {task.assignee ? (
                          <div className="flex items-center gap-1.5">
                            {task.assignee.avatarUrl ? (
                              <img
                                src={task.assignee.avatarUrl}
                                alt={task.assignee.name}
                                className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-700"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[9px] text-indigo-400">
                                {task.assignee.name.charAt(0)}
                              </div>
                            )}
                            <span className="text-slate-300 text-[10px] truncate max-w-[80px]">
                              {task.assignee.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[10px] flex items-center gap-1">
                            <UserIcon className="w-3 h-3" /> Unassigned
                          </span>
                        )}
                      </div>

                      {/* Move Dropdown */}
                      <select
                        value={task.columnId || ''}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleMoveTask(task.id, e.target.value);
                        }}
                        className="bg-slate-900 border border-slate-700 text-[10px] text-slate-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                    className="bg-slate-950 p-2.5 rounded-lg border border-indigo-500/30 space-y-2"
                  >
                    <Input
                      placeholder="Task title..."
                      value={quickTaskTitle}
                      onChange={(e) => setQuickTaskTitle(e.target.value)}
                      autoFocus
                      required
                    />
                    <div className="flex justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAddingTaskInColumnId(null);
                          setQuickTaskTitle('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary" size="sm">
                        Add
                      </Button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setAddingTaskInColumnId(column.id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-slate-800 hover:border-slate-700 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer bg-slate-950/30 hover:bg-slate-950/60"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Task</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Column Modal */}
      <Modal
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        title="Add Board Column"
        subtitle={`Add a new workflow column to ${activeBoard?.name}`}
      >
        <form onSubmit={handleCreateColumn} className="space-y-4">
          <FormField label="Column Name" required>
            <Input
              placeholder="e.g. In Review"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              required
              autoFocus
            />
          </FormField>

          <FormField label="Column Color">
            <div className="flex items-center gap-2 pt-1">
              {[
                '#64748b',
                '#3b82f6',
                '#8b5cf6',
                '#10b981',
                '#ef4444',
                '#f59e0b',
                '#06b6d4',
              ].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewColumnColor(color)}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                    newColumnColor === color ? 'scale-125 ring-2 ring-white' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </FormField>

          <FormField label="WIP Limit (Optional)">
            <Input
              type="number"
              placeholder="e.g. 5"
              min={1}
              value={newColumnWip}
              onChange={(e) => setNewColumnWip(e.target.value ? Number(e.target.value) : '')}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="secondary" size="md" onClick={() => setIsColumnModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isCreatingColumn}
              disabled={!newColumnName.trim()}
            >
              Create Column
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Task Full Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Create Task"
        subtitle={`Add a new task to ${project.name}`}
      >
        <form onSubmit={handleCreateFullTask} className="space-y-4">
          <FormField label="Task Title" required>
            <Input
              placeholder="What needs to be done?"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              required
              autoFocus
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Column">
              <Select
                value={taskColumnId}
                onChange={(e) => setTaskColumnId(e.target.value)}
                options={columns.map((c) => ({ value: c.id, label: c.name }))}
              />
            </FormField>

            <FormField label="Priority">
              <Select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
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
              value={taskAssigneeId}
              onChange={(e) => setTaskAssigneeId(e.target.value)}
              options={[
                { value: '', label: '-- Unassigned --' },
                ...orgMembers.map((m) => ({
                  value: m.userId,
                  label: `${m.user.name} (${m.user.email})`,
                })),
              ]}
            />
          </FormField>

          <FormField label="Description (Optional)">
            <Textarea
              placeholder="Add details, acceptance criteria, or links..."
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              rows={3}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Due Date">
              <Input
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
              />
            </FormField>

            <FormField label="Estimated Hours">
              <Input
                type="number"
                placeholder="e.g. 4"
                min={0.5}
                step={0.5}
                value={taskEstimatedHours}
                onChange={(e) =>
                  setTaskEstimatedHours(e.target.value ? Number(e.target.value) : '')
                }
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="secondary" size="md" onClick={() => setIsTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isCreatingTask}
              disabled={!taskTitle.trim()}
            >
              Create Task
            </Button>
          </div>
        </form>
      </Modal>

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
