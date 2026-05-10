interface PatchFileSummary {
  fileName: string;
  additions: number;
  deletions: number;
  functionsModified: number;
  functionsAdded: number;
  functionsRemoved: number;
  nonFunctionChanges: boolean;
  hunks: number;
}

interface PatchSummary {
  cveId: string;
  patchId: string;
  totalFilesChanged: number;
  overall: {
    additions: number;
    deletions: number;
    netChange: number;
    totalChanges: number;
  };
  functions: {
    modified: number;
    added: number;
    removed: number;
  };
  files: PatchFileSummary[];
}

export function parsePatchSummary(summary: string): PatchSummary {
  const lines = summary.split("\n").map((l) => l.trim());

  // -------------------------
  // Extract CVE & Patch ID
  // -------------------------
  const cveMatch = summary.match(/CVE ID:\s*(CVE-[\d-]+)/);
  const patchIdMatch = summary.match(/Patch ID:\s*([a-fA-F0-9]+)/);
  const totalFilesMatch = summary.match(/Total Files Changed:\s*(\d+)/);

  // -------------------------
  // Extract Overall Stats
  // -------------------------
  const additions = parseInt(
    summary.match(/Total Additions:\s*\+(\d+)/)?.[1] || "0"
  );
  const deletions = parseInt(
    summary.match(/Total Deletions:\s*-(\d+)/)?.[1] || "0"
  );
  const netChange = parseInt(
    summary.match(/Net Change:\s*([+-]?\d+)/)?.[1] || "0"
  );
  const totalChanges = parseInt(
    summary.match(/Total Changes:\s*(\d+)/)?.[1] || "0"
  );

  const functionsModified = parseInt(
    summary.match(/Functions Modified:\s*(\d+)/)?.[1] || "0"
  );
  const functionsAdded = parseInt(
    summary.match(/Functions Added:\s*(\d+)/)?.[1] || "0"
  );
  const functionsRemoved = parseInt(
    summary.match(/Functions Removed:\s*(\d+)/)?.[1] || "0"
  );

  // -------------------------
  // Extract File Sections
  // -------------------------
  const fileBlocks = summary.split(/File:\s*/g).slice(1); // remove header part

  const files: PatchFileSummary[] = fileBlocks.map((block) => {
    const lines = block.split("\n");

    const fileName = lines[0].trim();

    return {
      fileName,
      additions: parseInt(block.match(/Additions:\s*\+(\d+)/)?.[1] || "0"),
      deletions: parseInt(block.match(/Deletions:\s*-(\d+)/)?.[1] || "0"),
      functionsModified: parseInt(
        block.match(/Functions Modified:\s*(\d+)/)?.[1] || "0"
      ),
      functionsAdded: parseInt(
        block.match(/Functions Added:\s*(\d+)/)?.[1] || "0"
      ),
      functionsRemoved: parseInt(
        block.match(/Functions Removed:\s*(\d+)/)?.[1] || "0"
      ),
      nonFunctionChanges: /Non-Function Changes:\s*Yes/i.test(block),
      hunks: parseInt(block.match(/Hunks Created:\s*(\d+)/)?.[1] || "0"),
    };
  });

  return {
    cveId: cveMatch?.[1] || "",
    patchId: patchIdMatch?.[1] || "",
    totalFilesChanged: parseInt(totalFilesMatch?.[1] || "0"),
    overall: {
      additions,
      deletions,
      netChange,
      totalChanges,
    },
    functions: {
      modified: functionsModified,
      added: functionsAdded,
      removed: functionsRemoved,
    },
    files,
  };
}
