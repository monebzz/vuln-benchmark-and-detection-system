// converted from lib/cveScoreRanges.ts
import { CveScoreRange } from "@/types/cveScoreRanges";

export async function getAllCveScoreRanges(): Promise<CveScoreRange[]> {
  try {
    const res = await fetch("/api/dashboard/cve-score-ranges", {
      cache: "force-cache",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error fetching CVE score ranges:", error);
    return [];
  }
}
