import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Margin } from './chart-context';
import {
  LineChartContext,
  useLineChart,
  type LineSeriesConfig,
} from './line-context';

// ============================================================================
// Spline / Path Utilities
// ============================================================================

function generateSvgPath(
  points: Array<{ x: number; y: number }>,
  curve: 'linear' | 'monotone' | 'step' = 'monotone'
): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  if (curve === 'linear') {
    return points.reduce(
      (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
      ''
    );
  }

  if (curve === 'step') {
    return points.reduce((acc, pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      const prev = points[i - 1];
      const midX = (prev.x + pt.x) / 2;
      return `${acc} H ${midX} V ${pt.y} H ${pt.x}`;
    }, '');
  }

  // Monotone Cubic Spline (Smooth curved line)
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x} ${p2.y}`;
  }
  return path;
}

// ============================================================================
// 1. Root Component: <LineChart>
// ============================================================================

export interface LineChartProps<T extends object = Record<string, unknown>> {
  data: T[];
  xDataKey?: string;
  margin?: Partial<Margin>;
  aspectRatio?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export function LineChart<T extends object>({
  data,
  xDataKey = 'name',
  margin: customMargin,
  aspectRatio = '2.3 / 1',
  className,
  style,
  children,
}: LineChartProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeHoverIndex, setActiveHoverIndex] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  const margin: Margin = {
    top: customMargin?.top ?? 20,
    right: customMargin?.right ?? 20,
    bottom: customMargin?.bottom ?? 32,
    left: customMargin?.left ?? 24,
  };

  const rawData = data as unknown as Record<string, unknown>[];

  // Inspect children synchronously to collect series info
  const series = useMemo<LineSeriesConfig[]>(() => {
    const collected: LineSeriesConfig[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        const props = child.props as Record<string, unknown>;
        if (typeof props.dataKey === 'string') {
          collected.push({
            dataKey: props.dataKey,
            stroke: typeof props.stroke === 'string' ? props.stroke : undefined,
            strokeWidth: typeof props.strokeWidth === 'number' ? props.strokeWidth : 2.5,
            fill: typeof props.fill === 'string' ? props.fill : undefined,
            showDots: Boolean(props.showDots),
            curve: (props.curve as 'linear' | 'monotone' | 'step') || 'monotone',
          });
        }
      }
    });
    return collected;
  }, [children]);

  // Find max value across all data points and series
  const dataKeys = series.map((s) => s.dataKey);
  let computedMax = 5;
  rawData.forEach((d) => {
    dataKeys.forEach((k) => {
      const val = Number(d[k]) || 0;
      if (val > computedMax) computedMax = val;
    });
  });

  const maxValue = Math.max(Math.ceil(computedMax * 1.15), 1);

  const viewBoxWidth = 600;
  const viewBoxHeight = 280;
  const innerWidth = viewBoxWidth - margin.left - margin.right;
  const innerHeight = viewBoxHeight - margin.top - margin.bottom;

  const getPointCoords = (index: number, val: number) => {
    const totalPoints = Math.max(rawData.length - 1, 1);
    const x = margin.left + (index / totalPoints) * innerWidth;
    const y = margin.top + innerHeight - (val / maxValue) * innerHeight;
    return { x, y };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (rawData.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * viewBoxWidth;

    const clampedX = Math.max(margin.left, Math.min(margin.left + innerWidth, svgX));
    const ratio = (clampedX - margin.left) / innerWidth;
    const index = Math.min(Math.round(ratio * (rawData.length - 1)), rawData.length - 1);

    setActiveHoverIndex(index);
    setHoverPos({ x: clientX, y: e.clientY - rect.top });
  };

  return (
    <LineChartContext.Provider
      value={{
        data: rawData,
        xDataKey,
        margin,
        chartWidth: innerWidth,
        chartHeight: innerHeight,
        activeHoverIndex,
        setActiveHoverIndex,
        hoverPos,
        setHoverPos,
        series,
        maxValue,
        getPointCoords,
      }}
    >
      <div
        ref={containerRef}
        className={className}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio,
          userSelect: 'none',
          ...style,
        }}
        onMouseLeave={() => {
          setActiveHoverIndex(null);
          setHoverPos(null);
        }}
      >
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          style={{ width: '100%', height: '100%', overflow: 'visible', display: 'block' }}
          onMouseMove={handleMouseMove}
        >
          {/* Active hover vertical crosshair line */}
          {activeHoverIndex !== null && rawData.length > 0 && (
            <line
              x1={getPointCoords(activeHoverIndex, 0).x}
              y1={margin.top}
              x2={getPointCoords(activeHoverIndex, 0).x}
              y2={margin.top + innerHeight}
              stroke="var(--foreground-muted, #77756D)"
              strokeDasharray="3 3"
              strokeOpacity={0.6}
            />
          )}

          {children}
        </svg>
      </div>
    </LineChartContext.Provider>
  );
}

// ============================================================================
// 2. Line Component: <Line>
// ============================================================================

export interface LineProps {
  dataKey: string;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  showDots?: boolean;
  curve?: 'linear' | 'monotone' | 'step';
  strokeDasharray?: string;
  animate?: boolean;
}

export const Line: React.FC<LineProps> = ({
  dataKey,
  stroke = 'var(--primary, #F5AE4D)',
  strokeWidth = 2.5,
  fill,
  showDots = false,
  curve = 'monotone',
  strokeDasharray,
  animate = true,
}) => {
  const { data, margin, chartHeight, activeHoverIndex, getPointCoords } = useLineChart();

  const points = data.map((item, idx) => {
    const val = Number(item[dataKey]) || 0;
    return getPointCoords(idx, val);
  });

  const linePath = generateSvgPath(points, curve);

  // Area path for gradient fill underneath
  const areaPath = useMemo(() => {
    if (points.length < 2 || !fill) return '';
    const first = points[0];
    const last = points[points.length - 1];
    const baselineY = margin.top + chartHeight;
    return `${linePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
  }, [linePath, points, fill, margin.top, chartHeight]);

  const activePoint = activeHoverIndex !== null ? points[activeHoverIndex] : null;

  return (
    <g className={`bklit-line-series-${dataKey}`}>
      {/* Area Fill Gradient Underneath */}
      {fill && areaPath && (
        <motion.path
          d={areaPath}
          fill={fill}
          initial={animate ? { opacity: 0 } : undefined}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      )}

      {/* Main Line Stroke */}
      <motion.path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={strokeDasharray}
        initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Persistent dots if requested */}
      {showDots &&
        points.map((pt, idx) => (
          <circle
            key={idx}
            cx={pt.x}
            cy={pt.y}
            r={3}
            fill="var(--surface, #FFFDF8)"
            stroke={stroke}
            strokeWidth={2}
          />
        ))}

      {/* Active Hover Dot Indicator with Ring Pulse */}
      {activePoint && (
        <g>
          <circle
            cx={activePoint.x}
            cy={activePoint.y}
            r={6}
            fill={stroke}
            opacity={0.25}
          />
          <circle
            cx={activePoint.x}
            cy={activePoint.y}
            r={3.5}
            fill="var(--surface, #FFFDF8)"
            stroke={stroke}
            strokeWidth={2.5}
          />
        </g>
      )}
    </g>
  );
};

