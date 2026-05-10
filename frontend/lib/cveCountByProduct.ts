// converted from lib/cveCountByProduct.ts
import { CveProductCount } from "@/types/cveProductCount";

export async function getTopCveProducts(
  limitCount: number = 10
): Promise<CveProductCount[]> {
  try {
    const res = await fetch(`/api/dashboard/cve-product-count?limit=${limitCount}`, {
      cache: "force-cache",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error fetching top CVE products:", error);
    return [];
  }
}
