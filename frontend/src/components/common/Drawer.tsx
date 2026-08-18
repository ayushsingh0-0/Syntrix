import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  position?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  position = 'right',
  size = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeWidths = {
    sm: '380px',
    md: '460px',
    lg: '560px',
    xl: '680px',
    '2xl': '800px',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, overflow: 'hidden' }}>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(32, 32, 29, 0.45)',
          backdropFilter: 'blur(4px)',
          transition: 'opacity 0.2s ease',
        }}
        onClick={onClose}
      />

      <div
        style={{
          position: 'fixed',
          insetBlock: 0,
          [position]: 0,
          display: 'flex',
          maxWidth: '100%',
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: sizeWidths[size],
            maxWidth: '100vw',
            background: 'var(--surface, #FFFDF8)',
            borderLeft: position === 'right' ? '1px solid var(--border, #DDD9CC)' : 'none',
            borderRight: position === 'left' ? '1px solid var(--border, #DDD9CC)' : 'none',
            boxShadow: '0 20px 60px rgba(35, 31, 20, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-subtle, #EEEADF)',
              background: 'var(--surface, #FFFDF8)',
            }}
          >
            <div>
              {title && (
                <h3 style={{ fontSize: '1.15rem', fontWeight: 750, color: 'var(--foreground, #20201D)', margin: 0 }}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <p style={{ fontSize: '0.8rem', color: 'var(--foreground-muted, #77756D)', margin: '4px 0 0 0' }}>
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--foreground-muted, #77756D)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>{children}</div>

          {/* Footer */}
          {footer && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '12px',
                padding: '16px 24px',
                background: 'var(--surface-secondary, #EEEADF)',
                borderTop: '1px solid var(--border-subtle, #EEEADF)',
              }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
