import React, { useState } from 'react';
import { Check, ChevronRight, User2 } from 'lucide-react';

/**
 * @author: @dorianbaffier (adapted for Syntrix design system)
 * @description: KokonutUI Avatar Picker & Profile Setup Onboarding Component
 * @version: 2.0.0
 * @website: https://kokonutui.com
 */

export interface AvatarOption {
  id: number;
  alt: string;
  colorRing: string; // RGB string e.g. "245, 174, 77"
  svg: React.ReactNode;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: 1,
    alt: 'Amber Artisan',
    colorRing: '245, 174, 77',
    svg: (
      <svg aria-label="Avatar 1" fill="none" height="40" role="img" viewBox="0 0 36 36" width="40">
        <mask height="36" id=":r111:" maskUnits="userSpaceOnUse" width="36" x="0" y="0">
          <rect fill="#FFFFFF" height="36" rx="72" width="36" />
        </mask>
        <g mask="url(#:r111:)">
          <rect fill="#F5AE4D" height="36" width="36" />
          <rect fill="#E99532" height="36" rx="6" transform="translate(9 -5) rotate(219 18 18) scale(1)" width="36" x="0" y="0" />
          <g transform="translate(4.5 -4) rotate(9 18 18)">
            <path d="M15 19c2 1 4 1 6 0" fill="none" stroke="#20201D" strokeLinecap="round" />
            <rect fill="#20201D" height="2" rx="1" width="1.5" x="10" y="14" />
            <rect fill="#20201D" height="2" rx="1" width="1.5" x="24" y="14" />
          </g>
        </g>
      </svg>
    ),
  },
  {
    id: 2,
    alt: 'Charcoal Architect',
    colorRing: '113, 152, 121',
    svg: (
      <svg aria-label="Avatar 2" fill="none" height="40" role="img" viewBox="0 0 36 36" width="40">
        <mask height="36" id=":R4mrttb:" maskUnits="userSpaceOnUse" width="36" x="0" y="0">
          <rect fill="#FFFFFF" height="36" rx="72" width="36" />
        </mask>
        <g mask="url(#:R4mrttb:)">
          <rect fill="#719879" height="36" width="36" />
          <rect fill="#20201D" height="36" rx="6" transform="translate(5 -1) rotate(55 18 18) scale(1.1)" width="36" x="0" y="0" />
          <g transform="translate(7 -6) rotate(-5 18 18)">
            <path d="M15 20c2 1 4 1 6 0" fill="none" stroke="#FFFDF8" strokeLinecap="round" />
            <rect fill="#FFFDF8" height="2" rx="1" width="1.5" x="14" y="14" />
            <rect fill="#FFFDF8" height="2" rx="1" width="1.5" x="20" y="14" />
          </g>
        </g>
      </svg>
    ),
  },
  {
    id: 3,
    alt: 'Warm Terracotta',
    colorRing: '201, 109, 87',
    svg: (
      <svg aria-label="Avatar 3" fill="none" height="40" role="img" viewBox="0 0 36 36" width="40">
        <mask height="36" id=":r11c:" maskUnits="userSpaceOnUse" width="36" x="0" y="0">
          <rect fill="#FFFFFF" height="36" rx="72" width="36" />
        </mask>
        <g mask="url(#:r11c:)">
          <rect fill="#20201D" height="36" width="36" />
          <rect fill="#C96D57" height="36" rx="36" transform="translate(-3 7) rotate(227 18 18) scale(1.2)" width="36" x="0" y="0" />
          <g transform="translate(-3 3.5) rotate(7 18 18)">
            <path d="M13,21 a1,0.75 0 0,0 10,0" fill="#FFFDF8" />
            <rect fill="#FFFDF8" height="2" rx="1" width="1.5" x="12" y="14" />
            <rect fill="#FFFDF8" height="2" rx="1" width="1.5" x="22" y="14" />
          </g>
        </g>
      </svg>
    ),
  },
  {
    id: 4,
    alt: 'Sage Strategist',
    colorRing: '217, 150, 61',
    svg: (
      <svg aria-label="Avatar 4" fill="none" height="40" role="img" viewBox="0 0 36 36" width="40">
        <mask height="36" id=":r1gg:" maskUnits="userSpaceOnUse" width="36" x="0" y="0">
          <rect fill="#FFFFFF" height="36" rx="72" width="36" />
        </mask>
        <g mask="url(#:r1gg:)">
          <rect fill="#EEEADF" height="36" width="36" />
          <rect fill="#D9963D" height="36" rx="6" transform="translate(9 -5) rotate(219 18 18) scale(1)" width="36" x="0" y="0" />
          <g transform="translate(4.5 -4) rotate(9 18 18)">
            <path d="M15 19c2 1 4 1 6 0" fill="none" stroke="#20201D" strokeLinecap="round" />
            <rect fill="#20201D" height="2" rx="1" width="1.5" x="10" y="14" />
            <rect fill="#20201D" height="2" rx="1" width="1.5" x="24" y="14" />
          </g>
        </g>
      </svg>
    ),
  },
];

