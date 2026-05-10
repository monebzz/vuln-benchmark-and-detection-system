"use client";

import React, { useState, useEffect, use } from "react";
import { useTheme } from "next-themes";
import Background from "@/components/background";
import { DashboardHeader } from "@/components/dashboard-header";
import { getGithubPatchDataByCveAndPatch } from "@/lib/cveGithubData";
import { extractFormattedDiff } from "@/context/format-single-diff";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import LoaderScreen from "@/app/loading";
import { useRouter } from "next/navigation";
import { fetchGithubFunctions } from "@/lib/github_function";
import Link from "next/link";

export default function PatchDetailView({
  params,
}: {
  params: Promise<{ id: string; patchId: string }>;
}) {
  const { id, patchId } = use(params);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [githubFiles, setGithubFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [hunkFileStates, setHunkFileStates] = useState<{
    [key: number]: {
      vulFileContent: string | null;
      nonVulFileContent: string | null;
      vulFuncContent: string | null;
      nonVulFuncContent: string | null;
      vulLoading: boolean;
      nonVulLoading: boolean;
      vulFuncLoading: boolean;
      nonVulFuncLoading: boolean;
    };
  }>({});

  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const url = `/api/github-detail/by-cve-patch?cveId=${encodeURIComponent(id)}&patchId=${encodeURIComponent(patchId)}`;
        const res = await fetch(url, { cache: "force-cache" });
        if (!res.ok) {
          setGithubFiles([]);
        } else {
          const data = await res.json();
          setGithubFiles(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        setGithubFiles([]);
      }
      setLoading(false);
    }
    loadData();
  }, [id, patchId]);

  const renderDiffContent = (content: string) => {
    const lines = content.split(/\r?\n/);
    return lines.map((line, i) => {
      const trimmed = line.trim();
      let colorClass = isDark ? "text-white" : "text-black";
      if (trimmed.startsWith("---") || trimmed.startsWith("+++"))
        colorClass = "text-blue-400";
      else if (trimmed.startsWith("@@")) colorClass = "text-blue-400";
      else if (trimmed.startsWith("-")) colorClass = "text-red-400";
      else if (trimmed.startsWith("+")) colorClass = "text-green-400";

      return (
        <div
          key={i}
          className={`whitespace-pre-wrap break-words overflow-x-auto ${colorClass}`}
        >
          <span className="text-xs text-gray-400">{i + 1} |</span>
          <span className="text-sm"> {line}</span>
        </div>
      );
    });
  };

  const extractDiffLines = (content: string) => {
    const lines = content.split(/\r?\n/);
    const removedLines: string[] = [];
    const addedLines: string[] = [];

    lines.forEach((line) => {
      if (line.startsWith("-") && !line.startsWith("---"))
        removedLines.push(line.slice(1).trim());
      else if (line.startsWith("+") && !line.startsWith("+++"))
        addedLines.push(line.slice(1).trim());
    });

    return { removedLines, addedLines };
  };

  const handleFetchFile = async (
    hunkIndex: number,
    hunk: any,
    type: "vulnerable_function" | "nonvulnerable_function",
    isFunction: boolean
  ) => {
    const originalFileName = hunk?.fileName ?? "";
    if (!originalFileName) return;

    const extensionMatch = hunk?.fileContent?.match(
      /File:\s*.+(\.[a-zA-Z0-9]+)\s*$/m
    );
    const fileExtension = extensionMatch ? extensionMatch[1] : "";
    const fileName = fileExtension
      ? originalFileName.replace(/\.[a-zA-Z0-9]+$/, fileExtension)
      : originalFileName;

    const cveId =
      hunk?.fileContent?.match(/CVE:\s*(CVE-\d{4}-\d+)/i)?.[1]?.trim() ?? id;

    const loadingKey = isFunction
      ? type === "vulnerable_function"
        ? "vulFuncLoading"
        : "nonVulFuncLoading"
      : type === "vulnerable_function"
      ? "vulLoading"
      : "nonVulLoading";

    setHunkFileStates((prev) => ({
      ...prev,
      [hunkIndex]: {
        ...(prev[hunkIndex] || {}),
        [loadingKey]: true,
      },
    }));

    try {
      const url = `/api/github-detail/function?type=${encodeURIComponent(type)}&cveId=${encodeURIComponent(cveId)}&patchId=${encodeURIComponent(patchId)}&fileName=${encodeURIComponent(fileName)}`;
      const res = await fetch(url, { cache: "force-cache" });
      let content = "";
      if (res.ok) {
        const data = await res.json();
        content = data.content || "";
      }
      const contentKey = isFunction
        ? type === "vulnerable_function"
          ? "vulFuncContent"
          : "nonVulFuncContent"
        : type === "vulnerable_function"
        ? "vulFileContent"
        : "nonVulFileContent";

      setHunkFileStates((prev) => ({
        ...prev,
        [hunkIndex]: {
          ...(prev[hunkIndex] || {}),
          [contentKey]: content,
          [loadingKey]: false,
        },
      }));
    } catch (err) {
      console.error(err);
      setHunkFileStates((prev) => ({
        ...prev,
        [hunkIndex]: {
          ...(prev[hunkIndex] || {}),
          [loadingKey]: false,
        },
      }));
    }
  };

  const cardBg = isDark
    ? "bg-[#1e1e1e]/80 backdrop-blur-sm border-gray-700 text-[#d4d4d4]"
    : "bg-white/80 backdrop-blur-sm border-gray-200 text-gray-700";
  const diffBg = isDark
    ? "bg-gray-800 border-purple-800"
    : "bg-gray-100 border-purple-700";
  const buttonBg = isDark
    ? "bg-purple-800 hover:bg-purple-700 text-white"
    : "bg-purple-400 hover:bg-purple-500 text-black";

  if (loading) return <LoadingView isDark={isDark} />;
  if (!githubFiles.length)
    return <NoDataView isDark={isDark} message="No files found." />;

  // Only keep hunks
  const hunkFiles = githubFiles.filter((f: any) =>
    f.fileName.toLowerCase().startsWith("hunk")
  );
  if (!hunkFiles.length)
    return <NoDataView isDark={isDark} message="No hunks available." />;

  return (
    <>
      <Background />
      <div className="relative z-10 w-full">
        <DashboardHeader />
        <div className={`m-4 p-0 rounded-xl mx-8`}>
          <Button
            variant="outline"
            size="sm"
            className={`mt-4 rounded-xl ${buttonBg}`}
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        </div>

        <div className={`m-4 p-6 rounded-xl border ${cardBg} mx-8`}>
          <h2 className="text-xl font-semibold mb-6 text-purple-500">
            {id} / {patchId}
          </h2>

          <div className="space-y-6 w-full">
            {hunkFiles.map((hunk: any, idx: number) => {
              const hunkState = hunkFileStates[idx] || {};
              const statusMatch = hunk?.fileContent?.match(/Status:\s*(.+)$/m);
              const typeMatch = hunk?.fileContent?.match(/Type:\s*(.+)$/m);
              const match = hunk?.fileContent?.match(/File:\s*(.+)$/m);
              const fileName = match ? match[1].trim() : null;
              const extension = fileName.includes(".")
                ? fileName.substring(fileName.lastIndexOf(".") + 1)
                : "";

              const handleDownload = () => {
                const element = document.createElement("a");
                const file = new Blob([hunk.fileContent || ""], {
                  type: "application/rtf",
                });
                element.href = URL.createObjectURL(file);
                element.download = hunk.fileName || "diff.rtf";
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
              };

              const { removedLines, addedLines } = extractDiffLines(
                hunk.fileContent || ""
              );

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border ${cardBg} h-full flex flex-col w-full`}
                >
                  <div className="flex flex-row items-start justify-between w-full">
                    <h3 className="mb-3 font-semibold text-purple-400">{`Patch ${
                      idx + 1
                    }`}</h3>
                    {statusMatch || typeMatch ? null : (
                      <div className="mb-4 flex gap-2 flex-wrap justify-end">
                        <button
                          onClick={() =>
                            handleFetchFile(
                              idx,
                              hunk,
                              "vulnerable_function",
                              false
                            )
                          }
                          disabled={hunkState.vulLoading}
                          className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-xs text-white transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          {hunkState.vulLoading
                            ? "Loading…"
                            : "Load Vulnerable Function"}
                        </button>
                        <button
                          onClick={() =>
                            handleFetchFile(
                              idx,
                              hunk,
                              "nonvulnerable_function",
                              false
                            )
                          }
                          disabled={hunkState.nonVulLoading}
                          className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-xs text-white transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          {hunkState.nonVulLoading
                            ? "Loading…"
                            : "Load Non-Vulnerable Function"}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-between items-start gap-1 mb-4 w-full">
                    <div className="px-3 text-sm text-blue-500 w-full">
                      <span className="text-white">Vulnerable File: </span>
                      <Link
                        href={`/cve/${id}/github/patch/${patchId}/vulnerable-file/${fileName}`}
                      >
                        {fileName}
                      </Link>
                    </div>
                    <div className="px-3 text-sm text-blue-500 w-full">
                      <span className="text-white">Non-Vulnerable File: </span>
                      <Link
                        href={`/cve/${id}/patch/${patchId}/non-vulnerable-file/${fileName}`}
                      >
                        {fileName}
                      </Link>
                    </div>
                  </div>

                  {/* Hunk Diff */}
                  <div
                    className={`rounded-xl p-4 h-auto ${diffBg} font-mono text-xs max-h-200 mb-4 w-full overflow-x-auto`}
                  >
                    <div className="flex justify-end items-start mb-0">
                      <Button
                        onClick={handleDownload}
                        className="px-1 py-1 h-70 w-70 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <Download size={16} />
                      </Button>
                    </div>
                    <div className="-mt-3">
                      {renderDiffContent(
                        extractFormattedDiff(hunk.fileContent || "")
                      )}
                    </div>
                  </div>

                  {hunkState.vulFileContent && (
                    <ContentBlock
                      extension={extension}
                      title="Vulnerable Function"
                      content={hunkState.vulFileContent}
                      diffBg={diffBg}
                      lines={removedLines}
                      type="vulnerable"
                    />
                  )}
                  {hunkState.nonVulFileContent && (
                    <ContentBlock
                      extension={extension}
                      title="Non-Vulnerable Function"
                      content={hunkState.nonVulFileContent}
                      diffBg={diffBg}
                      lines={addedLines}
                      type="nonvulnerable"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );

  function ContentBlock({
    title,
    content,
    diffBg,
    lines,
    type,
    extension,
  }: any) {
    const renderFunctionContent = () => {
      const contentLines = content.split(/\r?\n/);
      return contentLines.map((line: string, i: number) => {
        let colorClass = isDark ? "text-white" : "text-black";
        if (line.startsWith("---") || line.startsWith("+++"))
          colorClass = "text-blue-400";
        else if (line.startsWith("@@")) colorClass = "text-blue-400";
        else if (line.startsWith("-")) colorClass = "text-red-400";
        else if (line.startsWith("+")) colorClass = "text-green-400";

        const cleanLine =
          line.startsWith("-") || line.startsWith("+")
            ? line.slice(1).trim()
            : line.trim();
        if (lines.includes(cleanLine))
          colorClass =
            type === "vulnerable" ? "text-red-400" : "text-green-400";

        return (
          <div
            key={i}
            className={`whitespace-pre-wrap break-words overflow-x-auto ${colorClass}`}
          >
            <span className="text-xs text-gray-400">{i + 1} |</span>
            <span className="text-sm"> {line}</span>
          </div>
        );
      });
    };

    const handleDownload = () => {
      const blob = new Blob([content], { type: "text/plain" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${title.replace(/\s+/g, "_")}.${extension}`;
      a.click();
    };

    return (
      <div className="mb-4 h-full flex flex-col w-full">
        <div className="flex flex-row justify-between items-start">
          <h4
            className={`mb-2 text-md font-semibold ${
              type === "vulnerable" ? "text-red-400" : "text-green-400"
            }`}
          >
            {title}
          </h4>
          <Button
            onClick={handleDownload}
            className="px-1 py-1 h-70 w-70 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Download size={16} />
          </Button>
        </div>
        <div
          className={`rounded-xl p-4 ${diffBg} font-mono text-sm max-h-500 w-full overflow-x-auto`}
        >
          {renderFunctionContent()}
        </div>
      </div>
    );
  }
}

function LoadingView({ isDark }: { isDark: boolean }) {
  return (
    <div className={`min-h-screen flex flex-col`}>
      <Background />
      <DashboardHeader />
      <LoaderScreen />
    </div>
  );
}

function NoDataView({ isDark, message }: { isDark: boolean; message: string }) {
  return (
    <div
      className={`m-4 p-6 rounded-xl border ${
        isDark ? "bg-[#1e1e1e] text-white" : "bg-white text-gray-800"
      }`}
    >
      {message}
    </div>
  );
}
