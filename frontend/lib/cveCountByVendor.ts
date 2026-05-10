// converted from lib/cveTopVendors.ts
import { CveVendorCount } from "@/types/cveVendorCount";

export async function getTopCveVendors(
  limitCount: number = 10
): Promise<CveVendorCount[]> {
  try {
    const res = await fetch(`/api/dashboard/cve-vendor-count?limit=${limitCount}`, {
      cache: "force-cache",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error fetching top CVE vendors:", error);
    return [];
  }
}
