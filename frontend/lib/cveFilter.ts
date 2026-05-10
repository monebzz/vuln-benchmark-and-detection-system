// converted from cveFilter.ts
import { CveRecord } from "@/types/cveRecordData";

export async function fetchCvesPage({
  field,
  value,
  year,
  from,
  to,
  pageSize = 10,
  startAfterDoc,
  orderField,
  orderDirection = "desc",
}: {
  field: string;
  value?: string;
  year?: number;
  from?: string;
  to?: string;
  pageSize?: number;
  startAfterDoc?: any;
  orderField?: string;
  orderDirection?: "asc" | "desc";
}) {
  if (!field) throw new Error("Field must always be provided!");
  const params = new URLSearchParams();
  params.set("field", field);
  if (value) params.set("value", value);
  if (year) params.set("year", String(year));
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  params.set("pageSize", String(pageSize));
  params.set("page", "1");
  params.set("orderField", orderField || "datepublished");
  params.set("orderDirection", orderDirection);

  const res = await fetch(`/api/cve?${params.toString()}`, {
    cache: "force-cache",
  });
  if (!res.ok) {
    return {
      records: [] as CveRecord[],
      lastVisibleDoc: null,
      totalCount: 0,
      totalPages: 1,
    };
  }
  const data = await res.json();
  return {
    records: (data.records || []) as CveRecord[],
    lastVisibleDoc: null,
    totalCount: Number(data.totalCount || 0),
    totalPages: Number(data.totalPages || 1),
  };
}
