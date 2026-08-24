import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  UserPlus,
  Settings,
  Layers,
  X,
} from 'lucide-react';
import { OrgSwitcher } from './OrgSwitcher';
import { useOrg } from '../../context';
import { Logo } from '../common/Logo';
import { ProfileDropdown } from './ProfileDropdown';

interface SidebarProps {
  onOpenCreateOrgModal: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenCreateOrgModal,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { hasPermission } = useOrg();

  const navItems = [
    { label: 'Overview', to: '/', icon: <LayoutDashboard size={18} /> },
    { label: 'Projects', to: '/projects', icon: <FolderKanban size={18} /> },
    { label: 'Teams', to: '/organization/teams', icon: <Layers size={18} /> },
    { label: 'Members', to: '/organization/members', icon: <Users size={18} /> },
    {
      label: 'Invitations',
      to: '/organization/invitations',
      icon: <UserPlus size={18} />,
      hide: !hasPermission('MEMBER_INVITE'),
    },
    {
      label: 'Settings',
      to: '/organization/settings',
      icon: <Settings size={18} />,
      hide: !hasPermission('ORG_UPDATE'),
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(32, 32, 29, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 998,
          }}
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`app-sidebar ${isOpenMobile ? 'mobile-open' : ''}`}
        style={{
          width: 'var(--sidebar-width, 240px)',
          height: '100vh',
          background: 'var(--surface, #FFFDF8)',
          borderRight: '1px solid var(--border, #DDD9CC)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 999,
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '20px 20px 14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Logo size="md" to="/" />
          {isOpenMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close menu"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--foreground-muted, #77756D)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Org Switcher */}
        <div style={{ padding: '0 16px 16px 16px' }}>
          <OrgSwitcher onOpenCreateModal={onOpenCreateOrgModal} />
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--foreground-muted, #77756D)', padding: '8px 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Workspace Menu
          </div>
          {navItems
            .filter((item) => !item.hide)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '9px 14px',
                  borderRadius: 'var(--radius-sm, 10px)',
                  color: isActive ? 'var(--foreground, #20201D)' : 'var(--foreground-secondary, #77756D)',
                  background: isActive ? 'var(--primary-soft, #FCE5C2)' : 'transparent',
                  border: isActive ? '1px solid var(--border, #DDD9CC)' : '1px solid transparent',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? '750' : '550',
                  transition: 'all 0.15s ease',
                  textDecoration: 'none',
                })}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
        </nav>

        {/* User Profile Dropdown Footer */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border-subtle, #EEEADF)' }}>
          <ProfileDropdown onNavigate={onCloseMobile} />
        </div>
      </aside>
    </>
  );
};
