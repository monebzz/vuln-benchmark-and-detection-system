import { AvgStats } from "@/types/averageStatsDetail";

export async function getAverageStats(): Promise<AvgStats | null> {
  try {
    const res = await fetch("/api/statistics/avg-stats", { cache: "force-cache" });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data) return null;
    return {
      avg_base_score: Number(data.avg_base_score) || 0,
      avg_exploit_score: Number(data.avg_exploit_score) || 0,
      avg_percentile: Number(data.avg_percentile) || 0,
      avg_probability: Number(data.avg_probability) || 0,
    };
  } catch (error) {
    console.error("Error fetching average stats:", error);
    return null;
  }
}
