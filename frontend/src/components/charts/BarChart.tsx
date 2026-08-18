import React, { useState, useRef, useMemo, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChartContext, useBarChart, type Margin, type BarSeriesConfig } from './chart-context';
import { LineChartContext } from './line-context';

// ============================================================================
// 1. Root Component: <BarChart>
// ============================================================================

export interface BarChartProps<T extends object = Record<string, unknown>> {
  data: T[];
  xDataKey?: string;
  margin?: Partial<Margin>;
  animationDuration?: number;
  aspectRatio?: string;
  barGap?: number;
  barWidth?: number;
  orientation?: 'vertical' | 'horizontal';
  stacked?: boolean;
  status?: 'loading' | 'ready';
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export function BarChart<T extends object>({
  data,
  xDataKey = 'name',
  margin: customMargin,
  aspectRatio = '2 / 1',
  barGap = 0.25,
  barWidth,
  orientation = 'vertical',
  stacked = false,
  status = 'ready',
  className,
  style,
  children,
}: BarChartProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeHoverIndex, setActiveHoverIndex] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  const margin: Margin = {
    top: customMargin?.top ?? 24,
    right: customMargin?.right ?? 20,
    bottom: customMargin?.bottom ?? 36,
    left: customMargin?.left ?? 36,
  };

