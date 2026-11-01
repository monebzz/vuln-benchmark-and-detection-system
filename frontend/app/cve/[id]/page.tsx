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
  const pageBg = "bg-[#0A0A0B]";
  const buttonBg = "bg-[#151518] hover:bg-white/[0.08] text-[#8A8A93] hover:text-white border border-white/[0.08]";
  const cardBg = "bg-[#111113] border border-white/[0.07]";
  const tabBg = "bg-[#111113] border border-white/[0.07]";
  const tabActiveBg = "bg-white";
  const tabTextColor = "text-white";
  const textColor = "text-white";
  const secondaryText = "text-[#8A8A93]";

  return (
    <div className={`w-full min-h-screen relative overflow-hidden ${pageBg}`}>
      <Background />
      <div className="relative z-10 flex flex-col min-h-screen">
        <DashboardHeader />
        <div className="p-4 md:p-8">
          {/* Back Button */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-xl ${buttonBg}`}
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span>Back</span>
            </Button>
          </div>
          {/* Main content */}
          {loading ? (
            <LoaderScreen />
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-[500px] text-rose-400">
              <ArrowLeft className="h-12 w-12 mb-4" />
              <p>{error}</p>
              <Button
                variant="ghost"
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
                  <div className={`mb-4 p-1 ${tabBg} rounded-xl inline-flex`}>
                    <TabsList className="bg-transparent border-none flex gap-1">
                      <TabsTrigger
                        value="overview"
                        className="flex items-center justify-center px-4 py-1.5 rounded-lg text-sm border-none transition-colors duration-200 text-[#8A8A93] data-[state=active]:bg-white data-[state=active]:text-[#0A0A0B] data-[state=active]:font-semibold"
                      >
                        Details
                      </TabsTrigger>
                      {kernalData && (
                        <TabsTrigger
                          value="kernal"
                          className="flex items-center justify-center px-4 py-1.5 rounded-lg text-sm border-none transition-colors duration-200 text-[#8A8A93] data-[state=active]:bg-white data-[state=active]:text-[#0A0A0B] data-[state=active]:font-semibold"
                        >
                          Kernel Data
                        </TabsTrigger>
                      )}
                      {githubData && (
                        <TabsTrigger
                          value="github"
                          className="flex items-center justify-center px-4 py-1.5 rounded-lg text-sm border-none transition-colors duration-200 text-[#8A8A93] data-[state=active]:bg-white data-[state=active]:text-[#0A0A0B] data-[state=active]:font-semibold"
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
            <div className={`${cardBg} rounded-xl p-6`}>
              <h2 className="text-base font-semibold mb-4 text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-400" />
                AI Analytics
              </h2>
              {aiError && (
                <div className="text-rose-400 text-sm mb-4">{aiError}</div>
              )}
              {typeof aiResult === "object" ? (
                <div className="space-y-5">
                  {aiResult.summary && (
                    <div>
                      <h3 className="text-xs font-mono uppercase tracking-wider text-[#8A8A93] mb-1.5">
                        Summary
                      </h3>
                      <div className="text-sm text-[#E8E8EC] whitespace-pre-wrap leading-relaxed">
                        {aiResult.summary}
                      </div>
                    </div>
                  )}
                  {aiResult.riskLevel && (
                    <div>
                      <h3 className="text-xs font-mono uppercase tracking-wider text-[#8A8A93] mb-1.5">
                        Risk Level
                      </h3>
                      <div className="text-sm text-[#E8E8EC] whitespace-pre-wrap">
                        {aiResult.riskLevel}
                      </div>
                    </div>
                  )}
                  {aiResult.technicalImpact && (
                    <div>
                      <h3 className="text-xs font-mono uppercase tracking-wider text-[#8A8A93] mb-1.5">
                        Technical Impact
                      </h3>
                      <div className="text-sm text-[#E8E8EC] whitespace-pre-wrap leading-relaxed">
                        {aiResult.technicalImpact}
                      </div>
                    </div>
                  )}
                  {aiResult.exploitabilityAnalysis && (
                    <div>
                      <h3 className="text-xs font-mono uppercase tracking-wider text-[#8A8A93] mb-1.5">
                        Exploitability Analysis
                      </h3>
                      <div className="text-sm text-[#E8E8EC] whitespace-pre-wrap leading-relaxed">
                        {aiResult.exploitabilityAnalysis}
                      </div>
                    </div>
                  )}
                  {aiResult.affectedSystems &&
                    Array.isArray(aiResult.affectedSystems) && (
                      <div>
                        <h3 className="text-xs font-mono uppercase tracking-wider text-[#8A8A93] mb-1.5">
                          Affected Systems
                        </h3>
                        <ul className="space-y-1">
                          {aiResult.affectedSystems.map(
                            (item: string, idx: number) => (
                              <li key={idx} className="text-sm text-[#E8E8EC] flex items-start gap-2">
                                <span className="text-[#8A8A93] mt-0.5">—</span>
                                {item}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  {aiResult.attackVectors &&
                    Array.isArray(aiResult.attackVectors) && (
                      <div>
                        <h3 className="text-xs font-mono uppercase tracking-wider text-[#8A8A93] mb-1.5">
                          Attack Vectors
                        </h3>
                        <ul className="space-y-1">
                          {aiResult.attackVectors.map(
                            (item: string, idx: number) => (
                              <li key={idx} className="text-sm text-[#E8E8EC] flex items-start gap-2">
                                <span className="text-[#8A8A93] mt-0.5">—</span>
                                {item}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  {aiResult.topWeaknesses &&
                    Array.isArray(aiResult.topWeaknesses) && (
                      <div>
                        <h3 className="text-xs font-mono uppercase tracking-wider text-[#8A8A93] mb-1.5">
                          Top Weaknesses
                        </h3>
                        <ul className="space-y-1">
                          {aiResult.topWeaknesses.map(
                            (item: string, idx: number) => (
                              <li key={idx} className="text-sm text-[#E8E8EC] flex items-start gap-2">
                                <span className="text-[#8A8A93] mt-0.5">—</span>
                                {item}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  {aiResult.recommendedActions &&
                    Array.isArray(aiResult.recommendedActions) && (
                      <div>
                        <h3 className="text-xs font-mono uppercase tracking-wider text-[#8A8A93] mb-1.5">
                          Recommended Actions
                        </h3>
                        <ul className="space-y-1">
                          {aiResult.recommendedActions.map(
                            (item: string, idx: number) => (
                              <li key={idx} className="text-sm text-[#E8E8EC] flex items-start gap-2">
                                <span className="text-violet-400 mt-0.5">→</span>
                                {item}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  {aiResult.longTermStrategy && (
                    <div>
                      <h3 className="text-xs font-mono uppercase tracking-wider text-[#8A8A93] mb-1.5">
                        Long Term Strategy
                      </h3>
                      <div className="text-sm text-[#E8E8EC] whitespace-pre-wrap leading-relaxed">
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
                      <div key={key}>
                        <h3 className="text-xs font-mono uppercase tracking-wider text-[#8A8A93] mb-1.5 capitalize">
                          {key.replace(/_/g, " ")}
                        </h3>
                        {typeof value === "string" ? (
                          <div className="whitespace-pre-wrap break-words text-[#E8E8EC] text-sm leading-relaxed">
                            {value}
                          </div>
                        ) : (
                          <pre className="whitespace-pre-wrap break-words text-[#8A8A93] text-xs font-mono bg-[#0D0D0F] border border-white/[0.06] rounded-lg p-3">
                            {JSON.stringify(value, null, 2)}
                          </pre>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <pre className="whitespace-pre-wrap break-words text-[#E8E8EC] text-sm font-mono bg-[#0D0D0F] border border-white/[0.06] rounded-lg p-3">
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
