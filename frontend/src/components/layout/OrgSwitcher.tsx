import React, { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check, Plus } from 'lucide-react';
import { useOrg } from '../../context/OrgContext';

interface OrgSwitcherProps {
  onOpenCreateModal: () => void;
}

export const OrgSwitcher: React.FC<OrgSwitcherProps> = ({ onOpenCreateModal }) => {
  const { orgs, currentOrg, switchOrg } = useOrg();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '10px 12px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: '700',
              fontSize: '0.8rem',
              flexShrink: 0,
            }}
          >
            {currentOrg?.name?.charAt(0).toUpperCase() || <Building2 size={16} />}
          </div>
          <div style={{ textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', lineHeight: 1.2 }}>
              {currentOrg ? currentOrg.name : 'Select Organization'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {currentOrg ? currentOrg.slug : 'No active workspace'}
            </div>
          </div>
        </div>
        <ChevronDown size={16} color="var(--text-secondary)" />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: '100%',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            padding: '6px',
            zIndex: 50,
            maxHeight: '260px',
            overflowY: 'auto',
          }}
        >
          <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', padding: '6px 8px', textTransform: 'uppercase' }}>
            Workspaces
          </div>
          {orgs.map((org) => (
            <button
              key={org.id}
              onClick={() => {
                switchOrg(org.id);
                setIsOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '8px 10px',
                background: currentOrg?.id === org.id ? 'var(--bg-card-hover)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: currentOrg?.id === org.id ? '700' : '500' }}>
                  {org.name}
                </span>
              </div>
              {currentOrg?.id === org.id && <Check size={14} color="var(--primary)" />}
            </button>
          ))}

          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '6px 0' }} />

          <button
            onClick={() => {
              setIsOpen(false);
              onOpenCreateModal();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: '8px 10px',
              background: 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--primary)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '600',
            }}
          >
            <Plus size={16} />
            <span>Create Organization</span>
          </button>
        </div>
      )}
    </div>
  );
};
