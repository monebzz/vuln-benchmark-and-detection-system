//-----------------------------------------
// Extract only the real diff block

import { parsePatchSummary } from "./parse-patch-summary";
import { createTwoFilesPatch } from "diff";

//-----------------------------------------
export function extractDiffBlock(patchText: string) {
  const startIndex = patchText.indexOf("--- a/");
  if (startIndex === -1) return null;

  return patchText.slice(startIndex).trim();
}

//------------------------------------------------------
// MAIN: Process patches → generate unique patch list
//------------------------------------------------------
export function processSubcollections(cveJson: any) {
  const subs = cveJson.subcollections ?? {};
  const patches: any[] = [];

  //-----------------------------------------------------
  // STEP 1: Extract diffs + summaries for ALL patches
  //-----------------------------------------------------
  for (const patchId of Object.keys(subs)) {
    for (const patchObj of subs[patchId]) {
      const refData = patchObj.referenceData || {};

      const entry = {
        patchId,
        patchObj, // FULL ORIGINAL PATCH OBJECT
        referenceData: refData,
        committerDate: new Date(refData.committerDate || 0).getTime(),
        referenceLink: patchObj.referenceLink || null,
        diffs: [] as { fileName: string; diff: string }[],
        combinedSummaries: [] as any[], // NO MERGING — per patch summaries kept separately
      };

      const patchFiles = patchObj.patchFiles ?? [];

      // Generate dynamic diffs for kernel data where we only have full functions
      const vulnFiles = [
        ...(patchObj.vulnerable_files || []),
        ...(patchObj.vulnerable_function || [])
      ];
      const nonVulnFiles = [
        ...(patchObj.nonvulnerable_files || []),
        ...(patchObj.nonvulnerable_function || [])
      ];

      const allFileNames = new Set([
        ...vulnFiles.map((f: any) => f.filename || f.fileName || f.id),
        ...nonVulnFiles.map((f: any) => f.filename || f.fileName || f.id)
      ]);

      allFileNames.forEach((fname) => {
        if (!fname) return;
        const oldFile = vulnFiles.find((f: any) => (f.filename || f.fileName || f.id) === fname);
        const newFile = nonVulnFiles.find((f: any) => (f.filename || f.fileName || f.id) === fname);
        
        if (oldFile && newFile) {
          const oldText = oldFile.fileContent || oldFile.content || "";
          const newText = newFile.fileContent || newFile.content || "";
          // Generate a unified diff!
          const diffText = createTwoFilesPatch(fname, fname, oldText, newText, "vulnerable", "patched");
          entry.diffs.push({ fileName: fname, diff: diffText });
        }
      });

      // Extract all relevant files
      for (const pf of patchFiles) {
        const name = pf.fileName || pf.filename || pf.id || "";
        const content = pf.fileContent || pf.content || "";

        //-------------------------
        // Extract DIFF FILES
        //-------------------------
        if (name.startsWith("file")) {
          const cleaned = extractDiffBlock(content);
          if (cleaned) {
            entry.diffs.push({
              fileName: name,
              diff: cleaned,
            });
          }
        }

        //-------------------------
        // Extract COMBINED_PATCH
        //-------------------------
        if (name.startsWith("COMBINED_PATCH")) {
          const parsed = parsePatchSummary(content);
          entry.combinedSummaries.push(parsed);
        }
      }

      patches.push(entry);
    }
  }

  //-----------------------------------------------------------------
  // STEP 2: Deduplicate patches based on DIFF TEXT across ALL patches
  //-----------------------------------------------------------------
  const uniqueMap: Record<string, any> = {};

  for (const patch of patches) {
    if (patch.diffs.length === 0) {
      const key = patch.patchId || Math.random().toString();
      if (!uniqueMap[key]) {
        uniqueMap[key] = patch;
      } else if (patch.committerDate > uniqueMap[key].committerDate) {
        uniqueMap[key] = patch;
      }
      continue;
    }

    for (const d of patch.diffs) {
      const key = d.diff; // raw diff used as uniqueness key

      if (!uniqueMap[key]) {
        uniqueMap[key] = patch;
      } else {
        // if duplicate diff exists → keep the newest patch
        if (patch.committerDate > uniqueMap[key].committerDate) {
          uniqueMap[key] = patch;
        }
      }
    }
  }

  //-----------------------------------------------------------------
  // STEP 3: Return UNIQUE patches sorted by newest committerDate
  //-----------------------------------------------------------------
  const uniquePatches = Object.values(uniqueMap);

  return uniquePatches.sort((a, b) => b.committerDate - a.committerDate);
}
