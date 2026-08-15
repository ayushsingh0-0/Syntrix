import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell,
  CheckCheck,
  UserPlus,
  AtSign,
  Activity,
  Clock,
  Mail,
  Trash2,
  X,
  MessageSquare,
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context';
import { getErrorMessage } from '../../utils/error';
import type { Notification, NotificationType } from '../../types';

interface NotificationCenterProps {
  onSelectTask?: (taskId: string, projectId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onSelectTask }) => {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.data.unreadCount || 0);
    } catch {
      // Background poll failure is silent
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/notifications?unreadOnly=${activeFilter === 'unread'}`);
      setNotifications(res.data.data.notifications || []);
      setUnreadCount(res.data.data.meta.unreadCount || 0);
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to fetch notifications'));
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, showToast]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // 30s heartbeat
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      showToast('success', 'All notifications marked as read');
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to mark all as read'));
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      fetchUnreadCount();
    } catch (err: unknown) {
      showToast('error', getErrorMessage(err, 'Failed to delete notification'));
    }
  };

  const handleItemClick = (notif: Notification) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif.id);
    }
    if (notif.taskId && notif.projectId && onSelectTask) {
      onSelectTask(notif.taskId, notif.projectId);
      setIsOpen(false);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return <UserPlus size={16} color="#6366f1" />;
      case 'TASK_MENTIONED':
      case 'COMMENT_MENTIONED':
        return <AtSign size={16} color="#a855f7" />;
      case 'TASK_STATUS_CHANGED':
        return <Activity size={16} color="#10b981" />;
      case 'TASK_DUE_SOON':
        return <Clock size={16} color="#f59e0b" />;
      case 'INVITATION_RECEIVED':
        return <Mail size={16} color="#0284c7" />;
      default:
        return <MessageSquare size={16} color="var(--primary)" />;
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '8px',
          color: isOpen ? 'var(--primary)' : 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
        }}
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: 'var(--rose)',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: '700',
              padding: '1px 5px',
              borderRadius: 'var(--radius-full)',
              minWidth: '16px',
              textAlign: 'center',
              boxShadow: '0 0 8px rgba(244, 63, 94, 0.6)',
              animation: 'pulse 2s infinite',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '380px',
            maxHeight: '480px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-surface)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>Notifications</span>
              {unreadCount > 0 && (
                <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                  {unreadCount} new
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="Mark all as read"
                >
                  <CheckCheck size={14} />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div
            style={{
              display: 'flex',
              padding: '4px 12px',
              background: 'var(--bg-surface)',
              borderBottom: '1px solid var(--border-subtle)',
              gap: '6px',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              style={{
                background: activeFilter === 'all' ? 'var(--bg-card)' : 'transparent',
                border: 'none',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: activeFilter === 'all' ? '700' : '500',
                color: activeFilter === 'all' ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('unread')}
              style={{
                background: activeFilter === 'unread' ? 'var(--bg-card)' : 'transparent',
                border: 'none',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: activeFilter === 'unread' ? '700' : '500',
                color: activeFilter === 'unread' ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              Unread only
            </button>
          </div>

          {/* Notifications List Body */}
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '360px' }}>
            {isLoading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Bell size={28} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600' }}>All caught up!</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.75rem' }}>No new notifications at this time.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    gap: '12px',
                    backgroundColor: n.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.05)',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <div style={{ marginTop: '2px' }}>{getNotificationIcon(n.type)}</div>

                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: n.isRead ? '600' : '700',
                          color: n.isRead ? 'var(--text-secondary)' : 'var(--text-primary)',
                        }}
                      >
                        {n.title}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '6px' }}>
                        {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: '2px 0 0',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {n.message}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(n.id, e)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px',
                      opacity: 0.6,
                    }}
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