// ============================================================================
// 3. Line X-Axis: <LineXAxis>
// ============================================================================

export interface LineXAxisProps {
  step?: number;
  maxLabels?: number;
  fontSize?: number;
}

export const LineXAxis: React.FC<LineXAxisProps> = ({ step: customStep, maxLabels = 12, fontSize = 10 }) => {
  const { data, xDataKey, margin, chartHeight, getPointCoords } = useLineChart();

  const total = data.length;
  const step = customStep ?? Math.max(Math.ceil(total / maxLabels), 1);

  return (
    <g className="bklit-line-x-axis">
      {data.map((item, idx) => {
        // Show points according to step, always including first and last
        const isTick = idx % step === 0 || idx === total - 1;
        if (!isTick) return null;

        const { x } = getPointCoords(idx, 0);
        const y = margin.top + chartHeight + 18;
        const label = String(item[xDataKey] || '');

        return (
          <text
            key={idx}
            x={x}
            y={y}
            textAnchor="middle"
            fill="var(--foreground-muted, #77756D)"
            fontSize={fontSize}
            fontFamily="inherit"
            fontWeight="550"
          >
            {label}
          </text>
        );
      })}
    </g>
  );
};

// ============================================================================
// 4. Line Tooltip: <LineChartTooltip>
// ============================================================================

export interface LineChartTooltipProps {
  formatter?: (val: number, dataKey: string) => string;
}

export const LineChartTooltip: React.FC<LineChartTooltipProps> = ({ formatter }) => {
  const { data, xDataKey, activeHoverIndex, series, margin, chartWidth, getPointCoords } = useLineChart();

  if (activeHoverIndex === null || !data[activeHoverIndex]) return null;

  const current = data[activeHoverIndex];
  const { x } = getPointCoords(activeHoverIndex, 0);
  const leftPercent = (x / (margin.left + chartWidth + margin.right)) * 100;

  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        left: `${leftPercent}%`,
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        zIndex: 25,
      }}
    >
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.95 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          style={{
            background: 'var(--surface, #FFFDF8)',
            border: '1px solid var(--border, #DDD9CC)',
            borderRadius: '12px',
            padding: '10px 14px',
            boxShadow: '0 8px 30px rgba(35, 31, 20, 0.12)',
            minWidth: '120px',
            fontSize: '12px',
            color: 'var(--foreground, #20201D)',
          }}
        >
          <div
            style={{
              fontWeight: '750',
              marginBottom: '6px',
              borderBottom: '1px solid var(--border-subtle, #EEEADF)',
              paddingBottom: '4px',
            }}
          >
            {String(current[xDataKey])}
          </div>
          {series.map((s) => {
            const val = Number(current[s.dataKey]) || 0;
            const displayVal = formatter ? formatter(val, s.dataKey) : val;
            return (
              <div
                key={s.dataKey}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                  marginTop: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: s.stroke || 'var(--primary, #F5AE4D)',
                      boxShadow: '0 0 0 2px var(--surface, #FFFDF8)',
                    }}
                  />
                  <span
                    style={{
                      color: 'var(--foreground-secondary, #77756D)',
                      textTransform: 'capitalize',
                      fontWeight: '500',
                    }}
                  >
                    {s.dataKey}
                  </span>
                </div>
                <span style={{ fontWeight: '750', color: 'var(--foreground, #20201D)' }}>
                  {displayVal}
                </span>
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
