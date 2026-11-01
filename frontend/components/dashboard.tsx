"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { VulnerabilityTypeDonut } from "./charts/vulnerability-type-donut";
import { RadarChartEpss } from "./charts/radar-epss";
import { SeverityChart } from "./charts/severity-chart";
import { VendorBarChart } from "./charts/vendor-bar-chart";
import { ProductTreemap } from "./charts/product-treemap";
import { TrendLineChart } from "./charts/trend-line-chart";
import { CveList } from "@/components/random-10-cve-list";
import { DashboardHeader } from "./dashboard-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, ShieldAlert, Sparkles, Code2 } from "lucide-react";
import { VulnerabilityHeatmap } from "./charts/vulnerability-heatmap";
import { StatCard } from "./stat-card";
import { PaginatedCveList } from "@/components/paginated-cve-list";
import { CvssDistributionChart } from "./charts/cvss-distribution-chart";
import { CveSeverityCount } from "@/types/cveSeverityCount";
// getAllCveSeverityCounts removed — dashboard fetches severity counts directly
import { AssignerBarChart } from "./charts/assigner_bar_chart";
import Background from "./background";

export function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  // Listen for Patched badge click event to instantly switch tab
  useEffect(() => {
    function handleSwitchTab(e: any) {
      if (e?.detail?.tab) {
        setActiveTab(e.detail.tab);
        const url = new URL(window.location.href);
        url.searchParams.set("tab", e.detail.tab);
        if (e.detail.tab === "patched") {
          url.searchParams.set("page", "1");
        } else {
          url.searchParams.delete("page");
        }
        router.push(url.pathname + url.search);
      }
    }
    window.addEventListener("dashboard-switch-tab", handleSwitchTab);
    return () =>
      window.removeEventListener("dashboard-switch-tab", handleSwitchTab);
  }, [router, pathname]);

  const [selectedCve, setSelectedCve] = useState<string | null>(null);
  const [cveCountDetail, setCveCountDetail] = useState<CveSeverityCount>({
    id: "",
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    none: 0,
    unknown: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // --- Fetch CVE counts on mount ---
  useEffect(() => {
    const fetchCveCounts = async () => {
      try {
        setIsLoading(true);
        const allCounts = await fetch("/api/dashboard/cve-severity-count", {
          cache: "no-store",
        }).then((res) => res.json());

        const mergedCounts = allCounts.reduce(
          (acc: any, curr: any) => {
            acc.id = "merged";
            acc.critical += curr.critical;
            acc.high += curr.high;
            acc.medium += curr.medium;
            acc.low += curr.low;
            acc.none += curr.none;
            acc.unknown += curr.unknown;
            acc.total += curr.total;
            return acc;
          },
          {
            id: "",
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            none: 0,
            unknown: 0,
            total: 0,
          } as CveSeverityCount
        );

        setCveCountDetail(mergedCounts);
      } catch (err) {
        console.error("Error fetching CVE counts:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCveCounts();
  }, []);

  // --- Handle active tab from URL ---
  const [activeTab, setActiveTab] = useState(
    () => searchParams.get("tab") || "overview"
  );

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");

    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    } else if (!tabFromUrl) {
      setActiveTab("overview");
      router.replace(`${pathname}?tab=overview`);
    }
  }, [searchParams, activeTab, pathname, router]);

  // --- Navigation handlers ---
  const handleChartBarClick = (min: number, max: number) => {
    router.push(
      `/by-cvss?min=${min.toFixed(1)}&max=${max.toFixed(1)}&tab=list`
    );
  };

  const handleViewDetails = (cveId: string) => {
    router.push(`/cve/${cveId}`);
  };

  const navigateTo = (path: string) => {
    router.push(path);
  };

  // --- Extract statistics from fetched data ---
  const totalCves = cveCountDetail.total;
  const criticalCves = cveCountDetail.critical;
  const highCves = cveCountDetail.high;
  const mediumCves = cveCountDetail.medium;
  const lowCves = cveCountDetail.low;
  const unknownCves = cveCountDetail.unknown;

  return (
    <div className="w-full min-h-screen relative">
      {/* Gradient Background */}
      <Background />

      <div className="relative z-10">
        <DashboardHeader />

        <div className="p-4 md:p-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {isLoading ? (
              Array(5)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="glassmorphism-card h-32 flex items-center justify-center rounded-2xl"
                  >
                    <Loader2 className="h-8 w-8 animate-spin dark:text-white text-purple-500" />
                  </div>
                ))
            ) : (
              <>
                <StatCard
                  title="Total CVEs"
                  value={totalCves ?? 0}
                  description="Tracked vulnerabilities"
                  color="purple"
                  linkTo="/database"
                />
                <StatCard
                  title="Critical CVEs"
                  value={criticalCves || 0}
                  description={`${totalCves > 0 ? ((criticalCves / totalCves) * 100).toFixed(1) : "0"}% of total`}
                  color="red"
                  linkTo="/by-cvss?min=9.0&max=10.0&tab=list"
                  cvssRange="9.0-10.0"
                />
                <StatCard
                  title="High CVEs"
                  value={highCves || 0}
                  description={`${totalCves > 0 ? ((highCves / totalCves) * 100).toFixed(1) : "0"}% of total`}
                  color="amber"
                  linkTo="/by-cvss?min=7.0&max=8.9&tab=list"
                  cvssRange="7.0-8.9"
                />
                <StatCard
                  title="Medium CVEs"
                  value={mediumCves || 0}
                  description={`${totalCves > 0 ? ((mediumCves / totalCves) * 100).toFixed(1) : "0"}% of total`}
                  color="green"
                  linkTo="/by-cvss?min=4.0&max=6.9&tab=list"
                  cvssRange="4.0-6.9"
                />
                <StatCard
                  title="Low CVEs"
                  value={lowCves || 0}
                  description={`${totalCves > 0 ? ((lowCves / totalCves) * 100).toFixed(1) : "0"}% of total`}
                  color="blue"
                  linkTo="/by-cvss?min=0.1&max=3.9&tab=list"
                  cvssRange="0.1-3.9"
                />
              </>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} className="w-full">
            <div className="mb-4 p-1 border rounded-xl inline-flex flex-wrap transition-colors duration-150 h-auto bg-[#111113] border-white/[0.07]">
              <TabsList className="bg-transparent border-none flex flex-wrap gap-1.5 h-auto text-[#8A8A93]">
                {["overview", "cves", "trends", "patched"].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    onClick={() => {
                      router.push(`/dashboard?tab=${tab}`);
                    }}
                    className="flex-1 sm:flex-auto flex items-center justify-center px-3.5 py-1.5 rounded-lg text-xs font-medium border-none transition-all duration-150 text-[#8A8A93] hover:text-white data-[state=active]:bg-white data-[state=active]:text-[#0A0A0B] data-[state=active]:font-semibold shadow-none"
                  >
                    {tab === "overview"
                      ? "Overview"
                      : tab === "cves"
                      ? "Random 10"
                      : tab === "trends"
                      ? "Trends & Forecasting"
                      : "Patched"}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* AI Vulnerability Detection Quick Launch Banner */}
              <div className="p-5 rounded-2xl border border-white/[0.07] bg-[#111113] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center shrink-0">
                    <ShieldAlert className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
                        AI Neural Engine
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-medium">
                        CodeBERT Active
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-white mt-0.5">
                      Line-Level AI Vulnerability Scanner &amp; CVE Mapper
                    </h3>
                    <p className="text-xs text-[#8A8A93] mt-1 max-w-2xl leading-relaxed">
                      Inspect C/C++ code with multi-head attention heatmaps, pinpoint vulnerable lines with CodeBERT, and map code signatures to PostgreSQL CVE benchmark records with remediation patches.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => navigateTo("/linevul")}
                  className="bg-white hover:bg-[#EAEAEA] active:bg-[#DFDFDF] text-[#0A0A0B] font-semibold text-xs rounded-xl px-4 h-9 shadow-sm shrink-0 transition-all duration-150"
                >
                  Launch AI Inspector
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border overflow-hidden rounded-2xl transition-colors duration-150 bg-[#111113] border-white/[0.07] shadow-none">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                      <CardTitle className="text-sm font-semibold text-white">
                        Vulnerability by Type
                      </CardTitle>
                      <CardDescription className="text-xs text-[#8A8A93]">
                        Distribution of Vulnerabilities by Type
                      </CardDescription>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs rounded-lg flex items-center hover:bg-white/[0.06] text-[#8A8A93] hover:text-white border border-white/[0.07] h-7 px-2.5 transition-colors"
                      onClick={() => navigateTo("/by-type")}
                    >
                      <span className="hidden sm:inline">View All</span>
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </CardHeader>

                  <CardContent className="pt-0 w-full text-gray-900 dark:text-white">
                    <div
                      className="
            w-full 
            h-[550px] 
            md:h-[500px] 
            lg:h-[500px] 
            sm:w-full 
            sm:max-w-full 
            sm:overflow-hidden 
            max-sm:w-full 
            max-sm:h-[calc(100vh-170px)] 
            max-sm:flex 
            max-sm:items-center 
            max-sm:justify-center
          "
                    >
                      <VulnerabilityTypeDonut isInteractive />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border overflow-hidden rounded-2xl transition-colors duration-150 bg-[#111113] border-white/[0.07] shadow-none">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                      <CardTitle className="text-sm font-semibold text-white">
                        CVSS Score Distribution
                      </CardTitle>
                      <CardDescription className="text-xs text-[#8A8A93]">
                        Distribution of Vulnerabilities by CVSS score
                      </CardDescription>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs rounded-lg flex items-center hover:bg-white/[0.06] text-[#8A8A93] hover:text-white border border-white/[0.07] h-7 px-2.5 transition-colors"
                      onClick={() => navigateTo("/by-cvss")}
                    >
                      <span className="hidden sm:inline">View All</span>
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </CardHeader>

                  <CardContent className="pt-0 w-full text-gray-900 dark:text-white">
                    <div
                      className="
        w-full
        h-[500px]
        md:h-[500px]
        lg:h-[500px]
        sm:w-full
        sm:max-w-full
        sm:overflow-hidden
        max-sm:w-full
        max-sm:h-[calc(100vh-180px)]
        max-sm:flex
        max-sm:items-center
        max-sm:justify-center
      "
                    >
                      <CvssDistributionChart
                        isInteractive
                        onBarClick={handleChartBarClick}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Vendor Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                <Card className="border overflow-hidden rounded-2xl transition-colors duration-300 w-full bg-white dark:bg-[hsl(var(--dashboard-card-bg))] border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                      <CardTitle className="text-gray-900 dark:text-white">
                        Vulnerability by Vendor
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-white/70">
                        Distribution of Vulnerabilities by Vendor
                      </CardDescription>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs rounded-lg flex items-center hover:bg-white/[0.06] text-[#8A8A93] hover:text-white border border-white/[0.07] h-7 px-2.5 transition-colors"
                      onClick={() => navigateTo("/by-vendor")}
                    >
                      <span className="hidden sm:inline">View All</span>
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </CardHeader>

                  <CardContent className="pt-10 w-full text-gray-900 dark:text-white">
                    <div
                      className="
        w-full 
        h-[500px] 
        md:h-[500px] 
        lg:h-[500px] 
        sm:w-full 
        sm:max-w-full 
        sm:overflow-hidden 
        max-sm:w-full 
        max-sm:h-[calc(100vh-180px)] 
        max-sm:flex 
        max-sm:items-center 
        max-sm:justify-center
      "
                    >
                      <VendorBarChart isInteractive height={400} />
                    </div>
                  </CardContent>
                </Card>
              </div>
              {/* EPSS Chart */}
              <Card className="border overflow-hidden rounded-2xl transition-colors duration-300 w-full bg-white dark:bg-[hsl(var(--dashboard-card-bg))] border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-gray-900 dark:text-white">
                      EPSS Score Distribution
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-white/70">
                      Distribution of Vulnerabilities by Exploit Prediction
                      Scoring System
                    </CardDescription>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs rounded-lg flex items-center hover:bg-white/[0.06] text-[#8A8A93] hover:text-white border border-white/[0.07] h-7 px-2.5 transition-colors"
                    onClick={() => navigateTo("/by-epss")}
                  >
                    <span className="hidden sm:inline">View All</span>
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </CardHeader>

                <CardContent className="pt-0 h-[550px] text-gray-900 dark:text-white">
                  <RadarChartEpss isInteractive height={450} />
                </CardContent>
              </Card>

              {/* Assigners Chart */}
              <Card className="border overflow-hidden rounded-2xl transition-colors duration-300 w-full bg-white dark:bg-[hsl(var(--dashboard-card-bg))] border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-gray-900 dark:text-white">
                      Vulnerability by Assigners
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-white/70">
                      Distribution of Vulnerabilities by Assigning Organizations
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs rounded-lg flex items-center hover:bg-white/[0.06] text-[#8A8A93] hover:text-white border border-white/[0.07] h-7 px-2.5 transition-colors"
                    onClick={() => navigateTo("/by-assigner")}
                  >
                    <span className="hidden sm:inline">View All</span>
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </CardHeader>

                <CardContent className="pt-10 h-[500px] text-gray-900 dark:text-white">
                  <AssignerBarChart isInteractive height={400} />
                </CardContent>
              </Card>

              {/* Product Treemap */}
              <Card className="border overflow-hidden rounded-2xl transition-colors duration-300 w-full bg-white dark:bg-[hsl(var(--dashboard-card-bg))] border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1 pl-5">
                    <CardTitle className="text-gray-900 dark:text-white">
                      Vulnerability by Product
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-white/70">
                      Distribution of Vulnerabilities by Product
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs rounded-lg flex items-center hover:bg-white/[0.06] text-[#8A8A93] hover:text-white border border-white/[0.07] h-7 px-2.5 transition-colors"
                    onClick={() => navigateTo("/by-product")}
                  >
                    <span className="hidden sm:inline">View All</span>
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-10 h-[500px] text-gray-900 dark:text-white">
                  <ProductTreemap isInteractive height={400} standalone />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Random 10 CVEs */}
            <TabsContent value="cves">
              <Card className="rounded-2xl overflow-hidden transition-colors duration-300 bg-white dark:bg-[hsl(var(--dashboard-card-bg))] border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none border">
                <CardHeader className="px-6 md:px-14 pb-0 pt-8">
                  <CardTitle className="text-gray-900 dark:text-white">
                    Random 10 CVE Records
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-white/70">
                    The 10 Random CVE Records from the database.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 md:p-6">
                  <CveList onSelectCve={handleViewDetails} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Trends & Forecasting */}
            <TabsContent value="trends" className="space-y-6">
              {[
                {
                  title: "Vulnerability Trends (1999-2025)",
                  desc: "Year-Over-Year Vulnerability Trends",
                  chart: <TrendLineChart height={400} />,
                  route: "/by-date",
                  height: 450,
                },
                {
                  title: "Severity Trends Over Time",
                  desc: "Distribution of Vulnerabilities by Monthly Severity",
                  chart: <SeverityChart height={400} />,
                  route: "/by-date",
                  height: 400,
                },
                {
                  title: "Vulnerability Heatmap",
                  desc: "Temporal distribution of vulnerabilities for last 12 months",
                  chart: <VulnerabilityHeatmap height={400} />,
                  route: "/by-date",
                  height: 550,
                },
              ].map((card, idx) => (
                <Card
                  key={idx}
                  className="rounded-2xl overflow-hidden transition-colors duration-300 bg-white dark:bg-[hsl(var(--dashboard-card-bg))] border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none border"
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-8">
                    <div className="space-y-1 pl-5">
                      <CardTitle className="text-gray-900 dark:text-white">
                        {card.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-white/70">
                        {card.desc}
                      </CardDescription>
                    </div>

                    {/* Responsive Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl px-3 py-1 flex items-center justify-center bg-purple-400 dark:bg-[hsl(var(--dashboard-button-bg))] hover:bg-purple-500 dark:hover:bg-white/10 text-black dark:text-white"
                      onClick={() => navigateTo(card.route)}
                    >
                      {/* Mobile: only arrow */}
                      <ArrowRight className="h-4 w-4 md:hidden" />

                      {/* md and above: text + arrow */}
                      <span className="hidden md:flex items-center gap-1">
                        View All <ArrowRight className="h-3 w-3" />
                      </span>
                    </Button>
                  </CardHeader>

                  <CardContent className="p-0" style={{ height: `${card.height}px` }}>
                    {card.chart}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Patched CVEs */}
            <TabsContent value="patched" className="space-y-6">
              <Card className="rounded-2xl overflow-hidden transition-colors duration-300 bg-white dark:bg-[hsl(var(--dashboard-card-bg))] border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none border">
                <CardHeader className="px-4 md:px-12 py-6">
                  <CardTitle className="text-gray-900 dark:text-white">
                    Patched CVEs
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-white/70">
                    CVEs which have been patched. Click on a CVE to view.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PaginatedCveList
                    endpointType="patched"
                    onSelectCve={handleViewDetails}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
