import { createContext, useContext } from 'react';
import type { Margin } from './chart-context';

export interface LineSeriesConfig {
  dataKey: string;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  showDots?: boolean;
  curve?: 'linear' | 'monotone' | 'step';
}

export interface LineChartContextValue {
  data: Array<Record<string, unknown>>;
  xDataKey: string;
  margin: Margin;
  chartWidth: number;
  chartHeight: number;
  activeHoverIndex: number | null;
  setActiveHoverIndex: (idx: number | null) => void;
  hoverPos: { x: number; y: number } | null;
  setHoverPos: (pos: { x: number; y: number } | null) => void;
  series: LineSeriesConfig[];
  maxValue: number;
  getPointCoords: (index: number, val: number) => { x: number; y: number };
}

export const LineChartContext = createContext<LineChartContextValue | null>(null);

export const useLineChart = (): LineChartContextValue => {
  const ctx = useContext(LineChartContext);
  if (!ctx) {
    throw new Error('useLineChart must be used within a <LineChart>');
  }
  return ctx;
};
