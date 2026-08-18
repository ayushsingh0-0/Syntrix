import React, { createContext, useContext, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ============================================================================
// Types & Context
// ============================================================================

export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface BarSeriesConfig {
  dataKey: string;
  fill?: string;
  stroke?: string;
  lineCap?: 'round' | 'butt' | number;
  animationType?: 'grow' | 'fade';
  fadedOpacity?: number;
  perspective?: boolean;
}

interface BarChartContextValue {
  data: any[];
  xDataKey: string;
  margin: Margin;
  chartWidth: number;
  chartHeight: number;
  barGap: number;
  barWidth?: number;
  orientation: 'vertical' | 'horizontal';
  stacked: boolean;
  activeHoverIndex: number | null;
  setActiveHoverIndex: (idx: number | null) => void;
  hoverPos: { x: number; y: number } | null;
  setHoverPos: (pos: { x: number; y: number } | null) => void;
  series: BarSeriesConfig[];
  registerSeries: (cfg: BarSeriesConfig) => void;
  status?: 'loading' | 'ready';
  maxValue: number;
}

const BarChartContext = createContext<BarChartContextValue | null>(null);

export const useBarChart = () => {
  const ctx = useContext(BarChartContext);
  if (!ctx) throw new Error('useBarChart must be used within <BarChart>');
  return ctx;
};

// ============================================================================
// 1. Root Component: <BarChart>
// ============================================================================

export interface BarChartProps<T = any> {
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

export function BarChart<T extends Record<string, any>>({
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
  const [series, setSeries] = useState<BarSeriesConfig[]>([]);

  const margin: Margin = {
    top: customMargin?.top ?? 24,
    right: customMargin?.right ?? 20,
    bottom: customMargin?.bottom ?? 36,
    left: customMargin?.left ?? 36,
  };

  const registerSeries = (cfg: BarSeriesConfig) => {
    setSeries((prev) => {
      if (prev.some((s) => s.dataKey === cfg.dataKey)) return prev;
      return [...prev, cfg];
    });
  };

  const dataKeys = series.map((s) => s.dataKey);
  let maxValue = 5;

  if (stacked) {
    data.forEach((d) => {
      const sum = dataKeys.reduce((acc, k) => acc + (Number(d[k]) || 0), 0);
      if (sum > maxValue) maxValue = sum;
    });
  } else {
    data.forEach((d) => {
      dataKeys.forEach((k) => {
        const val = Number(d[k]) || 0;
        if (val > maxValue) maxValue = val;
      });
    });
  }

  maxValue = Math.ceil(maxValue * 1.15);

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
        data,
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
        registerSeries,
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
          {children}
        </svg>
      </div>
    </BarChartContext.Provider>
  );
}

// ============================================================================
// 2. Grid Component: <Grid>
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
  const { data, margin, chartWidth, chartHeight } = useBarChart();

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
          strokeOpacity={0.45}
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
  fadedOpacity = 0.35,
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
    registerSeries,
    maxValue,
    stacked,
  } = useBarChart();

  React.useEffect(() => {
    registerSeries({ dataKey, fill, lineCap, animationType, fadedOpacity });
  }, [dataKey, fill, lineCap, animationType, fadedOpacity]);

  const seriesIndex = series.findIndex((s) => s.dataKey === dataKey);
  const totalSeries = Math.max(series.length, 1);
  const groupWidth = chartWidth / data.length;

  const radiusVal = typeof lineCap === 'number' ? lineCap : lineCap === 'round' ? 4 : 0;

  return (
    <g className={`bklit-bar-series-${dataKey}`}>
      {data.map((item, idx) => {
        const val = Number(item[dataKey]) || 0;
        const barHeight = Math.max((val / maxValue) * chartHeight, val > 0 ? minBarHeight : 0);

        let x = margin.left + idx * groupWidth;
        let w = groupWidth * 0.7;

        if (!stacked && totalSeries > 1) {
          const subWidth = w / totalSeries;
          x += (groupWidth - w) / 2 + seriesIndex * subWidth;
          w = subWidth * 0.85;
        } else {
          x += (groupWidth - w) / 2;
        }

        const y = margin.top + chartHeight - barHeight;
        const isHovered = activeHoverIndex === idx;
        const isAnyHovered = activeHoverIndex !== null;
        const opacity = isAnyHovered ? (isHovered ? 1 : fadedOpacity) : 1;

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

            <motion.rect
              x={x}
              y={y}
              width={w}
              height={barHeight}
              rx={radiusVal}
              ry={radiusVal}
              fill={fill}
              initial={animate ? (animationType === 'grow' ? { height: 0, y: margin.top + chartHeight } : { opacity: 0 }) : undefined}
              animate={{
                height: barHeight,
                y,
                opacity,
              }}
              transition={{
                duration: 0.65,
                delay: staggerDelay ?? idx * 0.04 + seriesIndex * 0.08,
                ease: [0.16, 1, 0.3, 1],
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

  const groupWidth = chartWidth / data.length;
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
        const opacity = isAnyHovered ? (isHovered ? 1 : 0.35) : 1;

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
                    duration: 0.4,
                    delay: idx * 0.03 + sqIdx * 0.02,
                    ease: [0.16, 1, 0.3, 1],
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
  showAllLabels?: boolean;
  maxLabels?: number;
  fontSize?: number;
}

export const BarXAxis: React.FC<BarXAxisProps> = ({ maxLabels = 14, fontSize = 10 }) => {
  const { data, xDataKey, margin, chartWidth, chartHeight } = useBarChart();
  const groupWidth = chartWidth / data.length;
  const step = Math.ceil(data.length / maxLabels);

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
            fontWeight="500"
          >
            {label}
          </text>
        );
      })}
    </g>
  );
};

// ============================================================================
// 6. Tooltip Component: <ChartTooltip>
// ============================================================================

export interface ChartTooltipProps {
  formatter?: (val: number, dataKey: string) => string;
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({ formatter }) => {
  const { data, xDataKey, activeHoverIndex, series, margin, chartWidth } = useBarChart();

  if (activeHoverIndex === null || !data[activeHoverIndex]) return null;

  const current = data[activeHoverIndex];
  const groupWidth = chartWidth / data.length;
  const leftPercent = ((margin.left + activeHoverIndex * groupWidth + groupWidth / 2) / (margin.left + chartWidth + margin.right)) * 100;

  return (
    <div
      style={{
        position: 'absolute',
        top: '12px',
        left: `${leftPercent}%`,
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          style={{
            background: '#FFFDF8',
            border: '1px solid #DDD9CC',
            borderRadius: '10px',
            padding: '8px 12px',
            boxShadow: '0 8px 24px rgba(35, 31, 20, 0.12)',
            minWidth: '110px',
            fontSize: '12px',
            color: '#20201D',
          }}
        >
          <div style={{ fontWeight: '700', marginBottom: '4px', borderBottom: '1px solid #EEEADF', paddingBottom: '4px' }}>
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
                  gap: '12px',
                  marginTop: '3px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.fill }} />
                  <span style={{ color: '#77756D', textTransform: 'capitalize' }}>{s.dataKey}</span>
                </div>
                <span style={{ fontWeight: '700' }}>{displayVal}</span>
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
        background: '#FAF8F3',
        borderRadius: '16px',
        border: '1px solid #DDD9CC',
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
            background: '#EEEADF',
            borderRadius: '6px 6px 0 0',
            opacity: 0.6,
          }}
        />
      ))}
    </div>
  );
};
