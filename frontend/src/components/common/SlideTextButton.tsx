import React from 'react';
import { Link } from 'react-router-dom';

/**
 * @author: @kokonut-labs (adapted for Syntrix design system)
 * @description: Interactive Slide Text Button with animated vertical text transition on hover
 * @website: https://kokonutui.com
 */

export interface SlideTextButtonProps {
  text: string;
  hoverText?: string;
  to?: string;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  icon?: React.ReactNode;
  hoverIcon?: React.ReactNode;
  style?: React.CSSProperties;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export const SlideTextButton: React.FC<SlideTextButtonProps> = ({
  text,
  hoverText,
  to,
  onClick,
  className = '',
  variant = 'primary',
  size = 'default',
  icon,
  hoverIcon,
  style,
  type = 'button',
  disabled = false,
}) => {
  const slideText = hoverText ?? text;
  const slideIcon = hoverIcon ?? icon;

  const sizeStyles = {
    sm: { height: '32px', padding: '0 14px', fontSize: '0.8rem' },
    default: { height: '40px', padding: '0 20px', fontSize: '0.875rem' },
    lg: { height: '46px', padding: '0 26px', fontSize: '0.95rem' },
  }[size];

  const variantStyles = {
    primary: {
      background: 'var(--primary, #F5AE4D)',
      color: '#20201D',
      border: '1px solid rgba(233, 149, 50, 0.4)',
      boxShadow: '0 2px 8px rgba(245, 174, 77, 0.25)',
    },
    secondary: {
      background: 'var(--surface, #FFFDF8)',
      color: 'var(--foreground, #20201D)',
      border: '1px solid var(--border, #DDD9CC)',
      boxShadow: '0 1px 3px rgba(35, 31, 20, 0.05)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--foreground, #20201D)',
      border: '1px solid var(--border-subtle, #E9E6DC)',
      boxShadow: 'none',
    },
  }[variant];

  const baseStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: '10px',
    fontWeight: 650,
    letterSpacing: '-0.01em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    textDecoration: 'none',
    userSelect: 'none',
    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    ...sizeStyles,
    ...variantStyles,
    ...style,
  };

  const content = (
    <span className="syntrix-slide-text-wrapper" style={{ position: 'relative', display: 'inline-block', height: '1.3em', overflow: 'hidden' }}>
      {/* Primary Initial Text */}
      <span className="slide-text-default" style={{ display: 'flex', alignItems: 'center', gap: '6px', transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease' }}>
        {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
        <span>{text}</span>
      </span>

      {/* Slide-In Hover Text */}
      <span
        className="slide-text-hover"
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease',
        }}
      >
        {slideIcon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{slideIcon}</span>}
        <span>{slideText}</span>
      </span>
    </span>
  );

  if (to) {
    return (
      <Link to={to} className={`syntrix-slide-btn group ${className}`} style={baseStyle}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`syntrix-slide-btn group ${className}`}
      style={baseStyle}
    >
      {content}
    </button>
  );
};

export default SlideTextButton;
