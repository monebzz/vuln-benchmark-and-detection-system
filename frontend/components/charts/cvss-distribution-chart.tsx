"use client";

import { getAllCveScoreRanges } from "@/lib/cveScoreCount";
import { CveScoreRange } from "@/types/cveScoreRanges";
import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useTheme } from "next-themes";
import Load from "../loader";
import NoData from "../no-data";
import ServerError from "../server-error";

interface CvssDistributionChartProps {
  isInteractive?: boolean;
  onBarClick?: (min: number, max: number) => void;
}

export function CvssDistributionChart({
  isInteractive = true,
  onBarClick,
}: CvssDistributionChartProps) {
  const [data, setData] = useState<
    { range: string; count: number; min: number; max: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const axisColor = isDark ? "#ffffff" : "#6b7280";
  const tooltipBg = isDark ? "#FFFFFF" : "#8b5cf6";
  const tooltipText = isDark ? "#000000" : "#FFFFFF";
  const tooltipBorder = isDark ? "rgba(255,255,255,0.1)" : "#7c3aed";

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setServerError(false);
        const res = await fetch("/api/dashboard/cve-score-ranges", {
          cache: "force-cache",
        });
        if (res.status === 500) {
          setServerError(true);
          setLoading(false);
          return;
        }
        const ranges: CveScoreRange[] = await res.json();
        const chartData: {
          range: string;
          count: number;
          min: number;
          max: number;
        }[] = [];

        if (ranges.length > 0) {
          const scoreCounts = ranges[0].score_counts;
          Object.entries(scoreCounts)
            .filter(([range]) =>
              [
                "1-2",
                "2-3",
                "3-4",
                "4-5",
                "5-6",
                "6-7",
                "7-8",
                "8-9",
                "9-10",
              ].includes(range)
            )
            .forEach(([range, count]) => {
              const [min, max] = range.split("-").map((v) => parseFloat(v));
              chartData.push({
                range,
                count: Number(count) || 0,
                min,
                max,
              });
            });
        }

        chartData.sort((a, b) => a.min - b.min);
        setData(chartData);
      } catch (error) {
        setServerError(true);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleBarClick = (item: any) => {
    if (
      isInteractive &&
      onBarClick &&
      item?.min !== undefined &&
      item?.max !== undefined
    ) {
      onBarClick(item.min, item.max);
    }
  };

  const handleXAxisClick = (tickData: any) => {
    if (!isInteractive || !onBarClick) return;
    const item = data.find((d) => d.range === tickData.value);
    if (item) {
      onBarClick(item.min, item.max);
    }
  };

  const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="middle"
          fill={axisColor}
          fontSize={12}
          style={{ cursor: isInteractive ? "pointer" : "default" }}
          onClick={() => handleXAxisClick(payload)}
        >
          {payload.value}
        </text>
      </g>
    );
  };

  const COLORS = [
    "#52DF00FF",
    "#61F300FF",
    "#9FFF04FF",
    "#C8FF00FF",
    "#FFFB00FF",
    "#FFCA37FF",
    "#FFBB29FF",
    "#FF291DFF",
    "#CC0030FF",
  ];

  if (loading) {
    return <Load />;
  }

  if (serverError) {
    return <ServerError />;
  }

  if (!data || data.length === 0) {
    return <NoData />;
  }

  return (
    <div className="h-[400px] w-full sm:px-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 10,
            left: 10,
            bottom: 5,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"}
          />
          <XAxis
            dataKey="range"
            stroke={axisColor}
            tick={<CustomXAxisTick />}
          />
          <YAxis
            stroke={axisColor}
            tick={{
              fill: axisColor,
              fontSize: 12,
            }}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: "8px",
              color: tooltipText,
            }}
            labelStyle={{ color: tooltipText }}
            itemStyle={{ color: tooltipText }}
            formatter={(value) => [`${value} CVEs`]}
            cursor={{
              fill: isDark ? "rgba(255,255,255,0.1)" : "rgba(139,92,246,0.1)",
            }}
          />
          <Bar
            dataKey="count"
            radius={[6, 6, 0, 0]}
            barSize={20}
            onClick={(e) => handleBarClick(e)}
            className={isInteractive ? "cursor-pointer" : ""}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
