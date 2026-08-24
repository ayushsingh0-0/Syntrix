import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context';

/**
 * @author: @dorianbaffier (adapted for Syntrix design system)
 * @description: Interactive KokonutUI Theme Switch Button with 360° Sun/Moon animations
 * @website: https://kokonutui.com
 */

export interface SwitchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'minimal';
  size?: 'sm' | 'default' | 'lg';
  showLabel?: boolean;
}

export const SwitchButton: React.FC<SwitchButtonProps> = ({
  className = '',
  size = 'default',
  showLabel = true,
  style,
  ...props
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const sizeStyles = {
    sm: { height: '32px', padding: '0 10px', fontSize: '0.775rem', iconSize: 13 },
    default: { height: '36px', padding: '0 14px', fontSize: '0.825rem', iconSize: 15 },
    lg: { height: '42px', padding: '0 18px', fontSize: '0.9rem', iconSize: 18 },
  }[size];

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`syntrix-theme-switch-btn group ${className}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        height: sizeStyles.height,
        padding: sizeStyles.padding,
        fontSize: sizeStyles.fontSize,
        fontWeight: 550,
        borderRadius: '10px',
        background: isDark ? 'var(--surface-secondary, #292720)' : 'var(--surface, #FFFDF8)',
        border: '1px solid var(--border, #DDD9CC)',
        color: isDark ? 'var(--foreground, #F5F1E7)' : 'var(--foreground, #20201D)',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        userSelect: 'none',
        boxShadow: isDark ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(35, 31, 20, 0.04)',
        ...style,
      }}
      {...props}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 2 }}>
        {/* Animated Sun / Moon Icon */}
        <div
          className="theme-icon-container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            filter: isDark
              ? 'drop-shadow(0 0 8px rgba(244, 182, 95, 0.4))'
              : 'drop-shadow(0 0 10px rgba(245, 174, 77, 0.45))',
          }}
        >
          {isDark ? (
            <Moon
              size={sizeStyles.iconSize}
              style={{
                color: 'var(--primary, #F4B65F)',
                transition: 'all 0.4s ease',
              }}
            />
          ) : (
            <Sun
              size={sizeStyles.iconSize}
              style={{
                color: 'var(--primary, #F5AE4D)',
                transition: 'all 0.4s ease',
              }}
            />
          )}
        </div>

        {/* Dynamic Label Cross-Fade */}
        {showLabel && (
          <span
            style={{
              position: 'relative',
              fontWeight: 600,
              textTransform: 'capitalize',
              letterSpacing: '0.01em',
            }}
          >
            {isDark ? 'Dark' : 'Light'}
          </span>
        )}
      </div>

      {/* Shimmer Sweep Effect on Hover */}
      <span
        className="theme-shimmer"
        style={{
          position: 'absolute',
          inset: 0,
          background: isDark
            ? 'linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(244, 182, 95, 0.12) 50%, rgba(255, 255, 255, 0) 100%)'
            : 'linear-gradient(90deg, rgba(245, 174, 77, 0) 0%, rgba(245, 174, 77, 0.18) 50%, rgba(245, 174, 77, 0) 100%)',
          transform: 'translateX(-100%)',
          transition: 'transform 0.5s ease-out',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
    </button>
  );
};

export default SwitchButton;
