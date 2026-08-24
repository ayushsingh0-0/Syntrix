import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth, useOrg, useTheme } from '../../context';

/**
 * @author: @dorianbaffier (adapted for Syntrix design system)
 * @description: KokonutUI Sidebar Profile Dropdown with bending line indicator and warm tokens
 * @website: https://kokonutui.com
 */

export interface ProfileDropdownProps {
  className?: string;
  onNavigate?: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  className = '',
  onNavigate,
}) => {
  const { user, logout } = useAuth();
  const { currentOrg, myRole } = useOrg();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSignOut = () => {
    setIsOpen(false);
    logout();
    navigate('/login');
    onNavigate?.();
  };

  const displayName = user?.name || 'Ayush Singh';
  const displayEmail = user?.email || 'ayush@syntrix.io';
  const roleLabel = myRole || 'OWNER';

  return (
    <div
      ref={dropdownRef}
      className={`syntrix-profile-dropdown ${className}`}
      style={{ position: 'relative', width: '100%' }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open user profile menu"
        aria-expanded={isOpen}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 12px',
          borderRadius: '14px',
          background: isOpen ? 'var(--surface-secondary, #EEEADF)' : 'var(--surface, #FFFDF8)',
          border: '1px solid var(--border, #DDD9CC)',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          textAlign: 'left',
          boxShadow: isOpen ? '0 4px 16px rgba(245, 174, 77, 0.12)' : '0 1px 3px rgba(35, 31, 20, 0.04)',
        }}
      >
        {/* User Avatar with Gradient Ring */}
        <div
          style={{
            position: 'relative',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            padding: '2px',
            background: 'linear-gradient(135deg, #F5AE4D, #E99532, #C96D57)',
            flexShrink: 0,
          }}
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={displayName}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover',
                background: 'var(--surface, #FFFDF8)',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: 'var(--primary-soft, #FCE5C2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#20201D',
                fontWeight: 750,
                fontSize: '0.85rem',
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* User Details */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontWeight: 700,
                fontSize: '0.825rem',
                color: 'var(--foreground, #20201D)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {displayName}
            </span>
            <span
              className="badge badge-amber"
              style={{
                fontSize: '0.6rem',
                fontWeight: 750,
                padding: '1px 5px',
                borderRadius: '4px',
                lineHeight: 1.2,
                textTransform: 'uppercase',
              }}
            >
              {roleLabel}
            </span>
          </div>
          <span
            style={{
              fontSize: '0.725rem',
              color: 'var(--foreground-muted, #77756D)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayEmail}
          </span>
        </div>

        {/* KokonutUI Bending Line Indicator */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            opacity: isOpen ? 1 : 0.6,
            transition: 'all 0.2s ease',
            transform: isOpen ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          <svg
            aria-hidden="true"
            width="12"
            height="24"
            viewBox="0 0 12 24"
            fill="none"
            style={{
              color: isOpen ? 'var(--primary, #F5AE4D)' : 'var(--foreground-muted, #77756D)',
              transition: 'color 0.2s ease',
            }}
          >
            <path
              d="M2 4C6 8 6 16 2 20"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </button>

      {/* Floating Elevated Dropdown Popover */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: 0,
            width: '240px',
            background: 'var(--surface, #FFFDF8)',
            border: '1px solid var(--border, #DDD9CC)',
            borderRadius: '16px',
            padding: '8px',
            boxShadow: '0 12px 36px rgba(35, 31, 20, 0.12), 0 2px 6px rgba(35, 31, 20, 0.04)',
            zIndex: 1000,
            backdropFilter: 'blur(12px)',
            animation: 'fadeInUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Header Summary */}
          <div
            style={{
              padding: '8px 10px 10px 10px',
              borderBottom: '1px solid var(--border-subtle, #EEEADF)',
              marginBottom: '6px',
            }}
          >
            <div style={{ fontSize: '0.725rem', color: 'var(--foreground-muted, #77756D)' }}>Signed in as</div>
            <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--foreground, #20201D)' }}>
              {displayEmail}
            </div>
            {currentOrg && (
              <div style={{ fontSize: '0.7rem', color: 'var(--primary-hover, #E99532)', fontWeight: 600, marginTop: '2px' }}>
                ✦ {currentOrg.name}
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <Link
              to="/profile"
              onClick={() => {
                setIsOpen(false);
                onNavigate?.();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                borderRadius: '10px',
                fontSize: '0.825rem',
                fontWeight: 600,
                color: 'var(--foreground, #20201D)',
                textDecoration: 'none',
                transition: 'background 0.15s ease',
              }}
              className="dropdown-menu-link"
            >
              <User size={15} color="var(--primary, #F5AE4D)" />
              <span>My Profile</span>
            </Link>

            <Link
              to="/organization/settings"
              onClick={() => {
                setIsOpen(false);
                onNavigate?.();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                borderRadius: '10px',
                fontSize: '0.825rem',
                fontWeight: 600,
                color: 'var(--foreground, #20201D)',
                textDecoration: 'none',
                transition: 'background 0.15s ease',
              }}
              className="dropdown-menu-link"
            >
              <Settings size={15} color="var(--foreground-secondary, #77756D)" />
              <span>Workspace Settings</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                toggleTheme();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '8px 10px',
                borderRadius: '10px',
                fontSize: '0.825rem',
                fontWeight: 600,
                color: 'var(--foreground, #20201D)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s ease',
              }}
              className="dropdown-menu-link"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {theme === 'dark' ? <Moon size={15} color="#F4B65F" /> : <Sun size={15} color="#F5AE4D" />}
                <span>Theme: {theme === 'dark' ? 'Dark' : 'Light'}</span>
              </div>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  background: 'var(--surface-secondary, #EEEADF)',
                  color: 'var(--foreground-secondary, #77756D)',
                }}
              >
                Switch
              </span>
            </button>
          </div>

          {/* Separator */}
          <div style={{ height: '1px', background: 'var(--border-subtle, #EEEADF)', margin: '6px 0' }} />

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '8px 10px',
              borderRadius: '10px',
              fontSize: '0.825rem',
              fontWeight: 650,
              color: 'var(--error, #C96D57)',
              background: 'rgba(201, 109, 87, 0.08)',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
            className="dropdown-signout-btn"
          >
            <LogOut size={15} color="var(--error, #C96D57)" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
