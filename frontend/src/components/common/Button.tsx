import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  style,
  className = '',
  ...props
}) => {
  const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
    sm: { padding: '6px 12px', fontSize: '0.8rem', gap: '6px', borderRadius: '8px' },
    md: { padding: '9px 16px', fontSize: '0.875rem', gap: '8px', borderRadius: '10px' },
    lg: { padding: '12px 22px', fontSize: '0.95rem', gap: '10px', borderRadius: '12px' },
  };

  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      background: 'var(--primary, #F5AE4D)',
      color: '#20201D',
      border: '1px solid transparent',
      fontWeight: 700,
      boxShadow: '0 2px 8px rgba(245, 174, 77, 0.25)',
    },
    secondary: {
      background: 'var(--surface, #FFFDF8)',
      color: 'var(--foreground, #20201D)',
      border: '1px solid var(--border, #DDD9CC)',
      fontWeight: 650,
    },
    danger: {
      background: '#9F5141',
      color: '#FFFDF8',
      border: '1px solid transparent',
      fontWeight: 700,
    },
    ghost: {
      background: 'transparent',
      color: 'var(--foreground-secondary, #77756D)',
      border: '1px solid transparent',
      fontWeight: 600,
    },
    outline: {
      background: 'transparent',
      color: 'var(--primary-hover, #E99532)',
      border: '1px solid var(--primary, #F5AE4D)',
      fontWeight: 650,
    },
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`btn-syntrix ${className}`}
      style={{
        display: fullWidth ? 'flex' : 'inline-flex',
        width: fullWidth ? '100%' : 'auto',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: disabled || isLoading ? 0.6 : 1,
        transition: 'all 0.15s ease-out',
        outline: 'none',
        textDecoration: 'none',
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    >
      {isLoading ? <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> : leftIcon}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
