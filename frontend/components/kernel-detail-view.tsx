"use client";

import React, { useState } from "react";
import { processSubcollections } from "@/context/extract-diff-block";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

export function KernelDetailView({ kernalData, cveid }: any) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const fullKernelData = processSubcollections(kernalData);
  const router = useRouter();

  // Theme classes
  const containerBg = "bg-[#0A0A0B] text-[#E8E8EC]";
  const cardBg = "bg-[#111113] border border-white/[0.07]";
  const labelText = "text-white";
  const valueText = "text-white";
  const borderColor = "border-white/[0.06]";
  const summaryText = "text-[#8A8A93]";
  const diffBg = "bg-[#0D0D0F] border border-white/[0.07]";
  const lineText = "text-[#A8B5C8]";
  const buttonClass = "bg-white text-[#0A0A0B] hover:bg-[#EAEAEA] font-semibold";

  return (
    <div
      className={`p-6 max-w-6xl mx-auto space-y-8 font-mono text-sm rounded-2xl ${containerBg}`}
    >
      {fullKernelData.map((patch: any, index: number) => {
        const ref = patch.referenceData ?? patch.patchObj?.referenceData ?? {};
        let stats = patch.combinedSummaries?.[0];
        const referenceLink =
          patch.referenceLink ?? patch.patchObj?.referenceLink ?? null;
        const diffs = patch.diffs || [];

        if ((!stats || (!stats.totalFilesChanged && !stats.overall?.additions && !stats.overall?.deletions)) && diffs.length > 0) {
          let adds = 0;
          let dels = 0;
          const filesSet = new Set<string>();
          diffs.forEach((d: any) => {
            if (d.fileName) filesSet.add(d.fileName);
            const lines = (d.diff || "").split(/\r?\n/);
            lines.forEach((l: string) => {
              if (l.startsWith("+") && !l.startsWith("+++")) adds++;
              else if (l.startsWith("-") && !l.startsWith("---")) dels++;
            });
          });
          stats = {
            totalFilesChanged: Math.max(1, filesSet.size),
            overall: { additions: adds, deletions: dels },
          };
        }

        // Show functions view by default since it contains the actual code for kernel patches
        const showPatch = true;

        // Filtered patch files (starting with "hunk")
        const patchFiles =
          patch.patchObj?.patchFiles?.filter((f: any) =>
            (f.fileName || f.filename || f.id || "").toLowerCase().startsWith("hunk")
          ) || [];

        return (
          <div key={index} className={`space-y-3 border-b ${borderColor} pb-8`}>
            {/* Reference Link */}
            <div className="flex justify-between items-center">
              <div>
                {referenceLink && (
                  <div className="text-blue-500 dark:text-blue-400 text-sm">
                    {referenceLink}
                  </div>
                )}
              </div>
              <div>
                {patchFiles.length > 0 && (
                  <Button
                    onClick={() =>
                      router.push(`/cve/${cveid}/patch/${ref.patchId}`)
                    }
                    className={`px-3 py-1 rounded-xl text-xs sm:text-sm ${buttonClass}`}
                  >
                    View Details
                  </Button>
                )}
              </div>
            </div>

            {/* Reference Data Grid */}
            <div
              className={`p-6 rounded-xl border shadow-sm max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-1 gap-x-6 gap-y-3 ${cardBg}`}
            >
              {/* Author & Commit Info */}
              <div className="flex">
                <span className={`font-bold w-36 flex-shrink-0 ${labelText}`}>
                  Author Name:
                </span>
                <span className={`break-all ${valueText}`}>
                  {ref.authorName}
                </span>
              </div>
              <div className="flex">
                <span className={`font-bold w-36 flex-shrink-0 ${labelText}`}>
                  Author Date:
                </span>
                <span className={`break-all ${valueText}`}>
                  {ref.authorDate}
                </span>
              </div>
              <div className="flex">
                <span className={`font-bold w-36 flex-shrink-0 ${labelText}`}>
                  Committer Name:
                </span>
                <span className={`break-all ${valueText}`}>
                  {ref.committerName}
                </span>
              </div>
              <div className="flex">
                <span className={`font-bold w-36 flex-shrink-0 ${labelText}`}>
                  Committer Date:
                </span>
                <span className={`break-all ${valueText}`}>
                  {ref.committerDate}
                </span>
              </div>

              {/* Diff ID & Link */}
              {ref.diffId && (
                <div className="flex">
                  <span className={`font-bold w-36 flex-shrink-0 ${labelText}`}>
                    Diff ID:
                  </span>
                  <span className={`break-all ${valueText}`}>{ref.diffId}</span>
                </div>
              )}
              {ref.diffLink && (
                <div className="flex">
                  <span className={`font-bold w-36 flex-shrink-0 ${labelText}`}>
                    Diff Link:
                  </span>
                  <a
                    href={ref.diffLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:underline break-all"
                  >
                    {ref.diffLink}
                  </a>
                </div>
              )}

              {/* Patch ID */}
              {ref.patchId && (
                <div className="flex">
                  <span className={`font-bold w-36 flex-shrink-0 ${labelText}`}>
                    Patch ID:
                  </span>
                  <span className={`break-all ${valueText}`}>
                    {ref.patchId}
                  </span>
                </div>
              )}

              {/* Tar file name & download link */}
              {ref.tarFileName && (
                <div className="flex">
                  <span className={`font-bold w-36 flex-shrink-0 ${labelText}`}>
                    Tar File:
                  </span>
                  <span className={`break-all ${valueText}`}>
                    {ref.tarFileName}
                  </span>
                </div>
              )}
              {ref.tarLink && (
                <div className="flex">
                  <span className={`font-bold w-36 flex-shrink-0 ${labelText}`}>
                    Download:
                  </span>
                  <a
                    href={ref.tarLink}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:underline break-all"
                  >
                    {ref.tarLink}
                  </a>
                </div>
              )}
            </div>

            {/* Summary line + View functions button */}
            {stats && (
              <div
                className={`flex items-center justify-between gap-4 text-sm ${summaryText}`}
              >
                <span>
                  {stats.totalFilesChanged} files changed,{" "}
                  {stats.overall.additions} insertions,{" "}
                  {stats.overall.deletions} deletions
                </span>
                {/* {patchFiles.length > 0 && (
                  <Button
                    onClick={() =>
                      router.push(
                        `/cve/${cveid}/patch/${ref.patchId}`
                      )
                    }
                    className="px-3 py-1 bg-purple-800 hover:bg-purple-900 rounded-xl text-white text-xs sm:text-sm"
                  >
                    View Details
                  </Button>
                )} */}
              </div>
            )}

            {/* Diffs with File Headers */}
            <div className="space-y-6">
              {Array.isArray(diffs) &&
                diffs.map((diffObj: any, diffIdx: number) => {
                  if (!diffObj?.fileName || !diffObj?.diff) return null;

                  const lines = diffObj.diff.split(/\r?\n/);

                  return (
                    <div key={diffIdx} className="space-y-2">
                      {/* Diff content */}
                      <div
                        className={`p-3 rounded-lg border overflow-x-auto ${diffBg}`}
                      >
                        <div className="leading-tight text-sm">
                          {lines.map((line: string, lineIdx: number) => {
                            let cls = lineText;

                            if (line.startsWith("+"))
                              cls = "text-green-600 dark:text-green-400";
                            else if (line.startsWith("-"))
                              cls = "text-red-600 dark:text-red-400";
                            else if (line.startsWith("@@"))
                              cls = "text-blue-600 dark:text-blue-400";

                            return (
                              <div
                                key={lineIdx}
                                className={`${cls} whitespace-pre-wrap break-words`}
                              >
                                {line || "\u00A0"}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Function patch files (conditionally rendered) */}
            {showPatch &&
              patchFiles.map((file: any, fileIdx: number) => {
                const fileText = file.fileContent || file.content || "";
                const lines = fileText.split(/\r?\n/);

                return (
                  <div key={fileIdx} className="space-y-2">
                    <div className="text-blue-500 dark:text-blue-300 font-bold mb-1">
                      {`Patch ${fileIdx + 1}`}
                    </div>
                    <div
                      className={`p-3 rounded-lg border overflow-x-auto ${diffBg}`}
                    >
                      <div className="leading-tight text-sm">
                        {lines.map((line: string, lineIdx: number) => {
                          let cls = lineText;

                          if (line.startsWith("+"))
                            cls = "text-green-600 dark:text-green-400";
                          else if (line.startsWith("-"))
                            cls = "text-red-600 dark:text-red-400";
                          else if (line.startsWith("@@"))
                            cls = "text-blue-600 dark:text-blue-400";

                          return (
                            <div
                              key={lineIdx}
                              className={`${cls} whitespace-pre-wrap break-words`}
                            >
                              {line || "\u00A0"}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}
