// converted from cveRecords.js
import { CveRecord } from "@/types/cveRecordData";

export async function getCveRecords(
  filters: Partial<CveRecord> = {},
  options: { limitCount?: number; random?: boolean } = {}
): Promise<CveRecord[]> {
  try {
    const params = new URLSearchParams();
    params.set("limit", String(options.limitCount || 10));
    if (options.random) params.set("random", "true");
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "n/a") {
        params.set(key, String(value));
      }
    });
    const res = await fetch(`/api/dashboard/random-cve?${params.toString()}`, {
      cache: "force-cache",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error fetching CVE records:", error);
    return [];
  }
}
