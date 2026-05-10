// converted from lib/cveDailyCountDetail.ts
import { CveDailyCount } from "@/types/cveDailyDetails";

export async function getCveDailyCountsByYear(
  year: number
): Promise<CveDailyCount[]> {
  try {
    const res = await fetch(`/api/dashboard/cve-daily-count?year=${year}`, {
      cache: "force-cache",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error fetching CVE daily counts:", error);
    return [];
  }
}
