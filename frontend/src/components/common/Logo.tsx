import React from 'react';
import { Link } from 'react-router-dom';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  to?: string;
  className?: string;
  style?: React.CSSProperties;
}

const sizeMap = {
  sm: { img: 24, font: '18px', radius: 6, gap: 6 },
  md: { img: 30, font: '22px', radius: 8, gap: 8 },
  lg: { img: 38, font: '26px', radius: 10, gap: 10 },
  xl: { img: 48, font: '32px', radius: 12, gap: 12 },
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  to,
  className,
  style,
}) => {
  const current = sizeMap[size];

  const content = (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${current.gap}px`,
        color: '#20201D',
        textDecoration: 'none',
        userSelect: 'none',
        ...style,
      }}
    >
      <div
        style={{
          width: `${current.img}px`,
          height: `${current.img}px`,
          borderRadius: `${current.radius}px`,
          overflow: 'hidden',
          backgroundColor: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.18)',
          flexShrink: 0,
        }}
      >
        <img
          src="/logo.png"
          alt="Syntrix Logo"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </div>

      {showText && (
        <span
          style={{
            fontWeight: 850,
            fontSize: current.font,
            letterSpacing: '-0.04em',
            color: 'inherit',
            lineHeight: 1,
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          syntrix
          <span
            style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              background: '#F5AE4D',
              borderRadius: '50%',
              marginLeft: '3px',
              alignSelf: 'flex-start',
              marginTop: '4px',
            }}
          />
        </span>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} style={{ textDecoration: 'none', color: 'inherit', display: 'inline-block' }}>
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;
