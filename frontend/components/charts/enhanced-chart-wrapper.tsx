"use client";

import type { ReactNode } from "react";
import {
  useChartNavigation,
  type ChartDataPoint,
} from "@/lib/chart-navigation";

interface EnhancedChartWrapperProps {
  children: ReactNode;
  dataPoint: ChartDataPoint | null;
  interactive?: boolean;
  className?: string;
}

export function EnhancedChartWrapper({
  children,
  dataPoint,
  interactive = false,
  className,
}: EnhancedChartWrapperProps) {
  const { navigateToDetail } = useChartNavigation();

  const handleClick = () => {
    if (interactive && dataPoint) {
      navigateToDetail(dataPoint);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`${className} ${
        interactive ? "cursor-pointer hover:opacity-90 transition-opacity" : ""
      }`}
    >
      {children}
    </div>
  );
}
