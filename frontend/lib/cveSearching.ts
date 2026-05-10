// converted from the @lib/cveSearchig.ts
import { CveRecord } from "@/types/cveRecordData";

/**
 * 🔍 CVE Search with Multi-field Matching + Pagination
 */
export async function searchCves({
  searchTerm,
  pageSize = 10,
  currentPage = 1,
  orderField = "datepublished",
  orderDirection = "desc",
}: {
  searchTerm?: string;
  pageSize?: number;
  currentPage?: number;
  orderField?: string;
  orderDirection?: "asc" | "desc";
}) {
  const params = new URLSearchParams();
  if (searchTerm) params.set("q", searchTerm);
  params.set("page", String(currentPage));
  params.set("pageSize", String(pageSize));
  params.set("orderField", orderField);
  params.set("orderDirection", orderDirection);

  const res = await fetch(`/api/search?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    return {
      records: [] as CveRecord[],
      lastVisibleDoc: null,
      totalCount: 0,
      totalPages: 1,
      currentPage,
    };
  }
  const data = await res.json();
  return {
    records: (data.records || []) as CveRecord[],
    lastVisibleDoc: null,
    totalCount: Number(data.totalCount || 0),
    totalPages: Number(data.totalPages || 1),
    currentPage: Number(data.currentPage || currentPage),
  };
}
