import React from 'react';
import { Button } from './Button';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  actionIcon,
  secondaryActionText,
  onSecondaryAction,
  className = '',
  style,
}) => {
  return (
    <div
      className={`card ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        background: 'var(--surface, #FFFDF8)',
        border: '1px solid var(--border, #DDD9CC)',
        borderRadius: '20px',
        ...style,
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'var(--primary-soft, #FCE5C2)',
          color: '#20201D',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        {icon || <Inbox size={28} />}
      </div>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 750, color: 'var(--foreground, #20201D)', margin: '0 0 6px 0' }}>
        {title}
      </h3>
      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--foreground-secondary, #77756D)',
          maxWidth: '380px',
          lineHeight: 1.5,
          margin: '0 0 20px 0',
        }}
      >
        {description}
      </p>
      {(actionText || secondaryActionText) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {secondaryActionText && (
            <Button variant="secondary" size="sm" onClick={onSecondaryAction}>
              {secondaryActionText}
            </Button>
          )}
          {actionText && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAction}
              leftIcon={actionIcon}
            >
              {actionText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
