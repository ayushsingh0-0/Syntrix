import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Send,
  X,
  FolderKanban,
  CheckSquare,
  Users,
  ArrowRight,
  Clock,
  Command,
  Loader2,
  Kanban,
  Flame,
  BarChart2,
  Settings,
  Layers,
} from 'lucide-react';
import api from '../../services/api';
import { useOrg } from '../../context';
import type {
  SearchCategory,
  SearchResultsData,
  TaskSearchResult,
  ProjectSearchResult,
  CommentSearchResult,
} from '../../types';

/**
 * @author: @kokonutui (adapted for Syntrix design system)
 * @description: KokonutUI Action Search Bar & Global Workspace Command Palette
 * @website: https://kokonutui.com
 */

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  short: string;
  end: string;
  path: string;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTask?: (taskId: string, projectId: string) => void;
}

const ANIMATION_VARIANTS = {
  container: {
    hidden: { opacity: 0, height: 0 },
    show: {
      opacity: 1,
      height: 'auto',
      transition: {
        height: { duration: 0.35 },
        staggerChildren: 0.05,
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        height: { duration: 0.25 },
        opacity: { duration: 0.2 },
      },
    },
  },
  item: {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.25, ease: 'easeOut' },
    },
    exit: {
      opacity: 0,
      y: -8,
      transition: { duration: 0.15 },
    },
  },
} as const;

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

  // Quick Action Commands definition
  const quickActions: QuickAction[] = useMemo(() => [
    {
      id: 'action-kanban',
      label: 'Open Kanban Board',
      description: 'Active Project Kanban & Task Flow',
      icon: <Kanban size={16} color="var(--primary, #F5AE4D)" />,
      short: '⌘B',
      end: 'Board',
      path: '/projects/cmlm0l0001synth01syn00001/board',
    },
    {
      id: 'action-sprints',
      label: 'Sprint Planning & History',
      description: 'Sprint backlog, burndown & story points',
      icon: <Flame size={16} color="#E99532" />,
      short: '⌘S',
      end: 'Sprints',
      path: '/projects/cmlm0l0001synth01syn00001/sprints',
    },
    {
      id: 'action-analytics',
      label: 'Velocity & KPIs',
      description: 'Completion throughput & milestone forecasting',
      icon: <BarChart2 size={16} color="#719879" />,
      short: '⌘A',
      end: 'Analytics',
      path: '/projects/cmlm0l0001synth01syn00001/analytics',
    },
    {
      id: 'action-projects',
      label: 'Projects Directory',
      description: 'View all workspace projects & deliverables',
      icon: <FolderKanban size={16} color="#D9963D" />,
      short: '⌘P',
      end: 'Directory',
      path: '/projects',
    },
    {
      id: 'action-teams',
      label: 'Teams & Squads',
      description: 'Cross-functional engineering & product teams',
      icon: <Layers size={16} color="#C96D57" />,
      short: '⌘T',
      end: 'Teams',
      path: '/organization/teams',
    },
    {
      id: 'action-members',
      label: 'Organization Members',
      description: 'Team roster, roles & permission governance',
      icon: <Users size={16} color="#719879" />,
      short: '⌘M',
      end: 'Members',
      path: '/organization/members',
    },
    {
      id: 'action-settings',
      label: 'Workspace Settings',
      description: 'Organization profile, branding & configurations',
      icon: <Settings size={16} color="var(--foreground-secondary, #77756D)" />,
      short: '⌘,',
      end: 'Settings',
      path: '/organization/settings',
    },
  ], []);

  // Filtered quick actions when typing commands
  const filteredQuickActions = useMemo(() => {
    if (!query.trim()) return quickActions;
    const normalized = query.toLowerCase().trim();
    return quickActions.filter(
      (a) =>
        a.label.toLowerCase().includes(normalized) ||
        a.description.toLowerCase().includes(normalized) ||
        a.end.toLowerCase().includes(normalized)
    );
  }, [query, quickActions]);

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
      setResults(null);
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
  const visibleItems = useMemo(() => {
    if (!query.trim()) {
      return filteredQuickActions.map((a) => ({ type: 'ACTION' as const, data: a }));
    }

    const items: Array<{
      type: 'TASK' | 'PROJECT' | 'COMMENT' | 'MEMBER' | 'ACTION';
      data: any;
    }> = [];

    if (filteredQuickActions.length > 0) {
      filteredQuickActions.forEach((a) => items.push({ type: 'ACTION', data: a }));
    }

    if (results) {
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
    }

    return items;
  }, [results, activeCategory, query, filteredQuickActions]);

  const handleSelectItem = useCallback(
    (item: { type: 'TASK' | 'PROJECT' | 'COMMENT' | 'MEMBER' | 'ACTION'; data: any }) => {
      onClose();
      switch (item.type) {
        case 'ACTION': {
          const action = item.data as QuickAction;
          navigate(action.path);
          break;
        }
        case 'TASK': {
          const task = item.data as TaskSearchResult;
          if (onSelectTask) {
            onSelectTask(task.id, task.projectId);
          } else {
            navigate(`/projects/${task.projectId}/board`);
          }
          break;
        }
        case 'PROJECT': {
          const project = item.data as ProjectSearchResult;
          navigate(`/projects/${project.id}/board`);
          break;
        }
        case 'COMMENT': {
          const comment = item.data as CommentSearchResult;
          if (onSelectTask && comment.task) {
            onSelectTask(comment.task.id, comment.task.projectId);
          } else if (comment.task) {
            navigate(`/projects/${comment.task.projectId}/board`);
          }
          break;
        }
        case 'MEMBER':
          navigate('/organization/members');
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
          visibleItems.length > 0 ? (prev - 1 + visibleItems.length) % visibleItems.length : 0
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
        backgroundColor: 'rgba(24, 23, 19, 0.65)',
        backdropFilter: 'blur(6px)',
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
          maxWidth: '660px',
          background: 'var(--surface, #FFFDF8)',
          border: '1px solid var(--border, #DDD9CC)',
          borderRadius: '18px',
          boxShadow: '0 20px 60px rgba(35, 31, 20, 0.18)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
        }}
      >
        {/* KokonutUI Animated Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border, #DDD9CC)',
            gap: '12px',
            position: 'relative',
            background: 'var(--surface, #FFFDF8)',
          }}
        >
          {/* Animated Search / Send Morphing Icon */}
          <div style={{ position: 'relative', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                <motion.div
                  key="loader"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Loader2 size={20} color="var(--primary, #F5AE4D)" style={{ animation: 'spin 1s linear infinite' }} />
                </motion.div>
              ) : query.length > 0 ? (
                <motion.div
                  key="send"
                  initial={{ y: -16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 16, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Send size={18} color="var(--primary, #F5AE4D)" />
                </motion.div>
              ) : (
                <motion.div
                  key="search"
                  initial={{ y: -16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 16, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Search size={18} color="var(--primary-hover, #E99532)" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, sprints, projects, or type commands..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '1rem',
              fontWeight: 550,
              color: 'var(--foreground, #20201D)',
              fontFamily: 'inherit',
            }}
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--foreground-muted, #77756D)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
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
              padding: '3px 8px',
              background: 'var(--surface-secondary, #EEEADF)',
              border: '1px solid var(--border, #DDD9CC)',
              borderRadius: '6px',
              fontSize: '0.725rem',
              fontWeight: 700,
              color: 'var(--foreground-secondary, #77756D)',
            }}
          >
            <kbd>ESC</kbd>
          </div>
        </div>

        {/* Category Tabs (When Query is active) */}
        {query.trim().length > 0 && results && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px',
              borderBottom: '1px solid var(--border-subtle, #EEEADF)',
              background: 'var(--surface-secondary, #EEEADF)',
              overflowX: 'auto',
            }}
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  background: activeCategory === cat.id ? 'var(--primary, #F5AE4D)' : 'transparent',
                  color: activeCategory === cat.id ? '#20201D' : 'var(--foreground-secondary, #77756D)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  fontSize: '0.8rem',
                  fontWeight: activeCategory === cat.id ? 700 : 550,
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
                      fontSize: '0.675rem',
                      padding: '1px 5px',
                      borderRadius: '8px',
                      background:
                        activeCategory === cat.id
                          ? 'rgba(32, 32, 29, 0.15)'
                          : 'var(--surface, #FFFDF8)',
                      color: activeCategory === cat.id ? '#20201D' : 'var(--foreground-muted, #77756D)',
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
                  fontSize: '0.725rem',
                  color: 'var(--foreground-muted, #77756D)',
                }}
              >
                {results.durationMs}ms
              </span>
            )}
          </div>
        )}

        {/* Results / Quick Actions Container */}
        <div
          ref={resultsContainerRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {/* Quick Actions & Commands Group */}
          {filteredQuickActions.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '0.725rem',
                  fontWeight: 750,
                  color: 'var(--foreground-muted, #77756D)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '6px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Command size={13} color="var(--primary, #F5AE4D)" />
                <span>Commands & Quick Actions</span>
              </div>

              <motion.ul
                variants={ANIMATION_VARIANTS.container}
                initial="hidden"
                animate="show"
                style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}
              >
                {filteredQuickActions.map((action) => {
                  const itemIndex = visibleItems.findIndex(
                    (v) => v.type === 'ACTION' && v.data.id === action.id
                  );
                  const isSelected = selectedIndex === itemIndex;

                  return (
                    <motion.li
                      key={action.id}
                      variants={ANIMATION_VARIANTS.item}
                      onClick={() => handleSelectItem({ type: 'ACTION', data: action })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: isSelected ? 'var(--primary-soft, #FCE5C2)' : 'transparent',
                        border: isSelected ? '1px solid var(--primary, #F5AE4D)' : '1px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'var(--surface-secondary, #EEEADF)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {action.icon}
                        </div>
                        <div>
                          <div style={{ fontWeight: 650, fontSize: '0.875rem', color: 'var(--foreground, #20201D)' }}>
                            {action.label}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--foreground-muted, #77756D)' }}>
                            {action.description}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '0.675rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'var(--surface-secondary, #EEEADF)',
                            color: 'var(--foreground-secondary, #77756D)',
                          }}
                        >
                          {action.short}
                        </span>
                        <span
                          className="badge badge-amber"
                          style={{
                            fontSize: '0.65rem',
                            padding: '2px 6px',
                          }}
                        >
                          {action.end}
                        </span>
                      </div>
                    </motion.li>
                  );
                })}
              </motion.ul>
            </div>
          )}

          {/* Group: Tasks Search Results */}
          {results && (activeCategory === 'ALL' || activeCategory === 'TASKS') && results.tasks.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <div
                style={{
                  fontSize: '0.725rem',
                  fontWeight: 750,
                  color: 'var(--foreground-muted, #77756D)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '6px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <CheckSquare size={13} color="var(--primary, #F5AE4D)" />
                <span>Tasks ({results.tasks.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {results.tasks.map((task) => {
                  const itemIndex = visibleItems.findIndex(
                    (v) => v.type === 'TASK' && v.data.id === task.id
                  );
                  const isSelected = selectedIndex === itemIndex;

                  return (
                    <div
                      key={task.id}
                      onClick={() => handleSelectItem({ type: 'TASK', data: task })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: isSelected ? 'var(--primary-soft, #FCE5C2)' : 'transparent',
                        border: isSelected ? '1px solid var(--primary, #F5AE4D)' : '1px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                            fontWeight: 750,
                            color: 'var(--primary-hover, #E99532)',
                            background: 'var(--surface-secondary, #EEEADF)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          {task.key}
                        </span>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground, #20201D)' }}>
                            {task.title}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--foreground-muted, #77756D)', marginLeft: '8px' }}>
                            in {task.project?.name}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge badge-amber" style={{ fontSize: '0.675rem' }}>
                          {typeof task.status === 'object' && task.status ? (task.status as any).name : String(task.status)}
                        </span>
                        <ArrowRight size={14} color="var(--foreground-muted, #77756D)" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Group: Projects Search Results */}
          {results && (activeCategory === 'ALL' || activeCategory === 'PROJECTS') && results.projects.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <div
                style={{
                  fontSize: '0.725rem',
                  fontWeight: 750,
                  color: 'var(--foreground-muted, #77756D)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '6px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <FolderKanban size={13} color="var(--primary, #F5AE4D)" />
                <span>Projects ({results.projects.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {results.projects.map((project) => {
                  const itemIndex = visibleItems.findIndex(
                    (v) => v.type === 'PROJECT' && v.data.id === project.id
                  );
                  const isSelected = selectedIndex === itemIndex;

                  return (
                    <div
                      key={project.id}
                      onClick={() => handleSelectItem({ type: 'PROJECT', data: project })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: isSelected ? 'var(--primary-soft, #FCE5C2)' : 'transparent',
                        border: isSelected ? '1px solid var(--primary, #F5AE4D)' : '1px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FolderKanban size={16} color="var(--primary, #F5AE4D)" />
                        <span style={{ fontSize: '0.875rem', fontWeight: 650, color: 'var(--foreground, #20201D)' }}>
                          {project.name}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--foreground-muted, #77756D)' }}>
                          ({project.key})
                        </span>
                      </div>
                      <ArrowRight size={14} color="var(--foreground-muted, #77756D)" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No results message */}
          {query.trim() && !isLoading && visibleItems.length === 0 && (
            <div
              style={{
                padding: '36px 20px',
                textAlign: 'center',
                color: 'var(--foreground-muted, #77756D)',
              }}
            >
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--foreground, #20201D)' }}>
                No results found
              </div>
              <div style={{ fontSize: '0.825rem', marginTop: '4px' }}>
                No matches found for "{query}". Try checking keywords or browse commands above.
              </div>
            </div>
          )}
        </div>

        {/* KokonutUI Action Footer */}
        <div
          style={{
            padding: '10px 20px',
            background: 'var(--surface-secondary, #EEEADF)',
            borderTop: '1px solid var(--border, #DDD9CC)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--foreground-secondary, #77756D)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span>
              <kbd style={{ padding: '2px 5px', background: 'var(--surface, #FFFDF8)', border: '1px solid var(--border, #DDD9CC)', borderRadius: '4px' }}>↑</kbd>{' '}
              <kbd style={{ padding: '2px 5px', background: 'var(--surface, #FFFDF8)', border: '1px solid var(--border, #DDD9CC)', borderRadius: '4px' }}>↓</kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd style={{ padding: '2px 5px', background: 'var(--surface, #FFFDF8)', border: '1px solid var(--border, #DDD9CC)', borderRadius: '4px' }}>↵</kbd>{' '}
              Select
            </span>
            <span>
              <kbd style={{ padding: '2px 5px', background: 'var(--surface, #FFFDF8)', border: '1px solid var(--border, #DDD9CC)', borderRadius: '4px' }}>ESC</kbd>{' '}
              Cancel
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={13} color="var(--primary, #F5AE4D)" />
            <span style={{ fontWeight: 600 }}>Syntrix Command Palette</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
