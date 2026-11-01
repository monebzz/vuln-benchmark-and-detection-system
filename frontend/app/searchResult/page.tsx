"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { CveRecord } from "@/types/cveRecordData";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Background from "@/components/background";
import LoaderScreen from "../loading";

export default function SearchResultPage() {
  const { theme } = useTheme();
  const params = useSearchParams();
  const query = params.get("q") || "";
  const [records, setRecords] = useState<CveRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const ITEMS_PER_PAGE = 20;

  // Reset pagination when query changes
  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (!query.trim()) {
      setRecords([]);
      setTotalCount(0);
      setTotalPages(1);
      return;
    }
    const fetchResults = async () => {
      setLoading(true);
      try {
        const url = `/api/search?q=${encodeURIComponent(
          query,
        )}&page=${page}&pageSize=${ITEMS_PER_PAGE}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch search results");
        const data = await res.json();
        setRecords(data.records || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error("Error loading search results:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query, page]);

  const handlePreviousPage = () => {
    if (page > 1) setPage((p) => p - 1);
  };
  const handleNextPage = () => {
    if (page < totalPages) setPage((p) => p + 1);
  };

  const getSeverityBadge = (severity?: string | null) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "bg-rose-500/10 border-rose-500/25 text-rose-400";
      case "high":
        return "bg-orange-500/10 border-orange-500/25 text-orange-400";
      case "medium":
        return "bg-amber-500/10 border-amber-500/25 text-amber-400";
      case "low":
        return "bg-emerald-500/10 border-emerald-500/25 text-emerald-400";
      default:
        return "bg-white/[0.05] border-white/10 text-[#8A8A93]";
    }
  };

  const formatValue = (val: any) =>
    typeof val === "number" && !Number.isInteger(val)
      ? val.toFixed(2).replace(/\.00$/, "")
      : val;

  const isValidValue = (val: any): boolean => {
    if (val === null || val === undefined) return false;
    if (typeof val === "number") return val !== 0;
    if (typeof val === "string") {
      const lower = val.trim().toLowerCase();
      return (
        lower !== "0" && lower !== "n/a" && lower !== "unknown" && lower !== ""
      );
    }
    return true;
  };

  const getCvssData = (record: any) => {
    let severity: string | null = null;
    let cvssScore: string | null = null;
    let cvssVector: string | null = null;
    let cvssVersion: string | null = null;

    if (record.latest_basescore) {
      cvssScore = record.latest_basescore.toString();
      severity = record.latest_severity ?? null;
      cvssVersion = record.latest_cvss_version?.toString() ?? null;
    } else if (record.all_metrics?.cvssV5_1) {
      const cvss = record.all_metrics.cvssV5_1;
      severity = cvss.baseSeverity ?? null;
      cvssScore = cvss.baseScore?.toString() ?? null;
      cvssVector = cvss.vectorString ?? null;
      cvssVersion = "5.1";
    } else if (record.all_metrics?.cvssV5_0) {
      const cvss = record.all_metrics.cvssV5_0;
      severity = cvss.baseSeverity ?? null;
      cvssScore = cvss.baseScore?.toString() ?? null;
      cvssVector = cvss.vectorString ?? null;
      cvssVersion = "5.0";
    } else if (record.all_metrics?.cvssV4_0) {
      const cvss = record.all_metrics.cvssV4_0;
      severity = cvss.baseSeverity ?? null;
      cvssScore = cvss.baseScore?.toString() ?? null;
      cvssVector = cvss.vectorString ?? null;
      cvssVersion = "4.0";
    } else if (record.all_metrics?.cvssV3_1) {
      const cvss = record.all_metrics.cvssV3_1;
      severity = cvss.baseSeverity ?? null;
      cvssScore = cvss.baseScore?.toString() ?? null;
      cvssVector = cvss.vectorString ?? null;
      cvssVersion = "3.1";
    } else if (record.all_metrics?.cvssV3_0) {
      const cvss = record.all_metrics.cvssV3_0;
      severity = cvss.baseSeverity ?? null;
      cvssScore = cvss.baseScore?.toString() ?? null;
      cvssVector = cvss.vectorString ?? null;
      cvssVersion = "3.0";
    } else if (record.all_metrics?.cvssV2) {
      const cvss = record.all_metrics.cvssV2;
      severity = cvss.baseSeverity ?? null;
      cvssScore = cvss.baseScore?.toString() ?? null;
      cvssVector = cvss.vectorString ?? null;
      cvssVersion = "2.0";
    }

    return { severity, cvssScore, cvssVector, cvssVersion };
  };

  return (
    <div className="w-full min-h-screen relative">
      <Background />
      <div className="relative z-10">
        <DashboardHeader />
        <div className="relative z-10 px-8 py-6">
          {loading ? (
            <LoaderScreen />
          ) : records.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-sm font-mono text-[#8A8A93]">
                No CVE records found for &ldquo;{query}&rdquo;.
              </p>
            </div>
          ) : (
            <div className="flex flex-col space-y-3 max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Search Results for:{" "}
                  <span className="font-mono text-zinc-300">
                    &ldquo;{query}&rdquo;
                  </span>
                </h1>
                <span className="text-xs font-mono text-[#8A8A93]">
                  {totalCount.toLocaleString()} matching records
                </span>
              </div>
              {records.map((record) => {
                const { severity, cvssScore, cvssVector, cvssVersion } =
                  getCvssData(record);
                return (
                  <div
                    key={record.cveid}
                    onClick={() => router.push(`/cve/${record.cveid}`)}
                    className="p-4 rounded-xl cursor-pointer border border-white/[0.07] hover:border-white/[0.14] transition-all bg-[#111113] hover:bg-[#151518]"
                  >
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <div>
                        <h3 className="font-mono text-sm font-bold text-white hover:underline">
                          {record.cveid}
                        </h3>
                        {isValidValue(record.title) && (
                          <p className="text-sm text-zinc-200 mt-0.5">
                            {record.title}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isValidValue(severity) && (
                          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium rounded border ${getSeverityBadge(severity)}`}>
                            {severity}
                          </span>
                        )}
                        {record.patched && (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium rounded border bg-emerald-500/10 border-emerald-500/25 text-emerald-400">
                            Patched
                          </span>
                        )}
                      </div>
                    </div>

                    {isValidValue(record.description) && (
                      <p className="text-xs text-[#8A8A93] line-clamp-2 mb-3 leading-relaxed">
                        {record.description}
                      </p>
                    )}

                    {/* Metadata badges */}
                    <div className="flex flex-wrap gap-1.5 items-center text-xs">
                      {isValidValue(record.assigner) && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono text-[#8A8A93] bg-[#0D0D0F] border border-white/[0.06]">
                          Assigner: {record.assigner}
                        </span>
                      )}
                      {isValidValue(record.category_type) && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono text-[#8A8A93] bg-[#0D0D0F] border border-white/[0.06]">
                          Type: {record.category_type}
                        </span>
                      )}
                      {isValidValue(record.datepublished) && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono text-[#8A8A93] bg-[#0D0D0F] border border-white/[0.06]">
                          Date: {new Date(record.datepublished).toLocaleDateString()}
                        </span>
                      )}
                      {isValidValue(cvssScore) && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono text-[#8A8A93] bg-[#0D0D0F] border border-white/[0.06]">
                          CVSS: {formatValue(cvssScore)}
                        </span>
                      )}
                      {isValidValue(cvssVersion) && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono text-[#8A8A93] bg-[#0D0D0F] border border-white/[0.06]">
                          v{cvssVersion}
                        </span>
                      )}
                      {isValidValue(cvssVector) && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono text-[#8A8A93] bg-[#0D0D0F] border border-white/[0.06]">
                          Vector: {cvssVector}
                        </span>
                      )}
                      {isValidValue(record.epss_score) && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono text-[#8A8A93] bg-[#0D0D0F] border border-white/[0.06]">
                          EPSS: {formatValue(record.epss_score)}
                        </span>
                      )}
                      {isValidValue(record.vendor) && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono text-[#8A8A93] bg-[#0D0D0F] border border-white/[0.06]">
                          Vendor: {record.vendor}
                        </span>
                      )}
                      {isValidValue(record.product) && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono text-[#8A8A93] bg-[#0D0D0F] border border-white/[0.06]">
                          Product: {record.product}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {/* Pagination */}
              <div className="flex flex-col items-center justify-center pt-6 space-y-2">
                <div className="text-xs font-mono text-[#8A8A93]">
                  Page {page} of {totalPages} ({totalCount} results)
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={page === 1}
                    className="h-8 px-2.5 rounded-lg border border-white/[0.08] bg-[#151518] hover:bg-white/[0.08] text-[#8A8A93] hover:text-white disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-mono font-medium text-white px-2">{page}</span>
                  <Button
                    size="sm"
                    onClick={handleNextPage}
                    disabled={page >= totalPages}
                    className="h-8 px-2.5 rounded-lg border border-white/[0.08] bg-[#151518] hover:bg-white/[0.08] text-[#8A8A93] hover:text-white disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
