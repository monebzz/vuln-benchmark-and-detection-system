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
  const { theme } = useTheme();

  const isDark = theme === "dark";

  const getCardBg = () => {
    if (cardBg) return cardBg;
    switch (color) {
      case "red":
        return "rgba(255, 0, 80, 0.8)";
      case "amber":
        return "rgba(255, 165, 0, 0.8)";
      case "green":
        return "rgba(0, 220, 120, 0.8)";
      case "blue":
        return "rgba(0, 140, 255, 0.8)";
      case "purple":
        return "rgba(190, 111, 255, 0.8)";
      default:
        return isDark ? "rgba(60, 60, 80, 0.7)" : "rgba(255, 255, 255, 0.9)";
    }
  };

  const handleClick = () => {
    if (linkTo) router.push(linkTo);
  };

  return (
    <Card
      onClick={handleClick}
      className={`
        border ${isDark ? "border-white/30" : "border-black/10"}
        rounded-2xl 
        shadow-lg 
        cursor-pointer 
        transition-transform duration-500 
        hover:scale-[1.05] 
        hover:shadow-2xl 
        relative overflow-hidden
      `}
      style={{
        background: getCardBg(),
        WebkitBackdropFilter: "blur(15px)",
        backdropFilter: "blur(15px)",
      }}
    >
      {/* Brighter moving shine */}
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background:
            "linear-gradient(45deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.3) 40%, rgba(255,255,255,0) 70%)",
          backgroundSize: "200% 200%",
          animation: "shineMove 4s ease-in-out infinite",
        }}
      ></div>

      {/* Brighter glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          background:
            "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.4), transparent 70%), radial-gradient(circle at 100% 100%, rgba(255,255,255,0.3), transparent 70%)",
          backgroundSize: "200% 200%",
          animation: "glowMotion 8s ease-in-out infinite alternate",
        }}
      ></div>

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <div className="flex flex-col space-y-1">
          <CardTitle
            className={`text-sm font-medium ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {title}
          </CardTitle>

          {cvssRange && (
            <p
              className={`text-xs ${
                isDark ? "text-gray-200" : "text-gray-600"
              }`}
              style={textColor ? { color: textColor } : {}}
            >
              CVSS: {cvssRange}
            </p>
          )}
        </div>

        {trend && (
          <div
            className={`flex items-center text-xs ${
              trendUp
                ? isDark
                  ? "text-green-300"
                  : "text-green-600"
                : isDark
                ? "text-red-300"
                : "text-red-600"
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

      <CardContent className="relative z-10">
        <div
          className={`text-2xl font-bold ${
            isDark ? "text-white" : "text-black"
          }`}
        >
          {value.toLocaleString()}
        </div>
        <p className={`${isDark ? "text-gray-200" : "text-gray-700"} text-xs`}>
          {description}
        </p>
      </CardContent>

      <style jsx>{`
        @keyframes shineMove {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 100% 100%;
          }
        }
        @keyframes glowMotion {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 100% 100%;
          }
        }
      `}</style>
    </Card>
  );
}
