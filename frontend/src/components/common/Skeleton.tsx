import React from 'react';

export interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  borderRadius?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height = '16px',
  borderRadius = '8px',
  style,
}) => {
  return (
    <div
      className={className}
      style={{
        width: width || '100%',
        height,
        borderRadius,
        background: 'var(--surface-secondary, #EEEADF)',
        opacity: 0.8,
        animation: 'pulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        ...style,
      }}
    />
  );
};

export const CardSkeleton: React.FC<{ style?: React.CSSProperties; className?: string }> = ({
  style,
  className = '',
}) => {
  return (
    <div
      className={`card ${className}`}
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        background: 'var(--surface, #FFFDF8)',
        border: '1px solid var(--border, #DDD9CC)',
        borderRadius: '18px',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Skeleton width="45%" height="16px" />
        <Skeleton width="28px" height="28px" borderRadius="50%" />
      </div>
      <Skeleton width="70%" height="28px" borderRadius="10px" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '6px' }}>
        <Skeleton width="100%" height="12px" />
        <Skeleton width="75%" height="12px" />
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => {
  return (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: 'hidden',
        background: 'var(--surface, #FFFDF8)',
        border: '1px solid var(--border, #DDD9CC)',
        borderRadius: '18px',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '16px',
          padding: '16px 20px',
          background: 'var(--surface-secondary, #EEEADF)',
          borderBottom: '1px solid var(--border, #DDD9CC)',
        }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} style={{ flex: 1 }} height="16px" />
        ))}
      </div>
      <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '6px 0' }}>
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} style={{ flex: 1 }} height="14px" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const PageLoader: React.FC = () => {
  return (
    <div
      style={{
        flex: 1,
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid var(--primary-soft, #FCE5C2)',
          borderTopColor: 'var(--primary, #F5AE4D)',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p
        style={{
          fontSize: '0.8rem',
          fontWeight: 700,
          color: 'var(--foreground-muted, #77756D)',
          marginTop: '16px',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        Loading workspace view...
      </p>
    </div>
  );
};
