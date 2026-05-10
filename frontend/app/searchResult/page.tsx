"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { DashboardHeader } from "@/components/dashboard-header";
import { CveRecord } from "@/types/cveRecordData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
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

  const getSeverityColor = (severity?: string | null) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "bg-red-500 hover:bg-red-600 text-white";
      case "high":
        return "bg-orange-500 hover:bg-orange-600 text-white";
      case "medium":
        return "bg-yellow-500 hover:bg-yellow-600 text-black";
      case "low":
        return "bg-green-500 hover:bg-green-600 text-white";
      default:
        return "bg-gray-400 hover:bg-gray-500 text-white";
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

  const isLight = theme === "light";
  return (
    <div className="w-full min-h-screen relative">
      <Background />
      <div className="relative z-10">
        <DashboardHeader />
        <div className="relative z-10 px-8 py-6">
          {loading ? (
            <LoaderScreen />
          ) : records.length === 0 ? (
            <p className="text-center text-gray-400">
              No CVE records found for “{query}”.
            </p>
          ) : (
            <div className="flex flex-col space-y-3">
              <h1 className="text-2xl font-bold mb-4 px-2">
                Search Results for:{" "}
                <span className={isLight ? "text-blue-600" : "text-purple-400"}>
                  {query}
                </span>
              </h1>
              {records.map((record) => {
                const { severity, cvssScore, cvssVector, cvssVersion } =
                  getCvssData(record);
                return (
                  <div
                    key={record.cveid}
                    onClick={() => router.push(`/cve/${record.cveid}`)}
                    className={`p-3 rounded-lg cursor-pointer shadow-sm border-b transition bg-[rgb(243,244,246)] hover:bg-gray-200 dark:bg-[rgb(40,51,65)] dark:hover:bg-[rgb(53,65,82)]`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-mono text-base font-bold text-primary">
                          {record.cveid}
                        </h3>
                        {isValidValue(record.title) && (
                          <p className="text-sm text-black dark:text-white">
                            {record.title}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-row gap-1">
                        <div>
                          {isValidValue(severity) && (
                            <Badge className={getSeverityColor(severity)}>
                              {severity}
                            </Badge>
                          )}
                        </div>
                        <div>
                          {record.patched && (
                            <Badge className="bg-green-600 text-white text-sm">
                              Patched
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {isValidValue(record.description) && (
                      <p className="text-sm mt-1 line-clamp-2 mb-2 text-black dark:text-white">
                        {record.description}
                      </p>
                    )}

                    {/* Metadata badges */}
                    <div className="flex flex-wrap gap-2 items-center text-xs">
                      {isValidValue(record.assigner) && (
                        <Badge variant="outline">
                          Assigner: {record.assigner}
                        </Badge>
                      )}
                      {isValidValue(record.category_type) && (
                        <Badge variant="outline">
                          Type: {record.category_type}
                        </Badge>
                      )}
                      {isValidValue(record.datepublished) && (
                        <Badge variant="default">
                          Date:{" "}
                          {new Date(record.datepublished).toLocaleDateString()}
                        </Badge>
                      )}
                      {isValidValue(cvssScore) && (
                        <Badge variant="outline">
                          CVSS: {formatValue(cvssScore)}
                        </Badge>
                      )}
                      {isValidValue(cvssVersion) && (
                        <Badge variant="outline">
                          CVSS Version: {cvssVersion}
                        </Badge>
                      )}
                      {isValidValue(cvssVector) && (
                        <Badge variant="outline">
                          CVSS Vector: {cvssVector}
                        </Badge>
                      )}
                      {isValidValue(record.epss_score) && (
                        <Badge variant="outline">
                          EPSS: {formatValue(record.epss_score)}
                        </Badge>
                      )}
                      {isValidValue(record.vendor) && (
                        <Badge variant="outline">Vendor: {record.vendor}</Badge>
                      )}
                      {isValidValue(record.product) && (
                        <Badge variant="outline">
                          Product: {record.product}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
              {/* 🔄 Pagination */}
              <div className="flex flex-col items-center justify-center mt-6 space-y-2">
                <div className="text-sm text-gray-400">
                  Page {page} of {totalPages} ({totalCount} results)
                </div>
                <div className="flex items-center space-x-4">
                  <Button
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={page === 1}
                    className="rounded-full px-3 py-1 text-sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium">{page}</span>
                  <Button
                    size="sm"
                    onClick={handleNextPage}
                    disabled={page >= totalPages}
                    className="rounded-full px-3 py-1 text-sm"
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
