// lib/cveYearlyCount.ts
import { CveYearlyCount } from "@/types/cveYearlyDetails";

export async function getCveYearlyCounts(): Promise<CveYearlyCount[]> {
  try {
    const res = await fetch("/api/dashboard/cve-yearly-count", {
      cache: "force-cache",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error fetching CVE yearly counts:", error);
    return [];
  }
}
