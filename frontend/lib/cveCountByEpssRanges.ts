// converted from lib/cveEpssRanges.ts
import { EpssRangeStats } from "@/types/cveEpssRanges";

export async function getEpssRanges(): Promise<EpssRangeStats | null> {
  try {
    const res = await fetch("/api/dashboard/cve-epss-ranges", {
      cache: "force-cache",
    });
    if (!res.ok) return null;
    const data = await res.json();

    if (!data) {
      return null;
    }

    return {
      id: data.id || "epssStats",
      change_10_to_20pct: Number(data.change_10_to_20pct) || 0,
      change_1_to_2pct: Number(data.change_1_to_2pct) || 0,
      change_20_to_50pct: Number(data.change_20_to_50pct) || 0,
      change_2_to_5pct: Number(data.change_2_to_5pct) || 0,
      change_5_to_10pct: Number(data.change_5_to_10pct) || 0,
      change_over_50pct: Number(data.change_over_50pct) || 0,
      change_under_1pct: Number(data.change_under_1pct) || 0,
      total_with_change_data: Number(data.total_with_change_data) || 0,
    };
  } catch (error) {
    console.error("Error fetching EPSS ranges:", error);
    return null;
  }
}
