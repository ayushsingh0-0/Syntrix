import React from 'react';

export interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'rounded-md',
}) => {
  const style: React.CSSProperties = {
    width: width || undefined,
    height: height || undefined,
  };

  return (
    <div
      style={style}
      className={`animate-pulse bg-slate-800/80 ${rounded} ${className}`}
    />
  );
};

export const CardSkeleton: React.FC<{ className?: string; count?: number }> = ({
  className = '',
  count = 1,
}) => {
  const cards = Array.from({ length: count });

  if (count > 1) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((_, i) => (
          <div key={i} className={`bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 ${className}`}>
            <div className="flex items-center justify-between">
              <Skeleton width="40%" height="16px" />
              <Skeleton width="24px" height="24px" rounded="rounded-full" />
            </div>
            <Skeleton width="60%" height="28px" />
            <div className="space-y-2 pt-2">
              <Skeleton width="100%" height="12px" />
              <Skeleton width="80%" height="12px" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton width="40%" height="16px" />
        <Skeleton width="24px" height="24px" rounded="rounded-full" />
      </div>
      <Skeleton width="60%" height="28px" />
      <div className="space-y-2 pt-2">
        <Skeleton width="100%" height="12px" />
        <Skeleton width="80%" height="12px" />
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => {
  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-slate-800 bg-slate-950/40">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="flex-1" height="16px" />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-slate-800/60 p-4 space-y-4">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 py-2">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="flex-1" height="14px" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const PageLoader: React.FC = () => {
  return (
    <div className="flex-1 min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <div className="absolute w-6 h-6 rounded-full bg-indigo-500/30 blur-sm" />
      </div>
      <p className="text-xs font-medium text-slate-400 mt-4 tracking-wider uppercase animate-pulse">
        Loading view...
      </p>
    </div>
  );
};
