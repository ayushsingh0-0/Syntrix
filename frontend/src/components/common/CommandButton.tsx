import React from 'react';
import { Command, Search } from 'lucide-react';

/**
 * @author: @dorianbaffier (adapted for Syntrix design system)
 * @description: Interactive Command/Search Trigger with Warm Amber Shimmer
 * @website: https://kokonutui.com
 */

export interface CommandButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: 'compact' | 'searchbar';
}

export const CommandButton: React.FC<CommandButtonProps> = ({
  children,
  variant = 'searchbar',
  style,
  className = '',
  ...props
}) => {
  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
  const shortcutKey = isMac ? '⌘K' : 'Ctrl K';

  return (
    <button
      {...props}
      className={`syntrix-command-btn ${className}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        padding: variant === 'compact' ? '6px 12px' : '7px 14px',
        minWidth: variant === 'compact' ? 'auto' : '220px',
        borderRadius: '10px',
        background: 'var(--surface, #FFFDF8)',
        border: '1px solid var(--border, #DDD9CC)',
        color: 'var(--foreground-secondary, #77756D)',
        cursor: 'pointer',
        fontSize: '0.825rem',
        overflow: 'hidden',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        outline: 'none',
        boxShadow: '0 1px 3px rgba(35, 31, 20, 0.04)',
        ...style,
      }}
    >
      {/* Left side: Icon + Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}>
        {variant === 'searchbar' ? (
          <Search
            size={14}
            className="cmd-icon"
            style={{
              color: 'var(--primary-hover, #E99532)',
              transition: 'transform 0.3s ease',
            }}
          />
        ) : (
          <Command
            size={14}
            className="cmd-icon"
            style={{
              color: 'var(--primary, #F5AE4D)',
              transition: 'transform 0.3s ease',
            }}
          />
        )}
        <span style={{ fontWeight: 500, color: 'var(--foreground, #20201D)' }}>
          {children || (variant === 'searchbar' ? 'Search workspace...' : shortcutKey)}
        </span>
      </div>

      {/* Right side: Keyboard Shortcut Badge (for searchbar variant) */}
      {variant === 'searchbar' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            padding: '2px 6px',
            background: 'var(--surface-secondary, #EEEADF)',
            border: '1px solid var(--border-subtle, #E9E6DC)',
            borderRadius: '5px',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: 'var(--foreground-muted, #9A978D)',
            zIndex: 1,
            transition: 'all 0.2s ease',
          }}
          className="cmd-badge"
        >
          <Command size={10} />
          <span>K</span>
        </div>
      )}

      {/* Warm Amber Shimmer Highlight Effect on Hover */}
      <span
        className="cmd-shimmer"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(245, 174, 77, 0) 0%, rgba(245, 174, 77, 0.18) 50%, rgba(245, 174, 77, 0) 100%)',
          transform: 'translateX(-100%)',
          transition: 'transform 0.55s ease-out',
          pointerEvents: 'none',
        }}
      />
    </button>
  );
};

export default CommandButton;
