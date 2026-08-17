import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  FolderKanban,
  CheckSquare,
  MessageSquare,
  Users,
  ArrowRight,
  Clock,
  Command,
  Loader2,
} from 'lucide-react';
import api from '../../services/api';
import { useOrg } from '../../context';
import type {
  SearchCategory,
  SearchResultsData,
  TaskSearchResult,
  ProjectSearchResult,
  CommentSearchResult,
  MemberSearchResult,
} from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTask?: (taskId: string, projectId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTask,
}) => {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResultsData | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Debounced search query
  useEffect(() => {
    if (!isOpen || !currentOrg) return;

    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    let isMounted = true;

    const timer = setTimeout(() => {
      setIsLoading(true);
      api
        .get(`/organizations/${currentOrg.id}/search`, {
          params: {
            q: trimmed,
            type: activeCategory,
            limit: 15,
          },
        })
        .then((res) => {
          if (isMounted) {
            setResults(res.data.data);
            setSelectedIndex(0);
          }
        })
        .catch(() => {
          if (isMounted) {
            setResults(null);
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        });
    }, 180);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query, activeCategory, currentOrg, isOpen]);

  // Flattened list of visible search items for keyboard navigation
  const visibleItems = React.useMemo(() => {
    if (!results || !query.trim()) return [];
    const items: Array<{
      type: 'TASK' | 'PROJECT' | 'COMMENT' | 'MEMBER';
      data: TaskSearchResult | ProjectSearchResult | CommentSearchResult | MemberSearchResult;
    }> = [];

    if (activeCategory === 'ALL' || activeCategory === 'TASKS') {
      results.tasks.forEach((t) => items.push({ type: 'TASK', data: t }));
    }
    if (activeCategory === 'ALL' || activeCategory === 'PROJECTS') {
      results.projects.forEach((p) => items.push({ type: 'PROJECT', data: p }));
    }
    if (activeCategory === 'ALL' || activeCategory === 'COMMENTS') {
      results.comments.forEach((c) => items.push({ type: 'COMMENT', data: c }));
    }
    if (activeCategory === 'ALL' || activeCategory === 'MEMBERS') {
      results.members.forEach((m) => items.push({ type: 'MEMBER', data: m }));
    }

    return items;
  }, [results, activeCategory, query]);

  const handleSelectItem = useCallback(
    (item: {
      type: 'TASK' | 'PROJECT' | 'COMMENT' | 'MEMBER';
      data: TaskSearchResult | ProjectSearchResult | CommentSearchResult | MemberSearchResult;
    }) => {
      onClose();
      switch (item.type) {
        case 'TASK': {
          const task = item.data as TaskSearchResult;
          if (onSelectTask) {
            onSelectTask(task.id, task.projectId);
          } else {
            navigate(`/projects/${task.projectId}/boards`);
          }
          break;
        }
        case 'PROJECT': {
          const project = item.data as ProjectSearchResult;
          navigate(`/projects/${project.id}/boards`);
          break;
        }
        case 'COMMENT': {
          const comment = item.data as CommentSearchResult;
          if (onSelectTask && comment.task) {
            onSelectTask(comment.task.id, comment.task.projectId);
          } else if (comment.task) {
            navigate(`/projects/${comment.task.projectId}/boards`);
          }
          break;
        }
        case 'MEMBER':
          navigate('/team');
          break;
      }
    },
    [navigate, onClose, onSelectTask]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          visibleItems.length > 0 ? (prev + 1) % visibleItems.length : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          visibleItems.length > 0
            ? (prev - 1 + visibleItems.length) % visibleItems.length
            : 0
        );
      } else if (e.key === 'Enter') {
        if (visibleItems.length > 0 && visibleItems[selectedIndex]) {
          e.preventDefault();
          handleSelectItem(visibleItems[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, visibleItems, selectedIndex, onClose, handleSelectItem]);

  if (!isOpen) return null;

  const categories: { id: SearchCategory; label: string; count?: number }[] = [
    { id: 'ALL', label: 'All', count: results?.totalResults },
    { id: 'TASKS', label: 'Tasks', count: results?.counts.tasks },
    { id: 'PROJECTS', label: 'Projects', count: results?.counts.projects },
    { id: 'COMMENTS', label: 'Comments', count: results?.counts.comments },
    { id: 'MEMBERS', label: 'Members', count: results?.counts.members },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        zIndex: 1000,
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            gap: '12px',
            position: 'relative',
          }}
        >
          {isLoading ? (
            <Loader2
              size={20}
              color="var(--primary)"
              style={{ animation: 'spin 1s linear infinite' }}
            />
          ) : (
            <Search size={20} color="var(--text-secondary)" />
          )}

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, projects, comments, or members..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '1rem',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
            }}
          />

          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <X size={16} />
            </button>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 7px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
            }}
          >
            <kbd>ESC</kbd>
          </div>
        </div>

        {/* Category Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
            overflowX: 'auto',
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                background: activeCategory === cat.id ? 'var(--primary)' : 'transparent',
                color: activeCategory === cat.id ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '5px 12px',
                fontSize: '0.8rem',
                fontWeight: activeCategory === cat.id ? '600' : '400',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{cat.label}</span>
              {typeof cat.count === 'number' && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background:
                      activeCategory === cat.id
                        ? 'rgba(255, 255, 255, 0.25)'
                        : 'var(--bg-surface)',
                  }}
                >
                  {cat.count}
                </span>
              )}
            </button>
          ))}
          {results && results.durationMs > 0 && (
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
              }}
            >
              {results.durationMs}ms
            </span>
          )}
        </div>

        {/* Results Container */}
        <div
          ref={resultsContainerRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {!query.trim() && (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <Command size={36} color="var(--primary)" style={{ opacity: 0.8 }} />
              <div style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                Global Workspace Search
              </div>
              <div style={{ fontSize: '0.825rem', maxWidth: '380px', lineHeight: '1.4' }}>
                Search for tasks by title or key (e.g. <span className="badge badge-primary">SYN-12</span>),
                projects, comments, or team members.
              </div>
            </div>
          )}

          {query.trim() && !isLoading && visibleItems.length === 0 && (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                No results found
              </div>
              <div style={{ fontSize: '0.85rem', marginTop: '6px' }}>
                No matches found for "{query}". Try checking for typos or searching by keyword.
              </div>
            </div>
          )}

          {/* Group: Tasks */}
          {results && (activeCategory === 'ALL' || activeCategory === 'TASKS') && results.tasks.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <CheckSquare size={13} /> Tasks ({results.tasks.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                {results.tasks.map((task) => {
                  const itemIndex = visibleItems.findIndex(
                    (v) => v.type === 'TASK' && v.data.id === task.id
                  );
                  const isSelected = itemIndex === selectedIndex;

                  return (
                    <div
                      key={task.id}
                      onClick={() => handleSelectItem({ type: 'TASK', data: task })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'var(--primary-subtle)' : 'transparent',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid transparent',
                        cursor: 'pointer',
                        transition: 'background 0.1s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                        <span
                          className="badge badge-primary"
                          style={{ fontWeight: '700', fontSize: '0.75rem', flexShrink: 0 }}
                        >
                          {task.key}
                        </span>
                        <span
                          style={{
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {task.title}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                          in {task.project?.name}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background:
                              task.status === 'DONE'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : task.status === 'IN_PROGRESS'
                                ? 'rgba(59, 130, 246, 0.15)'
                                : 'rgba(100, 116, 139, 0.15)',
                            color:
                              task.status === 'DONE'
                                ? '#10b981'
                                : task.status === 'IN_PROGRESS'
                                ? '#3b82f6'
                                : 'var(--text-secondary)',
                            fontWeight: '600',
                          }}
                        >
                          {task.status}
                        </span>
                        <ArrowRight size={14} color="var(--text-muted)" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Group: Projects */}
          {results && (activeCategory === 'ALL' || activeCategory === 'PROJECTS') && results.projects.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <FolderKanban size={13} /> Projects ({results.projects.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                {results.projects.map((project) => {
                  const itemIndex = visibleItems.findIndex(
                    (v) => v.type === 'PROJECT' && v.data.id === project.id
                  );
                  const isSelected = itemIndex === selectedIndex;

                  return (
                    <div
                      key={project.id}
                      onClick={() => handleSelectItem({ type: 'PROJECT', data: project })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'var(--primary-subtle)' : 'transparent',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(99, 102, 241, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#6366f1',
                            fontWeight: '700',
                            fontSize: '0.75rem',
                            flexShrink: 0,
                          }}
                        >
                          {project.key}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {project.name}
                          </div>
                          {project.description && (
                            <div
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-secondary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '380px',
                              }}
                            >
                              {project.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        {project._count && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {project._count.tasks} tasks
                          </span>
                        )}
                        <ArrowRight size={14} color="var(--text-muted)" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Group: Comments */}
          {results && (activeCategory === 'ALL' || activeCategory === 'COMMENTS') && results.comments.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <MessageSquare size={13} /> Comments ({results.comments.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                {results.comments.map((comment) => {
                  const itemIndex = visibleItems.findIndex(
                    (v) => v.type === 'COMMENT' && v.data.id === comment.id
                  );
                  const isSelected = itemIndex === selectedIndex;

                  return (
                    <div
                      key={comment.id}
                      onClick={() => handleSelectItem({ type: 'COMMENT', data: comment })}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'var(--primary-subtle)' : 'transparent',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: 0 }}>
                        {comment.user?.avatarUrl ? (
                          <img
                            src={comment.user.avatarUrl}
                            alt={comment.user.name}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              marginTop: '2px',
                            }}
                          />
                        ) : (
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
                              marginTop: '2px',
                            }}
                          >
                            {comment.user?.name?.charAt(0) || 'U'}
                          </div>
                        )}

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                              {comment.user?.name}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              on {comment.task?.key} ({comment.task?.title})
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: '0.825rem',
                              color: 'var(--text-secondary)',
                              marginTop: '2px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            "{comment.content}"
                          </div>
                        </div>
                      </div>

                      <ArrowRight size={14} color="var(--text-muted)" style={{ marginTop: '4px', flexShrink: 0 }} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Group: Members */}
          {results && (activeCategory === 'ALL' || activeCategory === 'MEMBERS') && results.members.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Users size={13} /> Members ({results.members.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                {results.members.map((member) => {
                  const itemIndex = visibleItems.findIndex(
                    (v) => v.type === 'MEMBER' && v.data.id === member.id
                  );
                  const isSelected = itemIndex === selectedIndex;

                  return (
                    <div
                      key={member.id}
                      onClick={() => handleSelectItem({ type: 'MEMBER', data: member })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'var(--primary-subtle)' : 'transparent',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {member.user?.avatarUrl ? (
                          <img
                            src={member.user.avatarUrl}
                            alt={member.user.name}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-subtle)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              color: 'var(--text-primary)',
                            }}
                          >
                            {member.user?.name?.charAt(0) || 'U'}
                          </div>
                        )}

                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {member.user?.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {member.user?.email}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                          {member.role}
                        </span>
                        <ArrowRight size={14} color="var(--text-muted)" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div
          style={{
            padding: '10px 20px',
            background: 'var(--bg-card)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>
              <kbd style={{ padding: '2px 5px', background: 'var(--bg-surface)', borderRadius: '3px' }}>↑</kbd>{' '}
              <kbd style={{ padding: '2px 5px', background: 'var(--bg-surface)', borderRadius: '3px' }}>↓</kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd style={{ padding: '2px 5px', background: 'var(--bg-surface)', borderRadius: '3px' }}>↵</kbd>{' '}
              Select
            </span>
            <span>
              <kbd style={{ padding: '2px 5px', background: 'var(--bg-surface)', borderRadius: '3px' }}>ESC</kbd>{' '}
              Close
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} />
            <span>Real-time Workspace Index</span>
          </div>
        </div>
      </div>
    </div>
  );
};
