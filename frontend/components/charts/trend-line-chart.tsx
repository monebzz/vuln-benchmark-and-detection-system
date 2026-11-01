"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { getCveYearlyCounts } from "@/lib/cveYearlyCount";
import { CveYearlyCount } from "@/types/cveYearlyDetails";
import Load from "../loader";
import NoData from "../no-data";
import ServerError from "../server-error";

interface TrendLineChartProps {
  height?: number;
}

interface TrendData {
  year: string;
  cve_count: number;
}

export function TrendLineChart({ height = 300 }: TrendLineChartProps) {
  const [chartData, setChartData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState(false);
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Theme-based colors
  const axisColor = isDark ? "#ffffff" : "#6b7280";
  const tooltipBg = isDark ? "#FFFFFF" : "#8b5cf6";
  const tooltipText = isDark ? "#000000" : "#FFFFFF";
  const tooltipBorder = isDark ? "rgba(255,255,255,0.1)" : "#7c3aed";

  // Handle click on data points
  const handlePointClick = (data: any) => {
    if (data && data.year) {
      const year = parseInt(data.year, 10);

      const from = `${year}-01-01`;

      // if clicked year is current year, limit `to` to today
      const now = new Date();
      let to: string;
      if (year === now.getFullYear()) {
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        to = `${year}-${month}-${day}`;
      } else {
        to = `${year}-12-31`;
      }

      router.push(
        `/by-date?tab=list&from=${encodeURIComponent(
          from
        )}&to=${encodeURIComponent(to)}`
      );
    }
  };

  // Handle chart click
  const handleChartClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const yearData = data.activePayload[0].payload;
      handlePointClick(yearData);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setServerError(false);

        const res = await fetch("/api/dashboard/cve-yearly-count", {
          cache: "no-store",
        });
        if (res.status === 500) {
          setServerError(true);
          setLoading(false);
          return;
        }
        const yearlyCounts: CveYearlyCount[] = await res.json();

        // Format for chart
        const formatted: TrendData[] = yearlyCounts.map((item) => ({
          year: String(item.year),
          cve_count: item.total_cves,
        }));

        setChartData(formatted);
      } catch (error) {
        setServerError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
          onClick={handleChartClick}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="year"
            style={{ cursor: "pointer" }}
            stroke={axisColor}
            tick={{ fill: axisColor }}
          />
          <YAxis stroke={axisColor} tick={{ fill: axisColor }} />
          <Tooltip
            formatter={(value) => [`${value} CVEs`, "Count"]}
            labelFormatter={(year) => `Year: ${year}`}
            cursor={{ stroke: "#3b82f6", strokeWidth: 2 }}
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              color: tooltipText,
              borderRadius: "8px",
            }}
            labelStyle={{ color: tooltipText }}
            itemStyle={{ color: tooltipText }}
          />
          <Line
            type="monotone"
            dataKey="cve_count"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{
              r: 6,
              style: { cursor: "pointer" },
              onClick: handlePointClick,
            }}
            activeDot={{
              r: 8,
              style: { cursor: "pointer" },
              onClick: handlePointClick,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}
