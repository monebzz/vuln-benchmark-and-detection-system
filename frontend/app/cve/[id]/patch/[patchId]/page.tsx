"use client";

import React, { useState, useEffect, use } from "react";
import { useTheme } from "next-themes";
import Background from "@/components/background";
import { DashboardHeader } from "@/components/dashboard-header";
import { getCveKernalDataByCveAndPatch } from "@/lib/cveKernelData";
import { extractFormattedDiff } from "@/context/format-single-diff";
import { fetchKernelFunctions } from "@/lib/kernel_functions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DivideIcon, Download } from "lucide-react";
import LoaderScreen from "@/app/loading";
import { parsePatchSummary } from "@/context/parse-patch-summary";
import { useRouter } from "next/navigation";

export default function PatchDetailView({
  params,
}: {
  params: Promise<{ id: string; patchId: string }>;
}) {
  const { id, patchId } = use(params);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [kernelData, setKernelData] = useState<any | null>(null);
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

  // ---------------------
  // Fetch patch data
  // ---------------------
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const url = `/api/kernel-detail/by-cve-patch?cveId=${encodeURIComponent(
          id
        )}&patchId=${encodeURIComponent(patchId)}`;
        const res = await fetch(url, { cache: "force-cache" });
        if (!res.ok) {
          setKernelData(null);
        } else {
          const data = await res.json();
          setKernelData(data);
        }
      } catch (err) {
        setKernelData(null);
      }
      setLoading(false);
    }
    loadData();
  }, [id, patchId]);

  // ---------------------
  // Render diff content with proper color highlighting and full width
  // ---------------------
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
          {content.startsWith("CVE:") ? (
            ""
          ) : (
            <span className="text-xs text-gray-400">
              {i + 1}
              {i + 1 < 10 ? " " : ""} |
            </span>
          )}

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
      if (line.startsWith("-") && !line.startsWith("---")) {
        removedLines.push(line.slice(1).trim()); // remove '-' and trim spaces
      } else if (line.startsWith("+") && !line.startsWith("+++")) {
        addedLines.push(line.slice(1).trim()); // remove '+' and trim spaces
      }
    });

    return { removedLines, addedLines };
  };

  // ---------------------
  // Fetch file from storage (vulnerable/non-vulnerable)
  // ---------------------
  const handleFetchFile = async (
    hunkIndex: number,
    hunk: any,
    type: "vulnerable_function" | "nonvulnerable_function",
    isFunction: boolean
  ) => {
    const originalFileName = hunk?.fileName ?? "";
    if (!originalFileName) return;

    // Extract file extension from fileContent line starting with "File:"
    const extensionMatch = hunk?.fileContent?.match(
      /File:\s*.+(\.[a-zA-Z0-9]+)\s*$/m
    );
    const fileExtension = extensionMatch ? extensionMatch[1] : "";
    const fileName = fileExtension
      ? originalFileName.replace(/\.[a-zA-Z0-9]+$/, fileExtension)
      : originalFileName;

    const cveId =
      hunk?.fileContent?.match(/CVE:\s*(CVE-\d{4}-\d+)/i)?.[1]?.trim() ?? id;

    // Set loading state
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
      const url = `/api/kernel-detail/function?type=${encodeURIComponent(
        type
      )}&cveId=${encodeURIComponent(cveId)}&patchId=${encodeURIComponent(
        patchId
      )}&fileName=${encodeURIComponent(fileName)}`;
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

  if (loading) return <LoadingView isDark={isDark} />;
  if (!kernelData)
    return <NoDataView isDark={isDark} message="No patch data found." />;

  const patchDocs = kernelData.subcollections[patchId] ?? [];
  if (!patchDocs.length)
    return (
      <NoDataView isDark={isDark} message="No patch documents in this patch." />
    );

  const currentPatch = patchDocs[0];
  const hunkFiles = (currentPatch.patchFiles ?? []).filter(
    (file: any) =>
      file.fileName && file.fileName.toLowerCase().startsWith("hunk")
  );
  const combinedFile = (currentPatch.patchFiles ?? []).filter(
    (file: any) => file.fileName && file.fileName.startsWith("COMBINED")
  );
  const stats = parsePatchSummary(combinedFile[0]?.fileContent || "");
  const uniqueFiles = stats.files.filter(
    (file) => file.functionsAdded > 0 || file.functionsRemoved > 0
  );
  console.log(uniqueFiles);

  // Compute diff stats (from combined metadata or directly from hunks)
  let totalFiles = stats.totalFilesChanged || 0;
  let additions = stats.overall?.additions || 0;
  let deletions = stats.overall?.deletions || 0;

  if (totalFiles === 0 && hunkFiles.length > 0) {
    const filesFound = new Set<string>();
    let addCount = 0;
    let delCount = 0;
    hunkFiles.forEach((hf: any) => {
      const fc = hf.fileContent || "";
      const fm = fc.match(/File:\s*(.+)$/m);
      if (fm && fm[1]) filesFound.add(fm[1].trim());
      else if (hf.fileName) filesFound.add(hf.fileName);
      const lines = fc.split(/\r?\n/);
      lines.forEach((l: string) => {
        if (l.startsWith("+") && !l.startsWith("+++")) addCount++;
        else if (l.startsWith("-") && !l.startsWith("---")) delCount++;
      });
    });
    totalFiles = Math.max(1, filesFound.size);
    additions = addCount;
    deletions = delCount;
  }

  const router = useRouter();

  const buttonBg = isDark
    ? "bg-purple-800 hover:bg-purple-700 text-white"
    : "bg-purple-400 hover:bg-purple-500 text-black";

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
          <h2 className="text-xl font-semibold mb-2 text-purple-500">
            {id} / {patchId}
          </h2>

          <div className="text-sm text-gray-400 mb-6">
            <span>
              {totalFiles} {totalFiles === 1 ? "file" : "files"} changed, {additions} insertions, {deletions} deletions
            </span>
          </div>

          <div className="space-y-6 w-full">
            {hunkFiles.map((hunk: any, idx: number) => {
              const hunkState = hunkFileStates[idx] || {};
              const fileMatch = hunk?.fileContent?.match(/File:\s*(.+)$/m);
              const fileName = fileMatch
                ? fileMatch[1].trim()
                : uniqueFiles[0].fileName
                ? uniqueFiles[0].fileName
                : "";
              const typeMatch = hunk?.fileContent?.match(/Type:\s*(.+)$/m);
              const typeName = typeMatch ? typeMatch[1].trim() : "";
              const fileExtension = fileName.includes(".")
                ? fileName.substring(fileName.lastIndexOf(".") + 1)
                : "";

              const originalFileName = hunk?.fileName || "unknown_file";
              const fileNameWithExt = fileExtension
                ? originalFileName.replace(
                    /\.[a-zA-Z0-9]+$/,
                    `.${fileExtension}`
                  )
                : originalFileName;

              const headIndex = fileNameWithExt.indexOf("head");
              const fromHeadfileName =
                headIndex !== -1 ? fileNameWithExt.substring(headIndex) : "";

              const handleDownload = () => {
                const element = document.createElement("a");
                const file = new Blob([hunk.fileContent || ""], {
                  type: "application/rtf",
                });
                element.href = URL.createObjectURL(file);
                element.download = `${hunk.fileName || "diff"}.rtf`;
                document.body.appendChild(element); // Required for Firefox
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
                    {fileMatch && !(typeName == "Non-function changes") && (
                      <div className="mb-4 flex gap-2 flex-wrap justify-end">
                        {/* Full File */}
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
                        href={`/cve/${id}/patch/${patchId}/vulnerable-file/${fromHeadfileName}`}
                      >
                        {!fileName ? uniqueFiles[0].fileName : fileName}
                      </Link>
                    </div>
                    <div className="px-3 text-sm text-blue-500 w-full">
                      <span className="text-white">Non-Vulnerable File: </span>
                      <Link
                        href={`/cve/${id}/patch/${patchId}/non-vulnerable-file/${fromHeadfileName}`}
                      >
                        {!fileName ? uniqueFiles[0].fileName : fileName}
                      </Link>
                    </div>
                  </div>

                  {/* Hunk Diff - Full Width */}
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
                      type={"vulnerable"}
                      index={headIndex}
                      lines={removedLines}
                      extension={fileExtension}
                      title="Vulnerable Function"
                      content={hunkState.vulFileContent}
                      diffBg={diffBg}
                    />
                  )}

                  {hunkState.nonVulFileContent && (
                    <ContentBlock
                      type={"nonvulnerable"}
                      index={headIndex}
                      lines={addedLines}
                      extension={fileExtension}
                      title="Non-Vulnerable Function"
                      content={hunkState.nonVulFileContent}
                      diffBg={diffBg}
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
    extension,
    index,
    lines,
    type,
  }: {
    title: string;
    content: string;
    diffBg: string;
    extension: string;
    index: string;
    lines: string[];
    type: "vulnerable" | "nonvulnerable";
  }) {
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
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      // Set a filename based on the title (replace spaces with _)
      a.download = `${title.replace(/\s+/g, "_")}.${extension || "txt"}`;
      a.click();

      URL.revokeObjectURL(url);
    };

    return (
      <div className="mb-4 h-full flex flex-col w-full">
        <div className="flex flex-row justify-between items-start">
          <h4
            className={`mb-2 text-md font-semibold ${
              title == "Vulnerable Function" ? "text-red-400" : "text-green-400"
            }`}
          >
            {title}
          </h4>
          <div className="flex justify-end items-start mb-0">
            <Button
              onClick={handleDownload}
              className="px-1 py-1 h-70 w-70 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Download size={16} />
            </Button>
          </div>
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

// Optional helper components for Loading / NoData views
function LoadingView({ isDark }: { isDark: boolean }) {
  return (
    <div className={`min-h-screen flex flex-col`}>
      <Background />
      <div className="relative z-10 w-full">
        <DashboardHeader />
      </div>
      <div>
        <LoaderScreen />
      </div>
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
