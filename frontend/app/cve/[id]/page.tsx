"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CveDetailView } from "@/components/cve-detail-view";
import { DashboardHeader } from "@/components/dashboard-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { CveFullData } from "@/types/cveFullData";
// import { getCveFullDataById } from "@/lib/cveFullData";
// import { getCveKernalDataById } from "@/lib/cveKernelData";
// import { getGithubDataWithShaDetails } from "@/lib/cveGithubData";
import { KernelDetailView } from "@/components/kernel-detail-view";
import { CveGithubData } from "@/types/cveGithubDetails";
import { GithubDetailView } from "@/components/github-detail-view";
import { useTheme } from "next-themes";
import Background from "@/components/background";

import LoaderScreen from "@/app/loading";
import { Sparkles } from "lucide-react";
// (moved inside the component)

export default function CveDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [cveId, setCveId] = useState<string | null>(null);
  const [cveData, setCveData] = useState<CveFullData | null>(null);
  const [kernalData, setKernalData] = useState<any | null>(null);
  const [githubData, setGithubData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AI Generation state and handler
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const aiResultRef = useRef<HTMLDivElement | null>(null);
  // Handler for AI Generation
  async function handleAIGenerate() {
    if (!cveData) return;
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    try {
      const res = await fetch("/api/get_ai_analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cveData,
        }),
      });
      if (!res.ok) throw new Error("AI generation failed");
      const data = await res.json();
      setAiResult(data);
    } catch (err: any) {
      setAiError(err.message || "AI generation failed");
    } finally {
      setAiLoading(false);
    }
  }

  useEffect(() => {
    if (aiResult && aiResultRef.current) {
      aiResultRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [aiResult]);

  useEffect(() => {
    if (params.id) {
      const cveId = Array.isArray(params.id) ? params.id[0] : params.id;
      setLoading(true);
      setError(null);

      const fetchData = async () => {
        try {
          // Fetch CVE detail
          const cveRes = await fetch(
            `/api/cve-detail?id=${encodeURIComponent(cveId)}`,
            { cache: "no-store" }
          );
          if (!cveRes.ok) throw new Error(`CVE ${cveId} not found`);
          const cve = await cveRes.json();

          // Fetch Kernel detail
          let kernal = null;
          try {
            const kernalRes = await fetch(
              `/api/kernel-detail/by-cve?cveId=${encodeURIComponent(cveId)}`,
              { cache: "no-store" }
            );
            if (kernalRes.ok) {
              kernal = await kernalRes.json();
            }
          } catch {}

          // Fetch Github detail
          let github = null;
          try {
            const githubRes = await fetch(
              `/api/github-detail/by-cve?cveId=${encodeURIComponent(cveId)}`,
              { cache: "no-store" }
            );
            if (githubRes.ok) {
              github = await githubRes.json();
            }
          } catch {}

          setCveData(cve);
          setKernalData(kernal);
          setCveId(cveId);
          setGithubData(github);
        } catch (err) {
          console.error("Error fetching CVE/kernel/github data:", err);
          setError(
            err instanceof Error ? err.message : "An unknown error occurred"
          );
          setCveData(null);
          setKernalData(null);
          setGithubData(null);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [params.id]);

  // Theme classes
  const pageBg = isDark
    ? "[background:linear-gradient(to_bottom_right,_rgb(23,35,50)_75%,_rgb(76,29,109)_75%)]"
    : "bg-[rgb(243,244,246)]";
  const buttonBg = isDark
    ? "bg-purple-800 hover:bg-purple-700 text-white"
    : "bg-purple-400 hover:bg-purple-500 text-black"; // text black for light theme
  const cardBg = isDark
    ? "bg-[rgb(29,41,56)] border border-white/10"
    : "bg-white border border-gray-200";
  const tabBg = isDark
    ? "bg-[rgb(29,41,56)] border border-white/10"
    : "bg-white border border-gray-200";
  const tabActiveBg = isDark ? "bg-[rgb(86,27,121)]" : "bg-purple-400"; // subtle bg for active light theme
  const tabTextColor = isDark ? "text-white" : "text-black"; // always black/light theme
  const textColor = isDark ? "text-white" : "text-gray-900";
  const secondaryText = isDark ? "text-gray-300" : "text-gray-700";

  return (
    <div className={`w-full min-h-screen relative overflow-hidden ${pageBg}`}>
      <Background />
      <div className="relative z-10 flex flex-col min-h-screen">
        <DashboardHeader />
        <div className="p-4 md:p-8">
          {/* Back Button and AI Button Row */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              className={`rounded-xl ${buttonBg}`}
              onClick={() => router.back()}
            >
              <ArrowLeft className={`h-4 w-4 mr-2 ${tabTextColor}`} />
              <span className={tabTextColor}>Back</span>
            </Button>
          </div>
          {/* Main content */}
          {/* ...existing main content rendering logic here... */}
          {loading ? (
            <LoaderScreen />
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-[500px] text-destructive">
              <ArrowLeft className="h-12 w-12 mb-4" />
              <p>{error}</p>
              <Button
                variant="outline"
                size="sm"
                className={`mt-4 rounded-xl ${buttonBg}`}
                onClick={() => router.back()}
              >
                Go Back
              </Button>
            </div>
          ) : cveData ? (
            kernalData || githubData ? (
              <Tabs defaultValue="overview" className="w-full mt-4">
                <div className="flex justify-between items-center">
                  <div className={`mb-4 p-1 ${tabBg} rounded-2xl inline-flex`}>
                    <TabsList className="bg-transparent border-none flex gap-2">
                      <TabsTrigger
                        value="overview"
                        className="flex items-center justify-center px-4 py-2 rounded-xl text-sm border-none transition-colors duration-200 text-gray-700 dark:text-white/70 data-[state=active]:bg-purple-400 dark:data-[state=active]:bg-[rgb(86,27,121)] data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
                      >
                        Details
                      </TabsTrigger>
                      {kernalData && (
                        <TabsTrigger
                          value="kernal"
                          className="flex items-center justify-center px-4 py-2 rounded-xl text-sm border-none transition-colors duration-200 text-gray-700 dark:text-white/70 data-[state=active]:bg-purple-400 dark:data-[state=active]:bg-[rgb(86,27,121)] data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
                        >
                          Kernel Data
                        </TabsTrigger>
                      )}
                      {githubData && (
                        <TabsTrigger
                          value="github"
                          className="flex items-center justify-center px-4 py-2 rounded-xl text-sm border-none transition-colors duration-200 text-gray-700 dark:text-white/70 data-[state=active]:bg-purple-400 dark:data-[state=active]:bg-[rgb(86,27,121)] data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
                        >
                          GitHub Data
                        </TabsTrigger>
                      )}
                    </TabsList>
                  </div>
                </div>

                <TabsContent value="overview" className="space-y-6">
                  <CveDetailView cveData={cveData} />
                </TabsContent>
                {kernalData && (
                  <TabsContent value="kernal" className="space-y-6">
                    <KernelDetailView kernalData={kernalData} cveid={cveId} />
                  </TabsContent>
                )}
                {githubData && (
                  <TabsContent value="github" className="space-y-6">
                    <GithubDetailView githubData={githubData} />
                  </TabsContent>
                )}
              </Tabs>
            ) : (
              <CveDetailView cveData={cveData} />
            )
          ) : (
            <div
              className={`flex items-center justify-center h-[500px] ${secondaryText}`}
            >
              <p>CVE not found</p>
            </div>
          )}
        </div>
        {/* AI Generation Result at the bottom */}
        {aiResult && (
          <div
            className="w-full px-4 md:px-8 pb-8"
            id="ai-result"
            ref={aiResultRef}
          >
            <div className={`${cardBg} rounded-2xl p-6 shadow-lg`}>
              <h2 className="text-2xl font-bold mb-4 text-purple-700 dark:text-purple-300">
                AI Analytics
              </h2>
              {aiError && (
                <div className="text-destructive mb-4">{aiError}</div>
              )}
              {typeof aiResult === "object" ? (
                <div>
                  {aiResult.summary && (
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-purple-700 dark:text-purple-300 mb-1">
                        Summary
                      </h3>
                      <div className="text-base text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {aiResult.summary}
                      </div>
                    </div>
                  )}
                  {aiResult.riskLevel && (
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-purple-700 dark:text-purple-300 mb-1">
                        Risk Level
                      </h3>
                      <div className="text-base text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {aiResult.riskLevel}
                      </div>
                    </div>
                  )}
                  {aiResult.technicalImpact && (
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-purple-700 dark:text-purple-300 mb-1">
                        Technical Impact
                      </h3>
                      <div className="text-base text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {aiResult.technicalImpact}
                      </div>
                    </div>
                  )}
                  {aiResult.exploitabilityAnalysis && (
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-purple-700 dark:text-purple-300 mb-1">
                        Exploitability Analysis
                      </h3>
                      <div className="text-base text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {aiResult.exploitabilityAnalysis}
                      </div>
                    </div>
                  )}
                  {aiResult.affectedSystems &&
                    Array.isArray(aiResult.affectedSystems) && (
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-purple-700 dark:text-purple-300 mb-1">
                          Affected Systems
                        </h3>
                        <ul className="list-disc pl-6 text-base text-gray-800 dark:text-gray-200">
                          {aiResult.affectedSystems.map(
                            (item: string, idx: number) => (
                              <li key={idx}>{item}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  {aiResult.attackVectors &&
                    Array.isArray(aiResult.attackVectors) && (
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-purple-700 dark:text-purple-300 mb-1">
                          Attack Vectors
                        </h3>
                        <ul className="list-disc pl-6 text-base text-gray-800 dark:text-gray-200">
                          {aiResult.attackVectors.map(
                            (item: string, idx: number) => (
                              <li key={idx}>{item}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  {aiResult.topWeaknesses &&
                    Array.isArray(aiResult.topWeaknesses) && (
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-purple-700 dark:text-purple-300 mb-1">
                          Top Weaknesses
                        </h3>
                        <ul className="list-disc pl-6 text-base text-gray-800 dark:text-gray-200">
                          {aiResult.topWeaknesses.map(
                            (item: string, idx: number) => (
                              <li key={idx}>{item}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  {aiResult.recommendedActions &&
                    Array.isArray(aiResult.recommendedActions) && (
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-purple-700 dark:text-purple-300 mb-1">
                          Recommended Actions
                        </h3>
                        <ul className="list-disc pl-6 text-base text-gray-800 dark:text-gray-200">
                          {aiResult.recommendedActions.map(
                            (item: string, idx: number) => (
                              <li key={idx}>{item}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  {aiResult.longTermStrategy && (
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-purple-700 dark:text-purple-300 mb-1">
                        Long Term Strategy
                      </h3>
                      <div className="text-base text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {aiResult.longTermStrategy}
                      </div>
                    </div>
                  )}
                  {/* Render any other fields not covered above */}
                  {Object.entries(aiResult).map(([key, value]) => {
                    const shown = [
                      "summary",
                      "riskLevel",
                      "technicalImpact",
                      "exploitabilityAnalysis",
                      "affectedSystems",
                      "attackVectors",
                      "topWeaknesses",
                      "recommendedActions",
                      "longTermStrategy",
                      "confidenceScore",
                    ];
                    if (shown.includes(key)) return null;
                    return (
                      <div key={key} className="mb-4">
                        <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-300 mb-1 capitalize">
                          {key.replace(/_/g, " ")}
                        </h3>
                        {typeof value === "string" ? (
                          <div className="whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200 text-base">
                            {value}
                          </div>
                        ) : (
                          <pre className="whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200 text-base">
                            {JSON.stringify(value, null, 2)}
                          </pre>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <pre className="whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200 text-base">
                  {typeof aiResult === "object"
                    ? JSON.stringify(aiResult, null, 2)
                    : aiResult}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
