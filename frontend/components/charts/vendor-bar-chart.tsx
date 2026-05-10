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
import { CveVendorCount } from "@/types/cveVendorCount";
import { getTopCveVendors } from "@/lib/cveCountByVendor";
import { useTheme } from "next-themes";
import Load from "../loader";
import NoData from "../no-data";
import ServerError from "../server-error";

interface VendorBarChartProps {
  isInteractive?: boolean;
  height?: number;
  chartData?: CveVendorCount[];
  onBarClick?: (vendorId: string) => void;
}

export function VendorBarChart({
  isInteractive = false,
  height = 400,
  chartData: initialChartData,
  onBarClick,
}: VendorBarChartProps) {
  const [chartData, setChartData] = useState<CveVendorCount[]>(
    initialChartData || []
  );
  const [loading, setLoading] = useState(!initialChartData);
  const [serverError, setServerError] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const axisColor = isDark ? "#ffffff" : "#6b7280";
  const tooltipBg = isDark ? "#FFFFFF" : "#8b5cf6";
  const tooltipText = isDark ? "#000000" : "#FFFFFF";
  const tooltipBorder = isDark ? "rgba(255,255,255,0.1)" : "#7c3aed";

  const router = useRouter();

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
        const res = await fetch("/api/dashboard/cve-vendor-count?limit=10", {
          cache: "force-cache",
        });
        if (res.status === 500) {
          setServerError(true);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setChartData(data);
      } catch (err) {
        setServerError(true);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [initialChartData]);

  const internalHandleBarClick = (data: CveVendorCount) => {
    if (isInteractive && data?.name) {
      if (onBarClick) {
        onBarClick(data.name);
      } else {
        router.push(
          `/by-vendor?vendor=${encodeURIComponent(data.name)}&tab=list`
        );
      }
    }
  };

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
    <div className="flex w-full justify-center items-center px-0 max-sm:px-0">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{
            top: 10,
            right: 10,
            left: 10,
            bottom: 0,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal
            vertical={false}
            stroke={isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb"}
          />
          <XAxis
            type="number"
            stroke={axisColor}
            tick={{
              fill: axisColor,
              fontSize: 12,
            }}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{
              fill: axisColor,
              fontSize: 12,
            }}
            width={90}
            stroke={axisColor}
          />
          <Tooltip
            formatter={(value, _, props) => [`${value} CVEs`]}
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
            cursor={false}
          />
          <Bar
            dataKey="count"
            name="CVEs"
            barSize={20}
            radius={[0, 6, 6, 0]}
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
  );
}
