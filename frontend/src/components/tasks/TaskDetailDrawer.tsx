import React, { useEffect, useState, useCallback } from 'react';
import {
  X,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Tag,
  Link as LinkIcon,
} from 'lucide-react';
import { useOrg, useToast, useAuth } from '../../context';
import api from '../../services/api';
import { getErrorMessage } from '../../utils/error';
import type {
  Task,
  TaskPriority,
  TaskStatus,
  Label,
  BoardColumn,
  OrganizationMember,
  DependencyType,
} from '../../types';

interface TaskDetailDrawerProps {
  taskId: string | null;
  projectId: string;
  onClose: () => void;
  onTaskUpdated?: () => void;
  onTaskDeleted?: () => void;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  taskId,
  projectId,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
}) => {
  const { currentOrg } = useOrg();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [task, setTask] = useState<Task | null>(null);
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [orgMembers, setOrgMembers] = useState<OrganizationMember[]>([]);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [columnId, setColumnId] = useState<string>('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState<number | ''>('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  // Watcher State
  const [isWatching, setIsWatching] = useState(false);

  // New Dependency State
  const [isAddingDep, setIsAddingDep] = useState(false);
  const [depTargetTaskId, setDepTargetTaskId] = useState('');
  const [depType, setDepType] = useState<DependencyType>('BLOCKS');

  // Create Label Inline State
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#3b82f6');

  const fetchTaskDetails = useCallback(async () => {
    if (!currentOrg || !projectId || !taskId) return;
    try {
      const [taskRes, labelsRes, membersRes, boardsRes, allTasksRes] = await Promise.all([
        api.get(`/organizations/${currentOrg.id}/projects/${projectId}/tasks/${taskId}`),
        api.get(`/organizations/${currentOrg.id}/labels`),
        api.get(`/organizations/${currentOrg.id}/members`),
        api.get(`/organizations/${currentOrg.id}/projects/${projectId}/boards`),
        api.get(`/organizations/${currentOrg.id}/projects/${projectId}/tasks?limit=100`),
      ]);

      const t: Task = taskRes.data.data;
      setTask(t);
      setTitle(t.title);
      setDescription(t.description || '');
      setPriority(t.priority);
      setStatus(t.status);
      setColumnId(t.columnId || '');
      setAssigneeId(t.assigneeId || '');
      setDueDate(t.dueDate ? t.dueDate.substring(0, 10) : '');
      setEstimatedHours(t.estimatedHours || '');
      setSelectedLabelIds(t.labels ? t.labels.map((l) => l.label.id) : []);

      setAllLabels(labelsRes.data.data || []);
      setOrgMembers(membersRes.data.data || []);

      const bList = boardsRes.data.data || [];
      if (bList.length > 0) {
        setColumns(bList[0].columns || []);
      }

      setProjectTasks((allTasksRes.data.data || []).filter((item: Task) => item.id !== taskId));

      const watching = t.watchers?.some((w) => w.userId === currentUser?.id) || false;
      setIsWatching(watching);
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to load task details'));
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg, projectId, taskId, currentUser?.id, showToast]);

  useEffect(() => {
    if (taskId) {
      setIsLoading(true);
      fetchTaskDetails();
    }
  }, [taskId, fetchTaskDetails]);

  const handleSaveChanges = async () => {
    if (!currentOrg || !projectId || !taskId || !title.trim()) return;

    setIsSaving(true);
    try {
      await api.put(`/organizations/${currentOrg.id}/projects/${projectId}/tasks/${taskId}`, {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status,
        columnId: columnId || null,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        estimatedHours: estimatedHours ? Number(estimatedHours) : null,
        labelIds: selectedLabelIds,
      });

      showToast('success', 'Task saved successfully!');
      fetchTaskDetails();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to save task'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleWatcher = async () => {
    if (!currentOrg || !projectId || !taskId) return;
    try {
      const res = await api.post(
        `/organizations/${currentOrg.id}/projects/${projectId}/tasks/${taskId}/watch`
      );
      setIsWatching(res.data.data.isWatching);
      showToast('info', res.data.message);
      fetchTaskDetails();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to update watcher'));
    }
  };

  const handleAddDependency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !projectId || !taskId || !depTargetTaskId) return;

    try {
      await api.post(
        `/organizations/${currentOrg.id}/projects/${projectId}/tasks/${taskId}/dependencies`,
        {
          dependsOnTaskId: depTargetTaskId,
          type: depType,
        }
      );
      showToast('success', 'Dependency linked successfully!');
      setIsAddingDep(false);
      setDepTargetTaskId('');
      fetchTaskDetails();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to add dependency'));
    }
  };

  const handleRemoveDependency = async (dependencyId: string) => {
    if (!currentOrg || !projectId || !taskId) return;
    try {
      await api.delete(
        `/organizations/${currentOrg.id}/projects/${projectId}/tasks/${taskId}/dependencies/${dependencyId}`
      );
      showToast('success', 'Dependency removed.');
      fetchTaskDetails();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to remove dependency'));
    }
  };

  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !newLabelName.trim()) return;

    try {
      const res = await api.post(`/organizations/${currentOrg.id}/labels`, {
        name: newLabelName.trim(),
        color: newLabelColor,
      });
      const newLabel: Label = res.data.data;
      setAllLabels([...allLabels, newLabel]);
      setSelectedLabelIds([...selectedLabelIds, newLabel.id]);
      setNewLabelName('');
      setIsCreatingLabel(false);
      showToast('success', `Label "${newLabel.name}" created and attached.`);
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to create label'));
    }
  };

  const handleDeleteTask = async () => {
    if (!currentOrg || !projectId || !taskId || !task) return;
    if (!confirm(`Are you sure you want to permanently delete task ${task.key}?`)) return;

    try {
      await api.delete(`/organizations/${currentOrg.id}/projects/${projectId}/tasks/${taskId}`);
      showToast('success', `Task ${task.key} deleted.`);
      onClose();
      if (onTaskDeleted) onTaskDeleted();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to delete task'));
    }
  };

  if (!taskId) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 999,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          height: '100%',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          animation: 'slideInRight 0.25s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading || !task ? (
          <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading task details...</div>
        ) : (
          <>
            {/* Drawer Top Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: '800',
                    fontSize: '0.9rem',
                    color: 'var(--primary)',
                    background: 'rgba(99, 102, 241, 0.12)',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {task.key}
                </span>

                <select
                  className="input-field"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  style={{
                    width: 'auto',
                    padding: '4px 10px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                  }}
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleToggleWatcher}
                  title={isWatching ? 'Stop watching task' : 'Watch task updates'}
                  style={{
                    color: isWatching ? 'var(--primary)' : 'var(--text-muted)',
                    borderColor: isWatching ? 'var(--primary)' : 'var(--border-subtle)',
                  }}
                >
                  {isWatching ? <Eye size={14} /> : <EyeOff size={14} />}
                  <span>{task.watchers?.length || 0}</span>
                </button>

                <button
                  onClick={onClose}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
              {/* Title Input */}
              <div>
                <label className="input-label" style={{ fontSize: '0.75rem' }}>Task Title</label>
                <input
                  type="text"
                  className="input-field"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ fontSize: '1.15rem', fontWeight: '700' }}
                  placeholder="Task title..."
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="input-label" style={{ fontSize: '0.75rem' }}>Description</label>
                <textarea
                  className="input-field"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details, acceptance criteria, or design notes..."
                />
              </div>

              {/* Metadata Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '14px',
                  background: 'var(--bg-card)',
                  padding: '16px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <label className="input-label" style={{ fontSize: '0.75rem' }}>Assignee</label>
                  <select
                    className="input-field"
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  >
                    <option value="">-- Unassigned --</option>
                    {orgMembers.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="input-label" style={{ fontSize: '0.75rem' }}>Priority</label>
                  <select
                    className="input-field"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    style={{ fontSize: '0.85rem' }}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="input-label" style={{ fontSize: '0.75rem' }}>Board Column</label>
                  <select
                    className="input-field"
                    value={columnId}
                    onChange={(e) => setColumnId(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  >
                    <option value="">-- No Column --</option>
                    {columns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="input-label" style={{ fontSize: '0.75rem' }}>Estimated Hours</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="e.g. 6"
                    min={0.5}
                    step={0.5}
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value ? Number(e.target.value) : '')}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label className="input-label" style={{ fontSize: '0.75rem' }}>Due Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Labels & Tags Section */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  padding: '16px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Tag size={15} color="var(--primary)" />
                    <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>Labels & Tags</span>
                  </div>

                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setIsCreatingLabel(!isCreatingLabel)}
                    style={{ fontSize: '0.75rem', padding: '2px 6px' }}
                  >
                    <Plus size={12} />
                    <span>New Label</span>
                  </button>
                </div>

                {/* Inline New Label Creator */}
                {isCreatingLabel && (
                  <form onSubmit={handleCreateLabel} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Label name..."
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      required
                      style={{ fontSize: '0.8rem' }}
                    />
                    <input
                      type="color"
                      value={newLabelColor}
                      onChange={(e) => setNewLabelColor(e.target.value)}
                      style={{ width: '40px', height: '36px', padding: '2px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                    />
                    <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '0 12px' }}>
                      Add
                    </button>
                  </form>
                )}

                {/* Attached Label Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {allLabels.map((lbl) => {
                    const isSelected = selectedLabelIds.includes(lbl.id);
                    return (
                      <div
                        key={lbl.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedLabelIds(selectedLabelIds.filter((id) => id !== lbl.id));
                          } else {
                            setSelectedLabelIds([...selectedLabelIds, lbl.id]);
                          }
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: isSelected ? `${lbl.color}25` : 'var(--bg-surface)',
                          color: isSelected ? lbl.color : 'var(--text-muted)',
                          border: `1px solid ${isSelected ? lbl.color : 'var(--border-subtle)'}`,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: 'var(--radius-full)',
                            background: lbl.color,
                          }}
                        />
                        <span>{lbl.name}</span>
                        {isSelected && <X size={10} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Task Dependencies Section */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  padding: '16px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <LinkIcon size={15} color="var(--primary)" />
                    <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>Dependencies (DAG Links)</span>
                  </div>

                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setIsAddingDep(!isAddingDep)}
                    style={{ fontSize: '0.75rem', padding: '2px 6px' }}
                  >
                    <Plus size={12} />
                    <span>Link Task</span>
                  </button>
                </div>

                {/* Inline Add Dependency Form */}
                {isAddingDep && (
                  <form onSubmit={handleAddDependency} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '8px' }}>
                      <select
                        className="input-field"
                        value={depTargetTaskId}
                        onChange={(e) => setDepTargetTaskId(e.target.value)}
                        required
                        style={{ fontSize: '0.8rem' }}
                      >
                        <option value="">-- Choose Dependent Task --</option>
                        {projectTasks.map((pt) => (
                          <option key={pt.id} value={pt.id}>
                            {pt.key}: {pt.title}
                          </option>
                        ))}
                      </select>

                      <select
                        className="input-field"
                        value={depType}
                        onChange={(e) => setDepType(e.target.value as DependencyType)}
                        style={{ fontSize: '0.8rem' }}
                      >
                        <option value="BLOCKS">Blocks</option>
                        <option value="BLOCKED_BY">Blocked By</option>
                        <option value="RELATES_TO">Relates To</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setIsAddingDep(false)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary btn-sm">
                        Link Dependency
                      </button>
                    </div>
                  </form>
                )}

                {/* Dependencies List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {task.dependencies && task.dependencies.length > 0 ? (
                    task.dependencies.map((dep) => (
                      <div
                        key={dep.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--bg-surface)',
                          fontSize: '0.8rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>
                            {dep.type}
                          </span>
                          <span style={{ fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                            {dep.dependsOnTask?.key}
                          </span>
                          <span style={{ color: 'var(--text-secondary)' }}>{dep.dependsOnTask?.title}</span>
                        </div>

                        <button
                          onClick={() => handleRemoveDependency(dep.id)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No dependencies linked.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div
              style={{
                padding: '16px 20px',
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--bg-card)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleDeleteTask}
                style={{ color: 'var(--rose)', borderColor: 'rgba(244, 63, 94, 0.3)' }}
              >
                <Trash2 size={14} />
                <span>Delete Task</span>
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveChanges}
                  disabled={isSaving || !title.trim()}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
