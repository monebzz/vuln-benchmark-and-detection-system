"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CveYearlyCount } from "@/types/cveYearlyDetails";
import { getCveYearlyCounts } from "@/lib/cveYearlyCount";
import Load from "../loader";
import NoData from "../no-data";
import ServerError from "../server-error";

interface YearlyComparisonChartProps {
  height?: number;
  maxYears?: number;
}

interface ChartData {
  year: string;
  cve_count: number;
}

export function YearlyComparisonChart({
  height = 300,
  maxYears,
}: YearlyComparisonChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<boolean | null>(false);
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const prepareData = (data: CveYearlyCount[]): ChartData[] => {
      let sorted = data
        .map((item) => ({
          year: item.year.toString(),
          cve_count: item.total_cves,
        }))
        .sort((a, b) => parseInt(a.year) - parseInt(b.year));

      if (maxYears) {
        sorted = sorted.slice(-maxYears);
      }

      return sorted;
    };

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(false);

        const res = await fetch("/api/dashboard/cve-yearly-count", {
          cache: "force-cache",
        });
        if (res.status === 500) {
          setError(true);
          setChartData([]);
          return;
        }
        const yearlyCounts = await res.json();
        const prepared = prepareData(yearlyCounts);
        setChartData(prepared);
      } catch (err: any) {
        console.error("Error loading yearly CVE counts:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [maxYears]);

  const handleBarClick = (data: any) => {
    if (!data?.year) return;
    const year = data.year;
    const fromStr = `${year}-01-01`;
    const toStr = `${year}-12-31`;
    router.push(`/by-date?tab=list&from=${fromStr}&to=${toStr}`);
  };

  if (loading) {
    return <Load />;
  }

  if (error) {
    return <ServerError />;
  }

  if (!chartData || chartData.length === 0) {
    return <NoData />;
  }
  if (error) return <p className="text-red-500">Error: {error}</p>;

  // Theme-based colors
  const axisColor = isDark ? "#ffffff" : "#6b7280";
  const tooltipBg = isDark ? "#FFFFFF" : "#8b5cf6";
  const tooltipText = isDark ? "#000000" : "#FFFFFF";
  const tooltipBorder = isDark ? "rgba(255,255,255,0.1)" : "#7c3aed";
  const gridColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(31,41,55,0.1)";
  const barColor = isDark ? "#0cbc86" : "#6366F1"; // teal for dark, indigo for light

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
      >
        <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
        <XAxis dataKey="year" stroke={axisColor} />
        <YAxis stroke={axisColor} />
        <Tooltip
          contentStyle={{
            backgroundColor: tooltipBg,
            border: `1px solid ${tooltipBorder}`,
            color: tooltipText,
          }}
          itemStyle={{ color: tooltipText }}
          labelStyle={{ color: tooltipText }}
        />
        <Legend
          wrapperStyle={{
            color: isDark ? "#FFFFFF" : "#111827",
          }}
        />
        <Bar
          dataKey="cve_count"
          fill={barColor}
          name="Total CVEs"
          cursor="pointer"
          onClick={handleBarClick}
          radius={[6, 6, 0, 0]} // top left, top right, bottom right, bottom left
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
