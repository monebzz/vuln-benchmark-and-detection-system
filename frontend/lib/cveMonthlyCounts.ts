// converted from lib/cveMonthlyCounts.ts
import { CveMonthlyCount } from "@/types/cveMonthlyDetails";

export async function getCveMonthlyCountsByYear(
  year: number
): Promise<CveMonthlyCount[]> {
  try {
    const res = await fetch(`/api/dashboard/cve-monthly-count?year=${year}`, {
      cache: "force-cache",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error fetching CVE monthly counts:", error);
    return [];
  }
}
