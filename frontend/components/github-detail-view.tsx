"use client";

import React from "react";
import { useTheme } from "next-themes";
import { parsePatchSummary } from "@/context/parse-patch-summary";
import { extractDiffBlock } from "@/context/extract-diff-block";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

export function GithubDetailView({ githubData }: any) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();

  const referenceLinks =
    githubData?.links?.map((link: any) => link?.referencelink) ?? [];

  if (!githubData || referenceLinks.length === 0) {
    return (
      <div
        className={`p-6 rounded-xl border ${
          isDark
            ? "bg-[#1e1e1e] border-gray-700 text-gray-300"
            : "bg-white border-gray-200 text-gray-700"
        }`}
      >
        <p className={`${isDark ? "text-gray-400" : "text-gray-500"}`}>
          No GitHub reference links available.
        </p>
      </div>
    );
  }

  const cardBg = "bg-[#111113] border-white/[0.07] text-[#E8E8EC]";
  const commitCardBg = "bg-[#151518] border-white/[0.06]";
  const labelText = "text-white";
  const valueText = "text-white";
  const mutedText = "text-[#8A8A93]";
  const codeBg = "bg-[#0D0D0F] border-white/[0.07]";
  const diffBg = "bg-[#0D0D0F]";
  const buttonClass = "bg-white text-[#0A0A0B] hover:bg-[#EAEAEA] font-semibold";

  return (
    <div className={`p-6 rounded-xl border ${cardBg} w-full space-y-8`}>
      {githubData.links.map((linkGroup: any, idx: number) => {
        const link = linkGroup?.referencelink;

        // extract commit info for this link index
        const sha = linkGroup?.shaDetails?.[0];
        const commit = sha?.github_commit_data?.commit;

        const commitInfo = commit
          ? {
              authorName: commit?.author?.name ?? "",
              authorDate: commit?.author?.date ?? "",
              committerName: commit?.committer?.name ?? "",
              committerDate: commit?.committer?.date ?? "",
              message: commit?.message ?? "",
              treeSha: commit?.tree?.sha ?? "",
              treeUrl: commit?.tree?.url ?? "",
              commitUrl: commit?.url ?? "",
            }
          : null;

        const files = sha?.github_commit_data?.files ?? [];
        const fileGroupsArr = githubData.fileGroups || [];

        // Resolve files with their documents
        const resolvedFiles = files
          .map((id: string, idx: number) => {
            const match = fileGroupsArr.find(
              (group: any) => group.fileId === id
            );
            return {
              idx,
              fileId: id,
              documents: match?.documents ?? [],
            };
          })
          .filter((file: any) => file.documents.length > 0);

        return (
          <div key={idx} className="space-y-4">
            {/* 🔗 Link */}
            <div className={`block w-full px-4 py-3 rounded-lg`}>
              <div className="font-semibold text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 break-all">
                {link}
              </div>
            </div>

            {/* Commit Info for this link */}
            {commitInfo && (
              <div
                className={`p-6 rounded-xl border shadow-sm w-full ${commitCardBg}`}
              >
                <div className="grid grid-cols-1 gap-y-3">
                  {/* Author Info */}
                  <div className="flex">
                    <span
                      className={`font-bold w-36 flex-shrink-0 ${labelText}`}
                    >
                      Author Name:
                    </span>
                    <span className={`break-all ${valueText}`}>
                      {commitInfo.authorName}
                    </span>
                  </div>

                  <div className="flex">
                    <span
                      className={`font-bold w-36 flex-shrink-0 ${labelText}`}
                    >
                      Author Date:
                    </span>
                    <span className={`break-all ${valueText}`}>
                      {commitInfo.authorDate}
                    </span>
                  </div>

                  {/* Committer */}
                  <div className="flex">
                    <span
                      className={`font-bold w-36 flex-shrink-0 ${labelText}`}
                    >
                      Committer Name:
                    </span>
                    <span className={`break-all ${valueText}`}>
                      {commitInfo.committerName}
                    </span>
                  </div>

                  <div className="flex">
                    <span
                      className={`font-bold w-36 flex-shrink-0 ${labelText}`}
                    >
                      Committer Date:
                    </span>
                    <span className={`break-all ${valueText}`}>
                      {commitInfo.committerDate}
                    </span>
                  </div>

                  {/* Tree SHA */}
                  {commitInfo.treeSha && (
                    <div className="flex">
                      <span
                        className={`font-bold w-36 flex-shrink-0 ${labelText}`}
                      >
                        Tree SHA:
                      </span>
                      <span className={`break-all ${valueText}`}>
                        {commitInfo.treeSha}
                      </span>
                    </div>
                  )}

                  {/* Tree URL */}
                  {commitInfo.treeUrl && (
                    <div className="flex">
                      <span
                        className={`font-bold w-36 flex-shrink-0 ${labelText}`}
                      >
                        Tree URL:
                      </span>
                      <a
                        href={commitInfo.treeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:underline break-all"
                      >
                        {commitInfo.treeUrl}
                      </a>
                    </div>
                  )}

                  {/* Commit URL */}
                  {commitInfo.commitUrl && (
                    <div className="flex">
                      <span
                        className={`font-bold w-36 flex-shrink-0 ${labelText}`}
                      >
                        Commit URL:
                      </span>
                      <a
                        href={commitInfo.commitUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:underline break-all"
                      >
                        {commitInfo.commitUrl}
                      </a>
                    </div>
                  )}

                  {/* Commit Message */}
                  {commitInfo.message && (
                    <div className="flex flex-col">
                      <span
                        className={`font-bold w-36 flex-shrink-0 mb-1 ${labelText}`}
                      >
                        Message:
                      </span>
                      <pre
                        className={`whitespace-pre-wrap break-all p-3 rounded-lg border overflow-x-auto ${mutedText} ${codeBg}`}
                      >
                        {commitInfo.message}
                      </pre>
                    </div>
                  )}
                </div>

                {/* File Contents and Stats */}
                {resolvedFiles.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h4 className={`font-bold text-lg ${valueText}`}>
                      Files Changed ({resolvedFiles.length})
                    </h4>

                    {resolvedFiles.map((file: any) => {
                      let fileTotals = {
                        additions: 0,
                        deletions: 0,
                      };

                      // Calculate totals for this file
                      file.documents.forEach((doc: any) => {
                        if (doc.fileContent) {
                          const stats = parsePatchSummary(doc.fileContent);
                          fileTotals.additions += stats.overall?.additions || 0;
                          fileTotals.deletions += stats.overall?.deletions || 0;
                        }
                      });

                      return (
                        <div key={file.fileId} className="space-y-2">
                          {/* File Header */}

                          <div className="flex flex-row justify-between items-start">
                            <div className="p-3">
                              <div
                                className={valueText}
                              >{`File Id: ${file.fileId}`}</div>
                              <div className={`text-sm ${mutedText}`}>
                                ({fileTotals.additions}) additions, (
                                {fileTotals.deletions}) deletions
                              </div>
                            </div>
                            <div>
                              <Button
                                onClick={() =>
                                  router.push(
                                    `/cve/${githubData.cveId}/github/patch/${file.fileId}`
                                  )
                                }
                                className={`px-3 py-1 rounded-xl text-xs sm:text-sm ${buttonClass}`}
                              >
                                View Details
                              </Button>
                            </div>
                          </div>

                          {/* File Documents */}
                          {file.documents
                            .filter(
                              (doc: any) =>
                                doc.fileContent && doc.id.startsWith("file")
                            )
                            .map((doc: any, docIdx: number) => {
                              const diffBlock = extractDiffBlock(
                                doc.fileContent
                              );
                              if (!diffBlock) return null;

                              const lines = diffBlock.split("\n");
                              const lineBaseText = isDark
                                ? "text-gray-300"
                                : "text-gray-700";

                              return (
                                <div key={docIdx}>
                                  <div
                                    className={`space-y-2 rounded-lg ${diffBg}`}
                                  >
                                    <div
                                      className={`p-3 rounded-lg border overflow-x-auto ${codeBg}`}
                                    >
                                      <div className="text-sm">
                                        {lines.map(
                                          (line: string, lineIdx: number) => {
                                            let cls = lineBaseText;
                                            if (line.startsWith("+"))
                                              cls =
                                                "text-green-600 dark:text-green-400";
                                            else if (line.startsWith("-"))
                                              cls =
                                                "text-red-600 dark:text-red-400";
                                            else if (line.startsWith("@@"))
                                              cls =
                                                "text-blue-600 dark:text-blue-400";
                                            return (
                                              <div
                                                key={lineIdx}
                                                className={`${cls} whitespace-pre-wrap break-words`}
                                              >
                                                {line || "\u00A0"}
                                              </div>
                                            );
                                          }
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
