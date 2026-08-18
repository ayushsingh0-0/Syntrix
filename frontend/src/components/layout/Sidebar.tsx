import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  UserPlus,
  Settings,
  Layers,
} from 'lucide-react';
import { OrgSwitcher } from './OrgSwitcher';
import { useOrg } from '../../context';
import { Logo } from '../common/Logo';

interface SidebarProps {
  onOpenCreateOrgModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenCreateOrgModal }) => {
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
    <aside
      style={{
        width: 'var(--sidebar-width)',
        height: '100vh',
        background: '#FFFFFF',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '20px 20px 14px 20px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Logo size="md" to="/" />
      </div>

      {/* Org Switcher */}
      <div style={{ padding: '0 16px 16px 16px' }}>
        <OrgSwitcher onOpenCreateModal={onOpenCreateOrgModal} />
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', padding: '8px 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Workspace Menu
        </div>
        {navItems
          .filter((item) => !item.hide)
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '9px 14px',
                borderRadius: 'var(--radius-md)',
                color: isActive ? '#1C1917' : 'var(--text-secondary)',
                background: isActive ? '#FAF4EC' : 'transparent',
                border: isActive ? '1px solid #F5B76E' : '1px solid transparent',
                fontSize: '0.875rem',
                fontWeight: isActive ? '700' : '500',
                transition: 'all 0.15s ease',
              })}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
      </nav>

      {/* Footer Info */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <div style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Syntrix Platform v1.0.0</div>
        <div style={{ fontSize: '0.7rem' }}>Multi-Tenant Cloud</div>
      </div>
    </aside>
  );
};
