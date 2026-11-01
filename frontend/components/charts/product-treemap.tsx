"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { getTopCveProducts } from "@/lib/cveCountByProduct";
import { useTheme } from "next-themes";
import Load from "../loader";
import NoData from "../no-data";
import ServerError from "../server-error";

interface ProductTreemapProps {
  isInteractive?: boolean;
  height?: number;
  standalone?: boolean;
  chartData?: any[];
  onItemClick?: (productId: string) => void;
}

export function ProductTreemap({
  isInteractive = true,
  height = 250,
  standalone = false,
  chartData: initialChartData,
  onItemClick,
}: ProductTreemapProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const tooltipBg = isDark ? "#FFFFFF" : "#8b5cf6";
  const tooltipText = isDark ? "#000000" : "#FFFFFF";
  const tooltipBorder = isDark ? "rgba(255,255,255,0.1)" : "#7c3aed";

  // Helper to get unique items by name
  function getUniqueByNameAndHalveCount(arr: any[]) {
    const seen = new Set();
    return arr
      .filter((item) => {
        const name = (item.name || "").toLowerCase().trim();
        if (seen.has(name)) return false;
        seen.add(name);
        return true;
      })
      .map((item) => ({
        ...item,
        size:
          typeof item.size === "number" ? Math.round(item.size / 2) : item.size,
      }));
  }

  const [chartData, setChartData] = useState<any[]>(
    getUniqueByNameAndHalveCount(initialChartData || [])
  );
  const [loading, setLoading] = useState(!initialChartData);
  const [serverError, setServerError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (initialChartData) {
      setChartData(getUniqueByNameAndHalveCount(initialChartData));
      setLoading(false);
    } else if (standalone) {
      const loadData = async () => {
        setLoading(true);
        setServerError(false);
        try {
          const res = await fetch("/api/dashboard/cve-product-count?limit=10", {
            cache: "no-store",
          });
          if (res.status === 500) {
            setServerError(true);
            setLoading(false);
            return;
          }
          const products = await res.json();
          const formatted = products.map((p: any) => ({
            id: p.id,
            name: p.name,
            size: p.count,
          }));
          setChartData(getUniqueByNameAndHalveCount(formatted));
        } catch (err) {
          setServerError(true);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [initialChartData, standalone]);

  const handleCellClick = (data: any) => {
    if (isInteractive && data && data.name) {
      if (onItemClick) {
        onItemClick(data.name);
      } else if (standalone) {
        router.push(
          `/by-product?product=${encodeURIComponent(data.name)}&tab=list`
        );
      }
    }
  };

  const COLORS = [
    "#7C7CFF", // Soft Neon Blue
    "#5B8CFF", // Cool Royal Blue
    "#4F46E5", // Indigo
    "#6D28D9", // Deep Purple
    "#8B5CF6", // Violet
    "#A78BFA", // Soft Lavender
    "#38BDF8", // Ice Blue
    "#0EA5E9", // Bright Cyan Blue
    "#3B82F6", // Strong Blue
    "#9333EA", // Rich Purple
  ];

  const legendData = chartData.map((item, index) => ({
    name: item.name,
    color: COLORS[index % COLORS.length],
    id: item.id,
  }));

  const truncateText = (text: string, maxLength: number) =>
    !text
      ? ""
      : text.length > maxLength
      ? text.substring(0, maxLength) + "…"
      : text;

  const CustomizedContent: React.FC<any> = (props) => {
    const { x, y, width, height, index, name, size } = props;
    const gradientId = `gradient-${index}`;
    const clipId = `clip-${index}`;
    const radius = 8;

    if (loading) {
      return <Load />;
    }

    if (!chartData || chartData.length === 0) {
      return <NoData />;
    }

    return (
      <g onClick={() => handleCellClick(props)}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <clipPath id={clipId}>
            <rect
              x={x + 1}
              y={y + 1}
              width={width - 2}
              height={height - 2}
              rx={radius}
              ry={radius}
            />
          </clipPath>
        </defs>
        {/* Base colored rectangle with rounded corners */}
        <rect
          x={x + 1}
          y={y + 1}
          width={width - 2}
          height={height - 2}
          rx={radius}
          ry={radius}
          style={{
            fill: COLORS[index % COLORS.length],
            cursor: isInteractive ? "pointer" : "default",
            transition: "opacity 0.2s",
          }}
          className={isInteractive ? "hover:opacity-80" : ""}
        />
        {/* White gradient overlay */}
        <rect
          x={x + 1}
          y={y + 1}
          width={width - 2}
          height={height - 2}
          rx={radius}
          ry={radius}
          style={{
            fill: `url(#${gradientId})`,
            pointerEvents: "none",
          }}
        />
        {width > 50 && height > 30 && (
          <>
            <text
              x={x + width / 2}
              y={y + height / 2 - 5}
              textAnchor="middle"
              fill="#000"
              fontSize={12}
              fontWeight="bold"
              style={{ pointerEvents: "none" }}
            >
              {truncateText(name, 12)}
            </text>
            {size && (
              <text
                x={x + width / 2}
                y={y + height / 2 + 12}
                textAnchor="middle"
                fill="#000"
                fontSize={10}
                fontWeight="bold"
                style={{ pointerEvents: "none" }}
              >
                {size} CVEs
              </text>
            )}
          </>
        )}
      </g>
    );
  };

  const CustomLegend = () => (
    <div className="flex flex-wrap justify-center gap-2 mt-2 px-4">
      {legendData.map((item, index) => (
        <div
          key={index}
          className={`flex items-center text-xs p-1 rounded ${
            isInteractive ? "cursor-pointer hover:bg-muted" : ""
          }`}
          onClick={
            isInteractive
              ? () =>
                  router.push(
                    `/by-product?product=${encodeURIComponent(item.id)}`
                  )
              : undefined
          }
        >
          <div
            className="w-3 h-3 mr-1 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          <span className={isDark ? "text-white" : ""}>
            {truncateText(item.name, 15)}
          </span>
        </div>
      ))}
    </div>
  );

  const renderChart = () => (
    <>
      <div className="flex flex-col h-full rounded-md">
        <ResponsiveContainer width="100%" height={height - 40}>
          <Treemap
            data={chartData}
            dataKey="size"
            nameKey="name"
            content={<CustomizedContent />}
          >
            <Tooltip
              formatter={(value, name, props) =>
                props.payload?.name && props.payload?.size !== undefined
                  ? [`${props.payload.size} CVEs`, props.payload.name]
                  : [value, name]
              }
              contentStyle={{
                borderRadius: "8px",
                border: `1px solid ${tooltipBorder}`,
                backgroundColor: tooltipBg,
                color: tooltipText,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              }}
              labelStyle={{ color: tooltipText }}
              itemStyle={{ color: tooltipText }}
            />
          </Treemap>
        </ResponsiveContainer>
        <CustomLegend />
      </div>
    </>
  );

  if (loading) {
    return <Load />;
  }

  if (serverError) {
    return <ServerError />;
  }

  if (!chartData || chartData.length === 0) {
    return <NoData />;
  }

  if (standalone) {
    return (
      <Card
        className={`
          overflow-hidden rounded-2xl transition-colors duration-300 w-full border-none
          ${isDark ? "bg-[#111113]" : "bg-white  shadow-sm"}
        `}
      >
        <CardContent>{renderChart()}</CardContent>
      </Card>
    );
  }

  return renderChart();
}
