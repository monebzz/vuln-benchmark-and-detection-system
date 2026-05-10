// converted from lib/cveTopVendors.ts
import { CveAssignerCount } from "@/types/cveAssignerCount";

export async function getTopCveAssigners(
  limitCount: number = 10
): Promise<CveAssignerCount[]> {
  try {
    const res = await fetch(
      `/api/dashboard/cve-assigner-count?limit=${limitCount}`,
      { cache: "force-cache" }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error fetching top CVE vendors:", error);
    return [];
  }
}
