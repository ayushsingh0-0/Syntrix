import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  X,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Tag,
  Link as LinkIcon,
  MessageSquare,
  History,
  Send,
  CornerDownRight,
  Edit2,
  Paperclip,
  UploadCloud,
  FileText,
  FileCode,
  FileArchive,
  File as FileGeneric,
  Download,
  Image as ImageIcon,
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
  Comment,
  ActivityLog,
  Attachment,
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

  // Bottom Tabs State: 'comments' | 'attachments' | 'activity'
  const [activeBottomTab, setActiveBottomTab] = useState<'comments' | 'attachments' | 'activity'>('comments');
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  // Reply State
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Edit Comment State
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  // Mention Suggestions Popover
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  // Attachment Upload State
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchTaskDetails = useCallback(async () => {
    if (!currentOrg || !projectId || !taskId) return;
    try {
      const [taskRes, labelsRes, membersRes, boardsRes, allTasksRes, commentsRes, activitiesRes, attachmentsRes] =
        await Promise.all([
          api.get(`/organizations/${currentOrg.id}/projects/${projectId}/tasks/${taskId}`),
          api.get(`/organizations/${currentOrg.id}/labels`),
          api.get(`/organizations/${currentOrg.id}/members`),
          api.get(`/organizations/${currentOrg.id}/projects/${projectId}/boards`),
          api.get(`/organizations/${currentOrg.id}/projects/${projectId}/tasks?limit=100`),
          api.get(`/organizations/${currentOrg.id}/projects/${projectId}/tasks/${taskId}/comments`),
          api.get(`/organizations/${currentOrg.id}/projects/${projectId}/tasks/${taskId}/activities`),
          api.get(`/organizations/${currentOrg.id}/projects/${projectId}/tasks/${taskId}/attachments`),
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
      setComments(commentsRes.data.data || []);
      setActivities(activitiesRes.data.data || []);
      setAttachments(attachmentsRes.data.data || []);

      const defaultBoard =
        boardsRes.data.data?.find((b: { isDefault: boolean }) => b.isDefault) || boardsRes.data.data?.[0];
      if (defaultBoard?.columns) {
        setColumns(defaultBoard.columns);
      }

      const otherTasks = (allTasksRes.data.data?.tasks || []).filter((o: Task) => o.id !== taskId);
      setProjectTasks(otherTasks);

      const userWatcher = t.watchers?.some((w) => w.userId === currentUser?.id);
      setIsWatching(!!userWatcher);
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to load task details'));
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg, projectId, taskId, currentUser?.id, showToast]);

  useEffect(() => {
    let isCancelled = false;
    if (taskId && currentOrg && projectId) {
      fetchTaskDetails();
    }
    return () => {
      isCancelled = true;
      if (isCancelled) {
        // cleanup flag
      }
    };
  }, [fetchTaskDetails, taskId, currentOrg, projectId]);


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
        estimatedHours: estimatedHours === '' ? null : Number(estimatedHours),
        labelIds: selectedLabelIds,
      });

      showToast('success', 'Task saved successfully!');
      if (onTaskUpdated) onTaskUpdated();
      fetchTaskDetails();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to update task'));
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
      showToast('success', res.data.data.message);
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

      showToast('success', 'Dependency linked successfully');
      setIsAddingDep(false);
      setDepTargetTaskId('');
      fetchTaskDetails();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to link dependency'));
    }
  };

  const handleRemoveDependency = async (dependencyId: string) => {
    if (!currentOrg || !projectId || !taskId) return;

    try {
      await api.delete(
        `/organizations/${currentOrg.id}/projects/${projectId}/tasks/${taskId}/dependencies/${dependencyId}`
      );
      showToast('success', 'Dependency removed');
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
      const createdLabel = res.data.data;
      setAllLabels([...allLabels, createdLabel]);
      setSelectedLabelIds([...selectedLabelIds, createdLabel.id]);
      setNewLabelName('');
      setIsCreatingLabel(false);
      showToast('success', 'Label created & selected');
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to create label'));
    }
  };

  const handleDeleteTask = async () => {
    if (!currentOrg || !projectId || !taskId) return;
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) return;

    try {
      await api.delete(`/organizations/${currentOrg.id}/projects/${projectId}/tasks/${taskId}`);
      showToast('success', 'Task deleted');
      onClose();
      if (onTaskDeleted) onTaskDeleted();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to delete task'));
    }
  };

  // Comments Handlers
  const handlePostComment = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    const content = parentId ? replyText : newCommentText;
    if (!currentOrg || !projectId || !taskId || !content.trim()) return;

    setIsPostingComment(true);
    try {
      await api.post(
        `/organizations/${currentOrg.id}/projects/${projectId}/tasks/${taskId}/comments`,
        {
          content: content.trim(),
          parentId,
        }
      );

      showToast('success', parentId ? 'Reply posted' : 'Comment posted');
      if (parentId) {
        setReplyingToCommentId(null);
        setReplyText('');
      } else {
        setNewCommentText('');
      }
      setMentionQuery(null);
      fetchTaskDetails();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to post comment'));
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!currentOrg || !projectId || !taskId || !editCommentText.trim()) return;

    try {
      await api.put(
        `/organizations/${currentOrg.id}/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
        {
          content: editCommentText.trim(),
        }
      );

      showToast('success', 'Comment updated');
      setEditingCommentId(null);
      setEditCommentText('');
      fetchTaskDetails();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to update comment'));
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentOrg || !projectId || !taskId) return;
    if (!confirm('Delete this comment?')) return;

    try {
      await api.delete(
        `/organizations/${currentOrg.id}/projects/${projectId}/tasks/${taskId}/comments/${commentId}`
      );
      showToast('success', 'Comment deleted');
      fetchTaskDetails();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to delete comment'));
    }
  };

  const handleCommentInputChange = (val: string) => {
    setNewCommentText(val);
    const lastWord = val.split(/\s+/).pop() || '';
    if (lastWord.startsWith('@') && lastWord.length > 1) {
      setMentionQuery(lastWord.substring(1).toLowerCase());
    } else {
      setMentionQuery(null);
    }
  };

  const insertMention = (memberName: string) => {
    const words = newCommentText.split(/\s+/);
    words.pop();
    words.push(`@${memberName} `);
    setNewCommentText(words.join(' '));
    setMentionQuery(null);
  };

  // Attachment Upload & Delete Handlers
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !currentOrg || !projectId || !taskId) return;
    const file = files[0];

    // Check size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('error', 'File size exceeds 10MB limit');
      return;
    }

    setIsUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      await api.post(
        `/organizations/${currentOrg.id}/projects/${projectId}/tasks/${taskId}/attachments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      showToast('success', `Uploaded ${file.name}`);
      fetchTaskDetails();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to upload attachment'));
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!currentOrg || !projectId || !taskId) return;
    if (!confirm('Are you sure you want to delete this attachment?')) return;

    try {
      await api.delete(
        `/organizations/${currentOrg.id}/projects/${projectId}/tasks/${taskId}/attachments/${attachmentId}`
      );
      showToast('success', 'Attachment deleted');
      fetchTaskDetails();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to delete attachment'));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon size={18} color="var(--primary)" />;
    if (mimeType.includes('pdf') || mimeType.includes('text')) return <FileText size={18} color="#0284c7" />;
    if (mimeType.includes('zip') || mimeType.includes('tar')) return <FileArchive size={18} color="#f59e0b" />;
    if (mimeType.includes('json') || mimeType.includes('javascript') || mimeType.includes('typescript')) {
      return <FileCode size={18} color="#10b981" />;
    }
    return <FileGeneric size={18} color="var(--text-secondary)" />;
  };

  if (!taskId) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          height: '100%',
          backgroundColor: 'var(--bg-card)',
          borderLeft: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideInRight 0.25s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading || !task ? (
          <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>Loading task details...</div>
        ) : (
          <>
            {/* Drawer Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-surface)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    color: 'var(--primary)',
                  }}
                >
                  {task.key}
                </span>
                <button
                  className={`btn btn-sm ${isWatching ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={handleToggleWatcher}
                  style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px' }}
                >
                  {isWatching ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{isWatching ? 'Watching' : 'Watch'}</span>
                </button>
              </div>

              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {/* Title Input */}
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  className="input-field"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title..."
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    border: '1px solid transparent',
                    background: 'transparent',
                    padding: '6px 8px',
                  }}
                />
              </div>

              {/* Status, Priority, Assignee Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  marginBottom: '20px',
                  background: 'var(--bg-surface)',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div>
                  <label className="input-label" style={{ fontSize: '0.75rem' }}>Status</label>
                  <select
                    className="input-field"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="REVIEW">Review</option>
                    <option value="DONE">Done</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="input-label" style={{ fontSize: '0.75rem' }}>Priority</label>
                  <select
                    className="input-field"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="input-label" style={{ fontSize: '0.75rem' }}>Assignee</label>
                  <select
                    className="input-field"
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                  >
                    <option value="">Unassigned</option>
                    {orgMembers.map((m) => (
                      <option key={m.user.id} value={m.user.id}>
                        {m.user.name} ({m.user.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description Input */}
              <div style={{ marginBottom: '20px' }}>
                <label className="input-label">Description</label>
                <textarea
                  className="input-field"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add detailed task requirements, specifications, or links..."
                  style={{ fontSize: '0.875rem' }}
                />
              </div>

              {/* Dates & Estimates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label className="input-label" style={{ fontSize: '0.75rem' }}>Due Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                  />
                </div>

                <div>
                  <label className="input-label" style={{ fontSize: '0.75rem' }}>Story Points</label>
                  <input
                    type="number"
                    className="input-field"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 5"
                    style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                  />
                </div>

                <div>
                  <label className="input-label" style={{ fontSize: '0.75rem' }}>Board Column</label>
                  <select
                    className="input-field"
                    value={columnId}
                    onChange={(e) => setColumnId(e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                  >
                    <option value="">No Column</option>
                    {columns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Labels Section */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="input-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Tag size={14} />
                    <span>Labels & Tags</span>
                  </label>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setIsCreatingLabel(!isCreatingLabel)}
                    style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                  >
                    <Plus size={12} />
                    <span>New Label</span>
                  </button>
                </div>

                {isCreatingLabel && (
                  <form
                    onSubmit={handleCreateLabel}
                    style={{
                      display: 'flex',
                      gap: '8px',
                      marginBottom: '10px',
                      background: 'var(--bg-surface)',
                      padding: '8px',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Label name (e.g. Bug)..."
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      required
                      style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                    />
                    <input
                      type="color"
                      value={newLabelColor}
                      onChange={(e) => setNewLabelColor(e.target.value)}
                      style={{ width: '36px', height: '32px', padding: '2px', borderRadius: '4px', cursor: 'pointer' }}
                    />
                    <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '4px 10px' }}>
                      Add
                    </button>
                  </form>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {allLabels.map((lbl) => {
                    const isSelected = selectedLabelIds.includes(lbl.id);
                    return (
                      <button
                        key={lbl.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedLabelIds(selectedLabelIds.filter((id) => id !== lbl.id));
                          } else {
                            setSelectedLabelIds([...selectedLabelIds, lbl.id]);
                          }
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          border: `1px solid ${isSelected ? lbl.color : 'var(--border-subtle)'}`,
                          backgroundColor: isSelected ? `${lbl.color}25` : 'var(--bg-surface)',
                          color: isSelected ? lbl.color : 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: lbl.color }} />
                        <span>{lbl.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dependencies Section */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="input-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <LinkIcon size={14} />
                    <span>Task Dependencies</span>
                  </label>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setIsAddingDep(!isAddingDep)}
                    style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                  >
                    <Plus size={12} />
                    <span>Link Task</span>
                  </button>
                </div>

                {isAddingDep && (
                  <form
                    onSubmit={handleAddDependency}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      background: 'var(--bg-surface)',
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '10px',
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px' }}>
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

                      <select
                        className="input-field"
                        value={depTargetTaskId}
                        onChange={(e) => setDepTargetTaskId(e.target.value)}
                        required
                        style={{ fontSize: '0.8rem' }}
                      >
                        <option value="">Select target task...</option>
                        {projectTasks.map((pt) => (
                          <option key={pt.id} value={pt.id}>
                            {pt.key}: {pt.title}
                          </option>
                        ))}
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

              {/* Tab Switcher: Comments vs Attachments vs Activity Timeline */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px', marginBottom: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveBottomTab('comments')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.85rem',
                      fontWeight: activeBottomTab === 'comments' ? '700' : '500',
                      color: activeBottomTab === 'comments' ? 'var(--primary)' : 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    <MessageSquare size={15} />
                    <span>Comments ({comments.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveBottomTab('attachments')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.85rem',
                      fontWeight: activeBottomTab === 'attachments' ? '700' : '500',
                      color: activeBottomTab === 'attachments' ? 'var(--primary)' : 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    <Paperclip size={15} />
                    <span>Attachments ({attachments.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveBottomTab('activity')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.85rem',
                      fontWeight: activeBottomTab === 'activity' ? '700' : '500',
                      color: activeBottomTab === 'activity' ? 'var(--primary)' : 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    <History size={15} />
                    <span>Activity ({activities.length})</span>
                  </button>
                </div>

                {/* 1. Comments Panel */}
                {activeBottomTab === 'comments' && (
                  <div>
                    <form onSubmit={(e) => handlePostComment(e, null)} style={{ marginBottom: '20px', position: 'relative' }}>
                      <textarea
                        className="input-field"
                        rows={2}
                        placeholder="Write a comment... (Type @ to mention teammates)"
                        value={newCommentText}
                        onChange={(e) => handleCommentInputChange(e.target.value)}
                        style={{ fontSize: '0.85rem', paddingRight: '40px' }}
                      />

                      {mentionQuery !== null && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: 0,
                            right: 0,
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-lg)',
                            maxHeight: '160px',
                            overflowY: 'auto',
                            zIndex: 10,
                          }}
                        >
                          {orgMembers
                            .filter(
                              (m) =>
                                m.user.name.toLowerCase().includes(mentionQuery) ||
                                m.user.email.toLowerCase().includes(mentionQuery)
                            )
                            .map((m) => (
                              <div
                                key={m.user.id}
                                onClick={() => insertMention(m.user.name.replace(/\s+/g, ''))}
                                style={{
                                  padding: '8px 12px',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                }}
                              >
                                <strong>@{m.user.name}</strong>
                                <span style={{ color: 'var(--text-muted)' }}>({m.user.email})</span>
                              </div>
                            ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                        <button
                          type="submit"
                          className="btn btn-primary btn-sm"
                          disabled={isPostingComment || !newCommentText.trim()}
                          style={{ gap: '4px' }}
                        >
                          <Send size={12} />
                          <span>{isPostingComment ? 'Posting...' : 'Post Comment'}</span>
                        </button>
                      </div>
                    </form>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {comments.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '16px' }}>
                          No comments yet. Start the conversation!
                        </div>
                      ) : (
                        comments.map((c) => (
                          <div
                            key={c.id}
                            style={{
                              background: 'var(--bg-surface)',
                              padding: '12px',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border-subtle)',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: 'var(--primary)',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.7rem',
                                    fontWeight: '700',
                                  }}
                                >
                                  {c.user.name[0]?.toUpperCase()}
                                </div>
                                <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>{c.user.name}</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  {new Date(c.createdAt).toLocaleString()}
                                </span>
                                {c.isEdited && (
                                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    (edited)
                                  </span>
                                )}
                              </div>

                              {(c.userId === currentUser?.id || currentUser?.role === 'ADMIN') && (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    onClick={() => {
                                      setEditingCommentId(c.id);
                                      setEditCommentText(c.content);
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComment(c.id)}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              )}
                            </div>

                            {editingCommentId === c.id ? (
                              <div style={{ marginTop: '8px' }}>
                                <textarea
                                  className="input-field"
                                  rows={2}
                                  value={editCommentText}
                                  onChange={(e) => setEditCommentText(e.target.value)}
                                  style={{ fontSize: '0.85rem' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '6px' }}>
                                  <button className="btn btn-ghost btn-sm" onClick={() => setEditingCommentId(null)}>
                                    Cancel
                                  </button>
                                  <button className="btn btn-primary btn-sm" onClick={() => handleUpdateComment(c.id)}>
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p style={{ fontSize: '0.85rem', margin: '4px 0 8px', whiteSpace: 'pre-wrap' }}>
                                {c.content}
                              </p>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setReplyingToCommentId(replyingToCommentId === c.id ? null : c.id)}
                                style={{ padding: '2px 6px', fontSize: '0.75rem', gap: '4px' }}
                              >
                                <CornerDownRight size={12} />
                                <span>Reply</span>
                              </button>
                            </div>

                            {replyingToCommentId === c.id && (
                              <form
                                onSubmit={(e) => handlePostComment(e, c.id)}
                                style={{ marginTop: '10px', paddingLeft: '16px', borderLeft: '2px solid var(--primary)' }}
                              >
                                <input
                                  type="text"
                                  className="input-field"
                                  placeholder="Write a reply..."
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  autoFocus
                                  style={{ fontSize: '0.8rem', marginBottom: '6px' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setReplyingToCommentId(null)}
                                  >
                                    Cancel
                                  </button>
                                  <button type="submit" className="btn btn-primary btn-sm" disabled={!replyText.trim()}>
                                    Reply
                                  </button>
                                </div>
                              </form>
                            )}

                            {c.replies && c.replies.length > 0 && (
                              <div style={{ marginTop: '10px', paddingLeft: '16px', borderLeft: '2px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {c.replies.map((rep) => (
                                  <div key={rep.id} style={{ fontSize: '0.825rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <strong style={{ fontSize: '0.8rem' }}>{rep.user.name}</strong>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                          {new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                      {(rep.userId === currentUser?.id || currentUser?.role === 'ADMIN') && (
                                        <button
                                          onClick={() => handleDeleteComment(rep.id)}
                                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      )}
                                    </div>
                                    <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)' }}>{rep.content}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Attachments Panel */}
                {activeBottomTab === 'attachments' && (
                  <div>
                    {/* Dropzone */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        handleFileUpload(e.dataTransfer.files);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border-subtle)'}`,
                        borderRadius: 'var(--radius-lg)',
                        padding: '24px',
                        textAlign: 'center',
                        backgroundColor: isDragging ? 'var(--primary-light)' : 'var(--bg-surface)',
                        cursor: 'pointer',
                        marginBottom: '16px',
                        transition: 'all 0.2s',
                      }}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => handleFileUpload(e.target.files)}
                        style={{ display: 'none' }}
                      />
                      <UploadCloud
                        size={28}
                        style={{ color: isDragging ? 'var(--primary)' : 'var(--text-muted)', margin: '0 auto 8px' }}
                      />
                      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600' }}>
                        {isUploadingFile ? 'Uploading attachment...' : 'Drop files here or click to browse'}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Supported: PNG, JPEG, PDF, TXT, JSON, CSV, ZIP (Max 10MB)
                      </p>
                    </div>

                    {/* Attachments List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {attachments.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '16px' }}>
                          No files attached to this task yet.
                        </div>
                      ) : (
                        attachments.map((att) => (
                          <div
                            key={att.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: 'var(--bg-surface)',
                              padding: '10px 14px',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border-subtle)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                              {att.mimeType.startsWith('image/') ? (
                                <img
                                  src={att.url}
                                  alt={att.originalName}
                                  onClick={() => setPreviewImageUrl(att.url)}
                                  style={{
                                    width: '36px',
                                    height: '36px',
                                    objectFit: 'cover',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    border: '1px solid var(--border-subtle)',
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'var(--bg-card)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  {getFileIcon(att.mimeType)}
                                </div>
                              )}

                              <div style={{ overflow: 'hidden' }}>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {att.originalName}
                                </p>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  {formatFileSize(att.size)} • {new Date(att.createdAt).toLocaleDateString()} by{' '}
                                  {att.uploader?.name || 'User'}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <a
                                href={`/api/v1/attachments/${att.id}/download`}
                                download
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '4px 8px', color: 'var(--primary)' }}
                                title="Download"
                              >
                                <Download size={14} />
                              </a>

                              {(att.userId === currentUser?.id || currentUser?.role === 'ADMIN') && (
                                <button
                                  onClick={() => handleDeleteAttachment(att.id)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--rose)',
                                    cursor: 'pointer',
                                    padding: '4px 6px',
                                  }}
                                  title="Delete attachment"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Activity Timeline Panel */}
                {activeBottomTab === 'activity' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {activities.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '16px' }}>
                        No recorded activity yet.
                      </div>
                    ) : (
                      activities.map((act) => (
                        <div
                          key={act.id}
                          style={{
                            display: 'flex',
                            gap: '10px',
                            fontSize: '0.8rem',
                            background: 'var(--bg-surface)',
                            padding: '10px',
                            borderRadius: 'var(--radius-md)',
                            borderLeft: '3px solid var(--primary)',
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                              <span>
                                <strong>{act.user.name}</strong> •{' '}
                                <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                                  {act.action.replace('_', ' ')}
                                </span>
                              </span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                                {new Date(act.createdAt).toLocaleString()}
                              </span>
                            </div>
                            {act.details && (
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '2px' }}>
                                {JSON.stringify(act.details)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Lightbox Image Preview Modal */}
            {previewImageUrl && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.85)',
                  zIndex: 2000,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                }}
                onClick={() => setPreviewImageUrl(null)}
              >
                <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
                  <img
                    src={previewImageUrl}
                    alt="Preview"
                    style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 'var(--radius-md)' }}
                  />
                  <button
                    onClick={() => setPreviewImageUrl(null)}
                    style={{
                      position: 'absolute',
                      top: '-36px',
                      right: 0,
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
            )}

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
