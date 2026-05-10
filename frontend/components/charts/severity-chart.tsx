"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { getCveMonthlyCountsByYear } from "@/lib/cveMonthlyCounts";
import Load from "../loader";
import NoData from "../no-data";

const chartConfig = {
  low: { label: "Low", color: "#3b82f6" },
  medium: { label: "Medium", color: "#22c55e" },
  high: { label: "High", color: "#f97316" },
  critical: { label: "Critical", color: "#ef4444" },
} satisfies ChartConfig;

interface MonthlyData {
  month: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

interface SeverityChartProps {
  height?: number;
  standalone?: boolean;
}

export function SeverityChart({
  height = 250,
  standalone = false,
}: SeverityChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const axisColor = isDark ? "#ffffff" : "#6b7280";
  const tooltipBg = isDark ? "#FFFFFF" : "#8b5cf6";
  const tooltipText = isDark ? "#000000" : "#FFFFFF";
  const tooltipBorder = isDark ? "rgba(255,255,255,0.1)" : "#7c3aed";

  const [chartData, setChartData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yearRange, setYearRange] = useState<number>(2);
  const router = useRouter();

  const getLastDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 0).getDate();
  };

  const handleMonthNavigation = (monthString: string) => {
    if (!monthString) return;
    const [yearStr, monthStr] = monthString.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    const from = `${year}-${monthStr}-01`;
    const now = new Date();
    let to: string;
    if (year === now.getFullYear() && month === now.getMonth() + 1) {
      const day = String(now.getDate()).padStart(2, "0");
      to = `${year}-${monthStr}-${day}`;
    } else {
      const lastDay = getLastDayOfMonth(year, month);
      to = `${year}-${monthStr}-${String(lastDay).padStart(2, "0")}`;
    }

    router.push(
      `/by-date?tab=list&from=${encodeURIComponent(
        from
      )}&to=${encodeURIComponent(to)}`
    );
  };

  const handleChartClick = (data: any) => {
    if (data?.activePayload?.[0]) {
      const monthData = data.activePayload[0].payload;
      handleMonthNavigation(monthData.month);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const currentYear = new Date().getFullYear();
        const startYear = currentYear - yearRange + 1; // e.g., last 2 years
        const allData: MonthlyData[] = [];

        for (let year = startYear; year <= currentYear; year++) {
          // Build URL properly
          const url = new URL(
            `/api/dashboard/cve-monthly-count`,
            window.location.origin
          );
          url.searchParams.set("year", String(year));

          const res = await fetch(url.toString(), { cache: "force-cache" });
          const monthlyCounts = await res.json();

          console.log("Monthly Counts for year", year, monthlyCounts); // <-- shows correct year

          monthlyCounts.forEach((item: any) => {
            allData.push({
              month: `${item.year}-${String(item.month).padStart(2, "0")}`,
              critical: item.critical_count,
              high: item.high_count,
              medium: item.medium_count,
              low: item.low_count,
              total: item.total_cves,
            });
          });
        }

        // Sort by month string (YYYY-MM)
        setChartData(allData.sort((a, b) => a.month.localeCompare(b.month)));
      } catch (err) {
        console.error("Error loading monthly CVE data:", err);
        setError("Failed to load monthly CVE data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [yearRange]);

  const filteredData = Array.isArray(chartData) ? chartData : [];

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const startYear = 1999;
    const totalYears = currentYear - startYear + 1;
    const options = [];

    options.push(
      <option key="all" value={totalYears}>
        All Years (1999-{currentYear})
      </option>
    );

    for (let i = 1; i <= Math.min(totalYears, 10); i++) {
      const label = i === 1 ? "Last Year" : `Last ${i} Years`;
      const yearStart = currentYear - i + 1;
      options.push(
        <option key={i} value={i}>
          {label} ({yearStart}-{currentYear})
        </option>
      );
    }

    if (totalYears > 10) {
      for (let i = 15; i <= totalYears; i += 5) {
        const yearStart = currentYear - i + 1;
        options.push(
          <option key={i} value={i}>
            Last {i} Years ({yearStart}-{currentYear})
          </option>
        );
      }
    }

    return options;
  };

  if (loading) {
    return <Load />;
  }

  if (!chartData || chartData.length === 0) {
    return <NoData />;
  }

  const renderChart = () => (
    <>
      <>
        {error && chartData.length > 0 && (
          <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="text-sm text-yellow-800">{error}</div>
          </div>
        )}

        <div className="flex justify-end items-center mb-4 px-6 pb-10">
          <div className="flex items-center gap-2">
            <label
              htmlFor="year-filter"
              className="text-sm font-medium text-white"
            >
              Time Range:
            </label>
            <select
              id="year-filter"
              value={yearRange}
              onChange={(e) => setYearRange(Number(e.target.value))}
              className={`border border-input rounded-xl px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-6 ${
                theme === "light"
                  ? "bg-[rgb(243,244,246)] text-black"
                  : "bg-[rgb(53,65,82)] text-white"
              }`}
            >
              {generateYearOptions()}
            </select>
          </div>
        </div>

        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full pr-8"
        >
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart
              data={filteredData}
              onClick={handleChartClick}
              style={{ cursor: "pointer" }}
            >
              <defs>
                {Object.keys(chartConfig).map((key) => (
                  <linearGradient
                    key={key}
                    id={`fill${key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={
                        chartConfig[key as keyof typeof chartConfig]?.color
                      }
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={
                        chartConfig[key as keyof typeof chartConfig]?.color
                      }
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                stroke={axisColor}
                tick={{ fill: axisColor }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                stroke={axisColor}
                tick={{ fill: axisColor }}
              />
              <Tooltip
                formatter={(value, name) => [
                  `${value} CVEs`,
                  typeof name === "string"
                    ? name.charAt(0).toUpperCase() + name.slice(1)
                    : String(name).charAt(0).toUpperCase() +
                      String(name).slice(1),
                ]}
                labelFormatter={(month) => `Month: ${month} (Click to filter)`}
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
              {Object.keys(chartConfig).map((key) => (
                <Area
                  key={key}
                  dataKey={key}
                  type="natural"
                  fill={`url(#fill${key})`}
                  stroke={chartConfig[key as keyof typeof chartConfig].color}
                  stackId="a"
                />
              ))}
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </>
    </>
  );

  if (standalone) {
    return (
      <Card
        className={`w-full ${
          theme === "light" ? "bg-[rgb(243,244,246)]" : "bg-[rgb(29,41,56)]"
        }`}
      >
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <CardTitle>Severity Based Area Chart for CVEs</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          {renderChart()}
        </CardContent>
      </Card>
    );
  }

  return renderChart();
}