  // Inspect children synchronously to extract all series configurations immediately
  const series = useMemo<BarSeriesConfig[]>(() => {
    const collected: BarSeriesConfig[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        const props = child.props as Record<string, unknown>;
        if (typeof props.dataKey === 'string') {
          collected.push({
            dataKey: props.dataKey,
            fill: typeof props.fill === 'string' ? props.fill : undefined,
            stroke: typeof props.stroke === 'string' ? props.stroke : undefined,
            lineCap: (props.lineCap as 'round' | 'butt' | number | undefined) ?? 'round',
            animationType: (props.animationType as 'grow' | 'fade' | undefined) ?? 'grow',
            fadedOpacity: typeof props.fadedOpacity === 'number' ? props.fadedOpacity : 0.3,
            perspective: Boolean(props.perspective),
          });
        }
      }
    });
    return collected;
  }, [children]);

  // Compute maximum value across all registered series
  const dataKeys = series.map((s) => s.dataKey);
  let computedMax = 5;

  const rawData = data as unknown as Record<string, unknown>[];

  if (stacked) {
    rawData.forEach((d) => {
      const sum = dataKeys.reduce((acc, k) => acc + (Number(d[k]) || 0), 0);
      if (sum > computedMax) computedMax = sum;
    });
  } else {
    rawData.forEach((d) => {
      dataKeys.forEach((k) => {
        const val = Number(d[k]) || 0;
        if (val > computedMax) computedMax = val;
      });
    });
  }

  const maxValue = Math.max(Math.ceil(computedMax * 1.15), 1);

  const viewBoxWidth = 600;
  const viewBoxHeight = 280;
  const innerWidth = viewBoxWidth - margin.left - margin.right;
  const innerHeight = viewBoxHeight - margin.top - margin.bottom;

  if (status === 'loading') {
    return <BarChartLoading aspectRatio={aspectRatio} className={className} style={style} />;
  }

  return (
    <BarChartContext.Provider
      value={{
        data: rawData,
        xDataKey,
        margin,
        chartWidth: innerWidth,
        chartHeight: innerHeight,
        barGap,
        barWidth,
        orientation,
        stacked,
        activeHoverIndex,
        setActiveHoverIndex,
        hoverPos,
        setHoverPos,
        series,
        status,
        maxValue,
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
        >
          {/* Subtle hover background highlight for active column */}
          {activeHoverIndex !== null && rawData.length > 0 && (
            <rect
              x={margin.left + activeHoverIndex * (innerWidth / rawData.length)}
              y={margin.top}
              width={innerWidth / rawData.length}
              height={innerHeight}
              fill="var(--surface-secondary, rgba(238, 234, 223, 0.45))"
              rx={6}
              ry={6}
              style={{ transition: 'all 0.15s ease' }}
            />
          )}

          {children}
        </svg>
      </div>
    </BarChartContext.Provider>
  );
}

// ============================================================================
// 2. Universal Grid Component: <Grid> (Works in BarChart AND LineChart)
// ============================================================================

export interface GridProps {
  horizontal?: boolean;
  vertical?: boolean;
  fadeHorizontal?: boolean;
  fadeVertical?: boolean;
  numTicks?: number;
  stroke?: string;
}

export const Grid: React.FC<GridProps> = ({
  horizontal = true,
  vertical = false,
  numTicks = 4,
  stroke = 'var(--border, #DDD9CC)',
}) => {
  const barCtx = useContext(BarChartContext);
  const lineCtx = useContext(LineChartContext);
  const ctx = barCtx || lineCtx;

  if (!ctx) return null;

  const { data, margin, chartWidth, chartHeight } = ctx;

  const lines = [];
  if (horizontal) {
    for (let i = 0; i <= numTicks; i++) {
      const y = margin.top + (chartHeight / numTicks) * i;
      lines.push(
        <line
          key={`h-${i}`}
          x1={margin.left}
          y1={y}
          x2={margin.left + chartWidth}
          y2={y}
          stroke={stroke}
          strokeDasharray="4 4"
          strokeOpacity={0.5}
        />
      );
    }
  }

  if (vertical && data.length > 0) {
    const step = chartWidth / data.length;
    for (let i = 0; i <= data.length; i++) {
      const x = margin.left + i * step;
      lines.push(
        <line
          key={`v-${i}`}
          x1={x}
          y1={margin.top}
          x2={x}
          y2={margin.top + chartHeight}
          stroke={stroke}
          strokeDasharray="4 4"
          strokeOpacity={0.25}
        />
      );
    }
  }

  return <g className="bklit-grid">{lines}</g>;
};

// ============================================================================
// 3. Bar Component: <Bar>
// ============================================================================

export interface BarProps {
  dataKey: string;
  fill?: string;
  stroke?: string;
  lineCap?: 'round' | 'butt' | number;
  animate?: boolean;
  animationType?: 'grow' | 'fade';
  fadedOpacity?: number;
  perspective?: boolean;
  minBarHeight?: number;
  staggerDelay?: number;
}

export const Bar: React.FC<BarProps> = ({
  dataKey,
  fill = 'var(--primary, #F5AE4D)',
  lineCap = 'round',
  animate = true,
  animationType = 'grow',
  fadedOpacity = 0.3,
  minBarHeight = 3,
  staggerDelay,
}) => {
  const {
    data,
    margin,
    chartWidth,
    chartHeight,
    activeHoverIndex,
    setActiveHoverIndex,
    setHoverPos,
    series,
    maxValue,
    stacked,
  } = useBarChart();

  const seriesIndex = Math.max(series.findIndex((s) => s.dataKey === dataKey), 0);
  const totalSeries = Math.max(series.length, 1);
  const groupWidth = data.length > 0 ? chartWidth / data.length : chartWidth;

  const radiusVal = typeof lineCap === 'number' ? lineCap : lineCap === 'round' ? 5 : 0;

  return (
    <g className={`bklit-bar-series-${dataKey}`}>
      {data.map((item, idx) => {
        const val = Number(item[dataKey]) || 0;
        const barHeight = Math.max((val / maxValue) * chartHeight, val > 0 ? minBarHeight : 0);

        let x = margin.left + idx * groupWidth;
        let w = groupWidth * 0.72;

        if (!stacked && totalSeries > 1) {
          const subWidth = w / totalSeries;
          x += (groupWidth - w) / 2 + seriesIndex * subWidth;
          w = subWidth * 0.88;
        } else {
          x += (groupWidth - w) / 2;
        }

        const y = margin.top + chartHeight - barHeight;
        const isHovered = activeHoverIndex === idx;
        const isAnyHovered = activeHoverIndex !== null;
        const opacity = isAnyHovered ? (isHovered ? 1 : fadedOpacity) : 1;

        return (
          <g
            key={`${dataKey}-${idx}`}
            onMouseEnter={(e) => {
              setActiveHoverIndex(idx);
              const rect = e.currentTarget.getBoundingClientRect();
              setHoverPos({ x: rect.x + rect.width / 2, y: rect.y });
            }}
            style={{ cursor: 'pointer' }}
          >
            {/* Transparent hit target */}
            <rect
              x={margin.left + idx * groupWidth}
              y={margin.top}
              width={groupWidth}
              height={chartHeight}
              fill="transparent"
            />

            {/* Spring animated Bar */}
            <motion.rect
              x={x}
              width={Math.max(w, 4)}
              rx={radiusVal}
              ry={radiusVal}
              fill={fill}
              initial={
                animate
                  ? animationType === 'grow'
                    ? { y: margin.top + chartHeight, height: 0, opacity: 0 }
                    : { y, height: barHeight, opacity: 0 }
                  : { y, height: barHeight, opacity }
              }
              animate={{
                y,
                height: barHeight,
                opacity,
              }}
              transition={{
                type: 'spring',
                stiffness: 140,
                damping: 18,
                delay: staggerDelay ?? idx * 0.03 + seriesIndex * 0.06,
              }}
            />
          </g>
        );
      })}
    </g>
  );
};

// ============================================================================
// 4. Bar Squares Component: <BarSquares>
// ============================================================================

export interface BarSquaresProps {
  dataKey: string;
  fill?: string;
  squareGap?: number;
  squareRadius?: number;
}

export const BarSquares: React.FC<BarSquaresProps> = ({
  dataKey,
  fill = 'var(--primary, #F5AE4D)',
  squareGap = 3,
  squareRadius = 2,
}) => {
  const { data, margin, chartWidth, chartHeight, maxValue, activeHoverIndex, setActiveHoverIndex, setHoverPos } =
    useBarChart();

  const groupWidth = data.length > 0 ? chartWidth / data.length : chartWidth;
  const squareSize = 10;

  return (
    <g className="bklit-bar-squares">
      {data.map((item, idx) => {
        const val = Number(item[dataKey]) || 0;
        const totalHeight = (val / maxValue) * chartHeight;
        const squareCount = Math.floor(totalHeight / (squareSize + squareGap));
        const colX = margin.left + idx * groupWidth + (groupWidth - squareSize) / 2;

        const isHovered = activeHoverIndex === idx;
        const isAnyHovered = activeHoverIndex !== null;
        const opacity = isAnyHovered ? (isHovered ? 1 : 0.3) : 1;

        return (
          <g
            key={idx}
            onMouseEnter={(e) => {
              setActiveHoverIndex(idx);
              const rect = e.currentTarget.getBoundingClientRect();
              setHoverPos({ x: rect.x + rect.width / 2, y: rect.y });
            }}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x={margin.left + idx * groupWidth}
              y={margin.top}
              width={groupWidth}
              height={chartHeight}
              fill="transparent"
            />

            {Array.from({ length: squareCount }).map((_, sqIdx) => {
              const sqY = margin.top + chartHeight - (sqIdx + 1) * (squareSize + squareGap);
              return (
                <motion.rect
                  key={sqIdx}
                  x={colX}
                  y={sqY}
                  width={squareSize}
                  height={squareSize}
                  rx={squareRadius}
                  ry={squareRadius}
                  fill={fill}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity, scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 180,
                    damping: 18,
                    delay: idx * 0.025 + sqIdx * 0.02,
                  }}
                />
              );
            })}
          </g>
        );
      })}
    </g>
  );
};

