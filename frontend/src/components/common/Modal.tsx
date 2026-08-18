import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'md',
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

  const maxWidthValues = {
    sm: '420px',
    md: '520px',
    lg: '640px',
    xl: '760px',
    '2xl': '900px',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
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

      {/* Modal Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: maxWidthValues[maxWidth],
          background: 'var(--surface, #FFFDF8)',
          border: '1px solid var(--border, #DDD9CC)',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(35, 31, 20, 0.12)',
          overflow: 'hidden',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 32px)',
        }}
      >
        {/* Header */}
        {(title || subtitle) && (
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
              aria-label="Close modal"
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
        )}

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>{children}</div>

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
  );
};
