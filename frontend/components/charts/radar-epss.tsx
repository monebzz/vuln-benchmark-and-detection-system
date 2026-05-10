"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { InteractiveHint } from "@/components/ui/interactive-hint";
import { getEpssRanges } from "@/lib/cveCountByEpssRanges";
import Load from "../loader";
import NoData from "../no-data";
import ServerError from "../server-error";

const chartConfig = {
  count: {
    label: "Count",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

interface RadarChartEpssProps {
  isInteractive?: boolean;
  height?: number;
  standalone?: boolean;
}

export function RadarChartEpss({
  isInteractive = true,
  height = 250,
  standalone = false,
}: RadarChartEpssProps) {
  const [chartData, setChartData] = useState<
    { value: string; count: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const axisColor = isDark ? "#ffffff" : "#6b7280";
  const tooltipBg = isDark ? "#FFFFFF" : "#8b5cf6";
  const tooltipText = isDark ? "#000000" : "#FFFFFF";
  const tooltipBorder = isDark ? "rgba(255,255,255,0.1)" : "#7c3aed";

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setServerError(false);
        const res = await fetch("/api/dashboard/cve-epss-ranges", {
          cache: "force-cache",
        });
        if (res.status === 500) {
          setServerError(true);
          setLoading(false);
          return;
        }
        const epssData = await res.json();
        if (!epssData) {
          setChartData([]);
          return;
        }
        const formattedData = [
          { value: "1%", count: epssData.change_under_1pct },
          { value: "1–2%", count: epssData.change_1_to_2pct },
          { value: "2–5%", count: epssData.change_2_to_5pct },
          { value: "5–10%", count: epssData.change_5_to_10pct },
          { value: "10–20%", count: epssData.change_10_to_20pct },
          { value: "20–50%", count: epssData.change_20_to_50pct },
          { value: ">50%", count: epssData.change_over_50pct },
        ];
        setChartData(formattedData);
      } catch (error) {
        setServerError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const parseEpssLabel = (label: string) => {
    const clean = label.replace(/\s/g, "");
    if (clean === "1%") return { minEpss: "0", maxEpss: "1" };
    if (clean === "1-2%" || clean === "1–2%")
      return { minEpss: "1", maxEpss: "2" };
    if (clean === "2–5%") return { minEpss: "2", maxEpss: "5" };
    if (clean === "5–10%") return { minEpss: "5", maxEpss: "10" };
    if (clean === "10–20%") return { minEpss: "10", maxEpss: "20" };
    if (clean === "20–50%") return { minEpss: "20", maxEpss: "50" };
    if (clean === ">50%") return { minEpss: "50", maxEpss: "100" };
    return null;
  };

  const handleLabelClick = (value: string) => {
    if (!isInteractive) return;
    const range = parseEpssLabel(value);
    if (!range) return;
    router.push(
      `/by-epss?minEpss=${range.minEpss}&maxEpss=${range.maxEpss}&tab=list`
    );
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!isInteractive) return null;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={5}
        stroke={isDark ? "white" : "#A855F7"} // purple-400
        strokeWidth={1}
        fill={isDark ? "white" : "#A855F7"}
        className="transition-all hover:scale-150 cursor-pointer"
        onClick={() => handleLabelClick(payload.value)}
      />
    );
  };

  if (loading) {
    return <Load />;
  }

  if (serverError) {
    return <ServerError />;
  }

  if (!chartData || chartData.length === 0) {
    return <NoData />;
  }

  const renderChart = () => (
    <div className="relative">
      <>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[450px]"
        >
          <ResponsiveContainer width="100%" height={height}>
            <RadarChart
              data={chartData}
              style={isInteractive ? { cursor: "pointer" } : {}}
            >
              <PolarGrid stroke={axisColor} strokeWidth={0.5} />
              <PolarAngleAxis
                dataKey="value"
                stroke={axisColor}
                tick={{
                  fill: axisColor,
                  fontSize: 12,
                }}
                onClick={
                  isInteractive
                    ? (data) => handleLabelClick(data.value)
                    : undefined
                }
                style={isInteractive ? { cursor: "pointer" } : {}}
              />
              <Radar
                name="Number of CVEs"
                dataKey="count"
                stroke={isDark ? "white" : "#A855F7"} // purple-400
                fill={isDark ? "white" : "#A855F7"} // purple fill in light mode
                fillOpacity={0.6}
                cursor={isInteractive ? "pointer" : "default"}
                dot={<CustomDot />}
              />
              <Tooltip
                formatter={(value) => [`${value} CVEs`, "Count"]}
                labelFormatter={(label) => `EPSS Range: ${label}`}
                contentStyle={{
                  borderRadius: "8px",
                  border: `1px solid ${tooltipBorder}`,
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  backgroundColor: tooltipBg,
                  color: tooltipText,
                }}
                labelStyle={{ color: tooltipText }}
                itemStyle={{ color: tooltipText }}
              />
              <Legend
                wrapperStyle={{
                  color: "black",
                  fontSize: "12px",
                }}
                iconType="circle"
              />
            </RadarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {isInteractive && chartData.length > 0 && (
          <div className="mt-4 space-y-2">
            <p
              className={`text-sm font-medium text-center ${
                isDark ? "text-white" : "text-black"
              }`}
            >
              Click to view CVEs by EPSS range:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {chartData.map((data) => (
                <button
                  key={data.value}
                  onClick={() => handleLabelClick(data.value)}
                  className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                    isDark
                      ? "border-white/30 hover:bg-white/10 hover:text-white text-white"
                      : "border-black/30 hover:bg-purple-100 hover:text-black text-black"
                  }`}
                  title={`View ${data.count} CVEs in ${data.value} EPSS range`}
                >
                  {data.value} ({data.count} CVEs)
                </button>
              ))}
            </div>
          </div>
        )}
      </>
    </div>
  );

  if (standalone) {
    return (
      <Card
        className={`${
          isDark
            ? "bg-[rgb(29,41,56)] border-white/10"
            : "bg-white border-gray-200 shadow-sm"
        }`}
      >
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className={isDark ? "text-white" : "text-black"}>
              EPSS Based Distribution for CVEs
            </CardTitle>
            {isInteractive && (
              <p
                className={`text-sm mt-1 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Click on any segment or point to view CVEs in that EPSS range
              </p>
            )}
          </div>
          {isInteractive && (
            <InteractiveHint message="Click on chart points or labels to filter CVEs" />
          )}
        </CardHeader>
        <CardContent className="pb-0">{renderChart()}</CardContent>
      </Card>
    );
  }

  return renderChart();
}
