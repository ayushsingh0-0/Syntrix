import { createContext, useContext } from 'react';

export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface BarSeriesConfig {
  dataKey: string;
  fill?: string;
  stroke?: string;
  lineCap?: 'round' | 'butt' | number;
  animationType?: 'grow' | 'fade';
  fadedOpacity?: number;
  perspective?: boolean;
}

export interface BarChartContextValue {
  data: Array<Record<string, unknown>>;
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
  status?: 'loading' | 'ready';
  maxValue: number;
}

export const BarChartContext = createContext<BarChartContextValue | null>(null);

export const useBarChart = (): BarChartContextValue => {
  const ctx = useContext(BarChartContext);
  if (!ctx) {
    throw new Error('useBarChart must be used within a <BarChart>');
  }
  return ctx;
};
