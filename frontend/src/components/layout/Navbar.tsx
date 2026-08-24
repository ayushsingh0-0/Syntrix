import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, LogOut, Shield, UserCircle, Menu } from 'lucide-react';
import { useAuth, useOrg } from '../../context';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { GlobalSearchModal } from '../modals/GlobalSearchModal';
import { TaskDetailDrawer } from '../tasks/TaskDetailDrawer';
import { CommandButton } from '../common/CommandButton';
import { SwitchButton } from '../common/SwitchButton';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu }) => {
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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '60px',
          padding: '0 24px',
          background: 'var(--surface, #FFFDF8)',
          borderBottom: '1px solid var(--border, #DDD9CC)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        {/* Left: Mobile Toggle & Workspace Context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onToggleMobileMenu && (
            <button
              type="button"
              className="mobile-hamburger-btn"
              onClick={onToggleMobileMenu}
              aria-label="Open navigation sidebar"
              style={{
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'var(--surface-secondary, #EEEADF)',
                border: '1px solid var(--border-subtle, #E9E6DC)',
                color: 'var(--foreground, #20201D)',
                cursor: 'pointer',
              }}
            >
              <Menu size={18} />
            </button>
          )}

          {currentOrg ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--foreground-muted, #9A978D)' }}>
                Workspace:
              </span>
              <span style={{ fontWeight: 650, fontSize: '0.925rem', color: 'var(--foreground, #20201D)' }}>
                {currentOrg.name}
              </span>
              {myRole && (
                <span
                  className="badge badge-amber"
                  style={{
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    padding: '2px 6px',
                  }}
                >
                  {myRole}
                </span>
              )}
            </div>
          ) : (
            <span style={{ fontSize: '0.9rem', color: 'var(--foreground-secondary, #77756D)' }}>Welcome to Syntrix</span>
          )}
        </div>

        {/* Center: Interactive KokonutUI Command Button */}
        {currentOrg && (
          <CommandButton
            onClick={() => setIsSearchOpen(true)}
            aria-label="Open command palette search"
          />
        )}

        {/* Right: Theme Toggle, Notification Center & User Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} ref={dropdownRef}>
          {/* KokonutUI Theme Switcher */}
          <SwitchButton size="sm" />

          {/* Notification Center */}
          <NotificationCenter onSelectTask={handleSelectTask} />

          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-label="Open user profile menu"
              aria-expanded={dropdownOpen}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '10px',
                outline: 'none',
              }}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid var(--primary, #F5AE4D)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: 'var(--primary-soft, #FCE5C2)',
                    border: '1px solid var(--border, #DDD9CC)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#20201D',
                    fontWeight: 750,
                    fontSize: '0.85rem',
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase() || <User size={16} />}
                </div>
              )}
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '750', color: 'var(--foreground, #20201D)' }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--foreground-muted, #77756D)' }}>
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
                  width: '210px',
                  background: 'var(--surface, #FFFDF8)',
                  border: '1px solid var(--border, #DDD9CC)',
                  borderRadius: '14px',
                  boxShadow: '0 12px 36px rgba(35, 31, 20, 0.10)',
                  padding: '6px',
                  zIndex: 50,
                }}
              >
                <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle, #EEEADF)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '750', color: 'var(--foreground, #20201D)' }}>
                    {user?.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--foreground-muted, #77756D)', wordBreak: 'break-all' }}>
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
                    borderRadius: '8px',
                    color: 'var(--foreground, #20201D)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <UserCircle size={16} color="var(--primary-hover, #E99532)" />
                  <span>My Profile</span>
                </Link>

                {user?.role === 'ADMIN' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      color: '#986A25',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}
                  >
                    <Shield size={16} />
                    <span>Platform Admin</span>
                  </div>
                )}

                <div style={{ height: '1px', background: 'var(--border-subtle, #EEEADF)', margin: '6px 0' }} />

                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 10px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#9F5141',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 650,
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
