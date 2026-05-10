// converted from lib/cveSeverityCounts.ts
import { CveSeverityCount } from "@/types/cveSeverityCount";

export async function getAllCveSeverityCounts() {
  try {
    const res = await fetch("/api/dashboard/cve-severity-count", {
      cache: "force-cache",
    });
    if (!res.ok) return [];
    const allCounts: CveSeverityCount[] = await res.json();
    return allCounts;
  } catch (error) {
    console.error("Error fetching CVE severity counts:", error);
    return [];
  }
}