// ============================================================================
// 5. Axes Components: <BarXAxis>
// ============================================================================

export interface BarXAxisProps {
  step?: number;
  showAllLabels?: boolean;
  maxLabels?: number;
  fontSize?: number;
}

export const BarXAxis: React.FC<BarXAxisProps> = ({ step: customStep, maxLabels = 14, fontSize = 10 }) => {
  const { data, xDataKey, margin, chartWidth, chartHeight } = useBarChart();
  const groupWidth = data.length > 0 ? chartWidth / data.length : chartWidth;
  const step = customStep ?? Math.max(Math.ceil(data.length / maxLabels), 1);

  return (
    <g className="bklit-x-axis">
      {data.map((item, idx) => {
        if (idx % step !== 0 && idx !== data.length - 1) return null;
        const x = margin.left + idx * groupWidth + groupWidth / 2;
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
// 6. Universal Tooltip Component: <ChartTooltip> (Works in BarChart AND LineChart)
// ============================================================================

export interface ChartTooltipProps {
  formatter?: (val: number, dataKey: string) => string;
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({ formatter }) => {
  const barCtx = useContext(BarChartContext);
  const lineCtx = useContext(LineChartContext);
  const ctx = barCtx || lineCtx;

  if (!ctx) return null;

  const { data, xDataKey, activeHoverIndex, series, margin, chartWidth } = ctx;

  if (activeHoverIndex === null || !data[activeHoverIndex]) return null;

  const current = data[activeHoverIndex];
  const groupWidth = data.length > 0 ? chartWidth / data.length : chartWidth;
  const leftPercent =
    ((margin.left + activeHoverIndex * groupWidth + groupWidth / 2) / (margin.left + chartWidth + margin.right)) * 100;

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
            const color =
              s.fill ||
              ('stroke' in s ? (s as { stroke?: string }).stroke : undefined) ||
              'var(--primary, #F5AE4D)';
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
                      background: color,
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
                <span style={{ fontWeight: '750', color: 'var(--foreground, #20201D)' }}>{displayVal}</span>
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// 7. Loading Shimmer Skeleton: <BarChartLoading>
// ============================================================================

export const BarChartLoading: React.FC<{ aspectRatio?: string; className?: string; style?: React.CSSProperties }> = ({
  aspectRatio = '2 / 1',
  className,
  style,
}) => {
  const dummyBars = [40, 65, 30, 85, 50, 95, 60, 45, 75, 55, 90, 70];

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio,
        background: 'var(--surface-secondary, #FAF8F3)',
        borderRadius: '16px',
        border: '1px solid var(--border, #DDD9CC)',
        padding: '24px',
        display: 'flex',
        alignItems: 'flex-end',
        gap: '10px',
        overflow: 'hidden',
        ...style,
      }}
    >
      {dummyBars.map((heightPercent, idx) => (
        <div
          key={idx}
          style={{
            flex: 1,
            height: `${heightPercent}%`,
            background: 'var(--surface-tertiary, #EEEADF)',
            borderRadius: '6px 6px 0 0',
            opacity: 0.7,
            transition: 'height 0.4s ease',
          }}
        />
      ))}
    </div>
  );
};
