// lib/kernel_functions.ts

/**
 * Fetch a file from Firebase Storage inside:
 * Kernel/{type}/{cveId}/{patchId}/{fileName}
 *
 * @param type "vulnerable_function" | "nonvulnerable_function"
 * @param cveId CVE ID folder name (string)
 * @param patchId Patch ID folder name (string)
 * @param fileName Actual file name inside patchId
 * @returns Promise<string> File contents as text
 */
export async function fetchKernelFunctions(
  type: "vulnerable_function" | "nonvulnerable_function",
  cveId: string,
  patchId: string,
  fileName: string
): Promise<string> {
  try {
    const url = `/api/kernel-detail/function?type=${encodeURIComponent(
      type
    )}&cveId=${encodeURIComponent(cveId)}&patchId=${encodeURIComponent(
      patchId
    )}&fileName=${encodeURIComponent(fileName)}`;
    const response = await fetch(url, { cache: "force-cache" });
    if (!response.ok) throw new Error("Failed to fetch file.");
    const data = await response.json();
    return data.content || "";
  } catch (error) {
    console.error("❌ Failed to fetch kernel file:", error);
    return "";
  }
}
