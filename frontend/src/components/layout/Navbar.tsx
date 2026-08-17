import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, LogOut, Shield, UserCircle, Search, Command } from 'lucide-react';
import { useAuth, useOrg } from '../../context';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { GlobalSearchModal } from '../modals/GlobalSearchModal';
import { TaskDetailDrawer } from '../tasks/TaskDetailDrawer';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentOrg, myRole } = useOrg();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Global Ctrl + K / Cmd + K listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Click outside user dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSelectTask = (taskId: string, projectId: string) => {
    setSelectedTaskId(taskId);
    setSelectedProjectId(projectId);
  };

  return (
    <>
      <header
        style={{
          height: 'var(--header-height)',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        {/* Left: Organization / Workspace Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {currentOrg ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Workspace:</span>
              <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {currentOrg.name}
              </span>
              {myRole && (
                <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                  {myRole}
                </span>
              )}
            </div>
          ) : (
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Welcome to Syntrix</span>
          )}
        </div>

        {/* Center: Global Search Quick Trigger */}
        {currentOrg && (
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 14px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              minWidth: '240px',
              transition: 'all 0.15s ease',
            }}
          >
            <Search size={15} color="var(--primary)" />
            <span style={{ flex: 1, textAlign: 'left' }}>Search workspace...</span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                padding: '2px 5px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '3px',
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
              }}
            >
              <Command size={11} />
              <span>K</span>
            </div>
          </button>
        )}

        {/* Right: Notification Center & User Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }} ref={dropdownRef}>
          {/* Notification Center */}
          <NotificationCenter onSelectTask={handleSelectTask} />

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-full)',
                    objectFit: 'cover',
                    border: '2px solid var(--primary)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <User size={16} />
                </div>
              )}
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {user?.email}
                </div>
              </div>
            </button>

            {dropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '200px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '6px',
                  zIndex: 50,
                }}
              >
                <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {user?.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                    {user?.email}
                  </div>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                  }}
                >
                  <UserCircle size={16} color="var(--primary)" />
                  <span>My Profile</span>
                </Link>

                {user?.role === 'ADMIN' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      color: 'var(--amber)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <Shield size={16} />
                    <span>Platform Admin</span>
                  </div>
                )}

                <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '6px 0' }} />

                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 10px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--rose)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    textAlign: 'left',
                  }}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTask={handleSelectTask}
      />

      {/* Task Detail Drawer when selected via Search or Notifications */}
      {selectedTaskId && selectedProjectId && (
        <TaskDetailDrawer
          taskId={selectedTaskId}
          projectId={selectedProjectId}
          onClose={() => {
            setSelectedTaskId(null);
            setSelectedProjectId(null);
          }}
        />
      )}
    </>
  );
};
