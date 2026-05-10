// converted from cveFullData.ts
import { CveFullData } from "@/types/cveFullData";

export async function getCveFullDataById(
  documentId: string
): Promise<CveFullData | null> {
  try {
    const res = await fetch(`/api/cve-detail?id=${encodeURIComponent(documentId)}`, {
      cache: "force-cache",
    });
    if (!res.ok) {
      console.warn(`CVE Document with ID ${documentId} not found.`);
      return null;
    }
    const data = await res.json();
    return {
      cvedata_data: data.cvedata_data || {},
      cverecord_data: data.cverecord_data || {},
    };
  } catch (error) {
    console.error("Error fetching CVE data:", error);
    return null;
  }
}
