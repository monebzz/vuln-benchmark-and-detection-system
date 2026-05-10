"use client";

import React, { use, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Background from "@/components/background";
import { DashboardHeader } from "@/components/dashboard-header";
import { useRouter } from "next/navigation";
import { fetchKernelFiles } from "@/lib/kernel_file";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { fetchGithubFiles } from "@/lib/githubFiles";

interface PageProps {
  params: Promise<{ id: string; patchId: string; fileId: string }>;
}

export default function NonVulnerableFilePage({ params }: PageProps) {
  const { id, patchId, fileId } = use(params);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();

  const underscoreIndex = fileId.indexOf("_");
  const afterUnderscore =
    underscoreIndex !== -1 ? fileId.substring(underscoreIndex + 1) : "";

  const [fileContent, setFileContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFile() {
      setLoading(true);
      try {
        const url = `/api/github-detail/file?type=nonvulnerable_files&cveId=${encodeURIComponent(
          id
        )}&patchId=${encodeURIComponent(patchId)}&fileName=${encodeURIComponent(
          fileId
        )}`;
        const res = await fetch(url, { cache: "force-cache" });
        let content = "";
        if (res.ok) {
          const data = await res.json();
          content = data.content || "";
        }
        setFileContent(content);
      } catch (err) {
        setFileContent("");
      }
      setLoading(false);
    }
    loadFile();
  }, [id, patchId, fileId]);

  // Download file handler
  const handleDownload = () => {
    const blob = new Blob([fileContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = afterUnderscore || "file.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Background />
      <div className="relative z-10 w-full">
        <DashboardHeader />
        <div className="m-4 p-0 rounded-xl mx-8">
          <Button
            onClick={() => router.back()}
            className={`mt-4 rounded-xl px-2  ${
              isDark
                ? "bg-purple-800 hover:bg-purple-700 text-white"
                : "bg-purple-400 hover:bg-purple-500 text-black"
            }`}
          >
            Go Back
          </Button>
        </div>

        <div
          className={`m-4 p-6 rounded-xl border ${
            isDark ? "bg-[#1e1e1e]/80 text-white" : "bg-white/80 text-gray-800"
          } mx-8`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-purple-500">
              Non-Vulnerable File – {afterUnderscore}
            </h2>
            {!loading && (
              <Button
                onClick={handleDownload}
                className={`ml-4 rounded-xl px-2 ${
                  isDark
                    ? "bg-green-700 hover:bg-green-600 text-white"
                    : "bg-green-400 hover:bg-green-500 text-black"
                }`}
              >
                <Download size={16} />
              </Button>
            )}
          </div>

          {loading ? (
            <p>Loading file content…</p>
          ) : (
            <pre
              className={`rounded-xl p-4 font-mono text-sm ${
                isDark ? "bg-gray-800 text-white" : "bg-gray-100 text-black"
              } whitespace-pre-wrap`}
            >
              {fileContent.split("\n").map((line, idx) => (
                <div key={idx}>
                  <span className="text-sm text-gray-400">{idx + 1} |</span>{" "}
                  {line}
                </div>
              ))}
            </pre>
          )}
        </div>
      </div>
    </>
  );
}
