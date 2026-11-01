"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  trend?: string;
  trendUp?: boolean;
  color?: "default" | "red" | "amber" | "green" | "blue" | "purple";
  linkTo?: string;
  cvssRange?: string;
  cardBg?: string;
  textColor?: string;
}

export function StatCard({
  title,
  value,
  description,
  trend,
  trendUp = true,
  cardBg,
  color = "default",
  linkTo,
  cvssRange,
  textColor,
}: StatCardProps) {
  const router = useRouter();

  const getSeverityStyle = () => {
    switch (color) {
      case "red":
        return "border-l-rose-500 bg-rose-500/[0.04]";
      case "amber":
        return "border-l-orange-500 bg-orange-500/[0.04]";
      case "green":
        return "border-l-yellow-500 bg-yellow-500/[0.04]";
      case "blue":
        return "border-l-green-500 bg-green-500/[0.04]";
      case "purple":
        return "border-l-violet-500 bg-violet-500/[0.04]";
      default:
        return "border-l-white/20 bg-white/[0.02]";
    }
  };

  const handleClick = () => {
    if (linkTo) router.push(linkTo);
  };

  return (
    <Card
      onClick={handleClick}
      className={`
        rounded-2xl border border-white/[0.07] border-l-[3px]
        ${getSeverityStyle()}
        p-4 shadow-sm cursor-pointer
        transition-all duration-150 ease-out
        hover:border-white/[0.15] hover:bg-white/[0.06]
        group relative overflow-hidden
      `}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2 relative z-10">
        <div className="flex flex-col space-y-1">
          <CardTitle className="text-xs uppercase tracking-wider text-[#8A8A93] font-medium">
            {title}
          </CardTitle>

          {cvssRange && (
            <span className="text-[10px] font-mono text-[#8A8A93] border border-white/[0.07] px-1.5 py-0.5 rounded w-fit">
              CVSS: {cvssRange}
            </span>
          )}
        </div>

        {trend && (
          <div
            className={`flex items-center text-xs font-medium ${
              trendUp ? "text-green-400" : "text-rose-400"
            }`}
          >
            {trendUp ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {trend}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0 pt-1 relative z-10">
        <div className="text-2xl font-bold tabular-nums text-white">
          {value.toLocaleString()}
        </div>
        <p className="text-xs text-[#8A8A93] mt-1">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
