import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'warning';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  const iconConfig = {
    danger: (
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          background: '#F5E1DB',
          color: '#9F5141',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <AlertCircle size={26} />
      </div>
    ),
    warning: (
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          background: '#F8EBD3',
          color: '#986A25',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <AlertTriangle size={26} />
      </div>
    ),
    primary: (
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          background: 'var(--primary-soft, #FCE5C2)',
          color: '#20201D',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <HelpCircle size={26} />
      </div>
    ),
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div>
        {iconConfig[variant]}
        <h4 style={{ fontSize: '1.15rem', fontWeight: 750, color: 'var(--foreground, #20201D)', marginBottom: '8px' }}>
          {title}
        </h4>
        <p style={{ fontSize: '0.875rem', color: 'var(--foreground-secondary, #77756D)', lineHeight: 1.5, margin: 0 }}>
          {message}
        </p>
      </div>
    </Modal>
  );
};
