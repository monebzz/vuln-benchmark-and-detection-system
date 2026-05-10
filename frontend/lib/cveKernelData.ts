export interface SubCollectionDocs {
  [subCollectionName: string]: any[];
}

export interface KernelCveData {
  id: string;
  cveId: string;
  summary: string;
  patchIds: string[];
  subcollections: SubCollectionDocs;
}

export async function getCveKernalDataById(
  docId: string
): Promise<KernelCveData | null> {
  try {
    const res = await fetch(
      `/api/kernel-detail/by-doc-id?docId=${encodeURIComponent(docId)}`,
      { cache: "force-cache" }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error fetching Kernel data:", error);
    return null;
  }
}

export async function getCveKernalDataByCveAndPatch(
  cveId: string,
  patchId: string
): Promise<KernelCveData | null> {
  try {
    const res = await fetch(
      `/api/kernel-detail/by-cve-patch?cveId=${encodeURIComponent(cveId)}&patchId=${encodeURIComponent(patchId)}`,
      { cache: "force-cache" }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error fetching Kernel data by CVE & Patch:", error);
    return null;
  }
}
