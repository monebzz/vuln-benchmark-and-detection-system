export async function getGithubDataWithShaDetails(cveId: string) {
  try {
    const res = await fetch(
      `/api/github-detail/by-cve?cveId=${encodeURIComponent(cveId)}`,
      { cache: "force-cache" }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error fetching complete GitHub CVE data:", error);
    return null;
  }
}

export interface GithubPatchDoc {
  fileName: string;
  fileContent: string;
  normalizedFiles?: any;
  originalFiles?: any;
  [key: string]: any;
}

export async function getGithubPatchDataByCveAndPatch(
  cveId: string,
  patchId: string
): Promise<GithubPatchDoc[] | null> {
  try {
    const res = await fetch(
      `/api/github-detail/by-cve-patch?cveId=${encodeURIComponent(cveId)}&patchId=${encodeURIComponent(patchId)}`,
      { cache: "force-cache" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : null;
  } catch (error) {
    console.error("Error fetching GitHub patch data:", error);
    return null;
  }
}
