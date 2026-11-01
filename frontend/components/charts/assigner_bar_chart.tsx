"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { CveAssignerCount } from "@/types/cveAssignerCount";
import { getTopCveAssigners } from "@/lib/cveCountByAssigner";

import Load from "../loader";
import NoData from "../no-data";
import ServerError from "../server-error";

interface AssignerBarChartProps {
  isInteractive?: boolean;
  height?: number;
  chartData?: CveAssignerCount[];
  onBarClick?: (assignerName: string) => void;
}

export function AssignerBarChart({
  isInteractive = true,
  height = 400,
  chartData: initialChartData,
  onBarClick,
}: AssignerBarChartProps) {
  const [chartData, setChartData] = useState<CveAssignerCount[]>(
    initialChartData || []
  );
  const [loading, setLoading] = useState(!initialChartData);
  const [serverError, setServerError] = useState(false);
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const axisColor = isDark ? "#ffffff" : "#6b7280";
  const tooltipBg = isDark ? "#FFFFFF" : "#8b5cf6";
  const tooltipText = isDark ? "#000000" : "#FFFFFF";
  const tooltipBorder = isDark ? "rgba(255,255,255,0.1)" : "#7c3aed";

  useEffect(() => {
    if (initialChartData) {
      setChartData(initialChartData);
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setServerError(false);
      try {
        const res = await fetch("/api/dashboard/cve-assigner-count?limit=12", {
          cache: "no-store",
        });
        if (res.status === 500) {
          setServerError(true);
          setLoading(false);
          return;
        }
        let data = await res.json();
        data = data.splice(1, 12);
        setChartData(data);
      } catch (e) {
        setServerError(true);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [initialChartData]);

  const internalHandleBarClick = (data: CveAssignerCount) => {
    if (isInteractive && data?.name) {
      if (onBarClick) {
        onBarClick(data.name);
      } else {
        router.push(
          `/by-assigner?assigner=${encodeURIComponent(data.name)}&tab=list`
        );
      }
    }
  };

  // Define a colorful palette for both light and dark mode
  const COLORS = [
    "#60A5FA", // blue
    "#F87171", // red
    "#34D399", // green
    "#FBBF24", // yellow
    "#A78BFA", // purple
    "#F472B6", // pink
    "#FB923C", // orange
    "#22D3EE", // cyan
    "#818CF8", // indigo
    "#4ADE80", // emerald
    "#FACC15", // amber
  ];

  if (loading) {
    return <Load />;
  }

  if (serverError) {
    return <ServerError />;
  }

  if (!chartData || chartData.length === 0) {
    return <NoData />;
  }

  return (
    <>
      <div className="flex justify-start w-full h-full items-center">
        <ResponsiveContainer width="95%" height={height}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 20, left: 20, bottom: 5 }}
            onClick={(event) => {
              if (
                event?.activePayload &&
                Array.isArray(event.activePayload) &&
                event.activePayload.length > 0
              ) {
                internalHandleBarClick(event.activePayload[0].payload);
              }
            }}
          >
            <CartesianGrid
              stroke={isDark ? "white" : "#D1D5DB"} // gray-300
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="name"
              tick={(props: any) => {
                const { x, y, payload } = props || {};
                const shouldRotate =
                  typeof window !== "undefined" && window.innerWidth < 640;
                const rotate = shouldRotate ? -90 : 0;
                const textAnchor = shouldRotate ? "end" : "middle";
                const transform =
                  rotate !== 0 ? `rotate(${rotate}, ${x}, ${y})` : undefined;
                let label = payload?.value;
                if (typeof label === "string" && label.length > 0) {
                  label =
                    label.charAt(0).toUpperCase() +
                    label.slice(1).toLowerCase();
                }
                return (
                  <text
                    x={x}
                    y={y + 10}
                    transform={transform}
                    textAnchor={textAnchor}
                    fontSize={12}
                    fill={axisColor}
                  >
                    {label}
                  </text>
                );
              }}
              stroke={axisColor}
            />
            <YAxis
              type="number"
              stroke={axisColor}
              tick={{ fill: axisColor, fontSize: 12 }}
            />
            <Tooltip
              formatter={(value, _, props) => [
                `${value} CVEs`,
                props.payload.name,
              ]}
              contentStyle={{
                borderRadius: "8px",
                border: `1px solid ${tooltipBorder}`,
                backgroundColor: tooltipBg,
                color: tooltipText,
                padding: "8px 12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
              labelStyle={{ color: tooltipText }}
              itemStyle={{ color: tooltipText }}
              cursor={{
                fill: isDark ? "rgba(255,255,255,0.1)" : "rgba(139,92,246,0.1)",
              }}
            />
            <Bar
              dataKey="count"
              name="CVEs"
              barSize={30}
              radius={[8, 8, 0, 0]} // Rounded top corners
              className={isInteractive ? "cursor-pointer" : ""}
              onClick={(_, index) => {
                const item = chartData[index];
                if (item) internalHandleBarClick(item);
              }}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  className={
                    isInteractive
                      ? "transition-colors duration-300 hover:brightness-90"
                      : ""
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
