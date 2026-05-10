// converted from lib/cveTypeCounts.ts
import { CveTypeCount } from "@/types/cveTypeCount";

export async function getAllCveTypeCounts(): Promise<CveTypeCount[]> {
  try {
    const res = await fetch("/api/dashboard/cve-type-count", {
      cache: "force-cache",
    });
    if (!res.ok) return [];
    const allCounts: CveTypeCount[] = await res.json();
    return allCounts;
  } catch (error) {
    console.error("Error fetching CVE type counts:", error);
    return [];
  }
}