export interface AvatarPickerProps {
  onComplete?: (data: { username: string; avatarId: number }) => void;
  className?: string;
  initialAvatarId?: number;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  onComplete,
  className = '',
  initialAvatarId = 1,
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarOption>(
    AVATAR_OPTIONS.find((a) => a.id === initialAvatarId) || AVATAR_OPTIONS[0]
  );
  const [username, setUsername] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const isValid = username.trim().length >= 3;
  const showError = username.trim().length > 0 && username.trim().length < 3;

  const handleSubmit = () => {
    if (username.trim() && onComplete) {
      onComplete({
        username: username.trim(),
        avatarId: selectedAvatar.id,
      });
    }
  };

  return (
    <div
      className={`card ${className}`}
      style={{
        maxWidth: '420px',
        width: '100%',
        margin: '0 auto',
        padding: '32px 28px',
        borderRadius: '18px',
        background: 'var(--surface, #FFFDF8)',
        border: '1px solid var(--border, #DDD9CC)',
        boxShadow: 'var(--shadow-md, 0 8px 30px rgba(35, 31, 20, 0.06))',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 750, color: 'var(--foreground, #20201D)', marginBottom: '4px' }}>
          Pick Your Avatar
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--foreground-muted, #77756D)' }}>
          Choose your workspace persona to get started
        </p>
      </div>

      {/* Big Avatar Display Stage */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
        <div
          style={{
            position: 'relative',
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            boxShadow: `0 0 0 3px rgba(${selectedAvatar.colorRing}, 0.55), 0 8px 28px rgba(${selectedAvatar.colorRing}, 0.25)`,
            transition: 'box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: 'scale(3.5)',
              transition: 'transform 0.3s ease',
            }}
          >
            {selectedAvatar.svg}
          </div>
        </div>

        {/* Selected Persona Name */}
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--foreground-secondary, #77756D)',
          }}
        >
          {selectedAvatar.alt}
        </span>

        {/* Thumbnail Selector Strip */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {AVATAR_OPTIONS.map((avatar) => {
            const isSelected = selectedAvatar.id === avatar.id;
            return (
              <button
                key={avatar.id}
                type="button"
                aria-label={`Select ${avatar.alt}`}
                onClick={() => setSelectedAvatar(avatar)}
                style={{
                  position: 'relative',
                  width: '54px',
                  height: '54px',
                  borderRadius: '12px',
                  background: 'var(--surface-secondary, #EEEADF)',
                  border: isSelected ? '2px solid var(--primary, #F5AE4D)' : '1px solid var(--border, #DDD9CC)',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  padding: 0,
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: isSelected ? '0 0 0 3px rgba(245, 174, 77, 0.25)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', transform: 'scale(1.5)' }}>
                  {avatar.svg}
                </div>

                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      right: '2px',
                      bottom: '2px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: 'var(--primary, #F5AE4D)',
                      color: '#20201D',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check size={10} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Username Field */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="input-group" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label className="input-label" style={{ marginBottom: 0 }}>Username</label>
            <span style={{ fontSize: '0.75rem', color: username.length >= 18 ? 'var(--warning)' : 'var(--foreground-muted)' }}>
              {username.length}/20
            </span>
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type="text"
              name="username"
              maxLength={20}
              placeholder="e.g. ayush_arch"
              value={username}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              style={{
                paddingLeft: '38px',
                borderColor: showError ? 'var(--error)' : isFocused ? 'var(--primary)' : 'var(--border)',
              }}
            />
            <User2
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: isFocused ? 'var(--primary)' : 'var(--foreground-muted)',
                transition: 'color 0.2s ease',
              }}
            />
          </div>

          {showError && (
            <span style={{ fontSize: '0.75rem', color: 'var(--error)', marginTop: '4px', display: 'block' }}>
              Username must be at least 3 characters
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={!isValid}
          onClick={handleSubmit}
          className="btn btn-primary"
          style={{
            height: '44px',
            borderRadius: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '8px',
          }}
        >
          <span>Get Started</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default AvatarPicker;
