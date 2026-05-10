export function extractFormattedDiff(raw: string): string {
  if (!raw) return "";

  // Step 1 — Get everything before --- a/ (file metadata, CVE info, etc.)
  const startIndex = raw.indexOf("--- a/");
  if (startIndex === -1) {
    // No --- a/ found, return entire raw string
    return raw;
  }

  const beforeDiff = raw.substring(0, startIndex).trim();
  let diff = raw.slice(startIndex);

  // Step 2 — Split into header and hunks
  const hunkPattern = /@@[^@]*@@/;
  const headerEndIndex = diff.search(hunkPattern);

  if (headerEndIndex === -1) {
    // No hunks found, return everything
    return (beforeDiff ? beforeDiff + "\n\n" : "") + diff;
  }

  // Get header (--- a/, +++ b/, etc.)
  const header = diff.substring(0, headerEndIndex);

  // Get rest of diff starting from first @@
  const diffContent = diff.substring(headerEndIndex);

  // Step 3 — Split by @@ to separate hunks
  const hunkRegex = /@@[^@]*@@/;
  let remaining = diffContent;
  let formatted = "";

  // Add everything before --- a/
  if (beforeDiff) {
    formatted += beforeDiff + "\n\n";
  }

  // Add header (--- a/, +++ b/, etc.)
  formatted += header;

  // Process each hunk
  while (remaining.length > 0) {
    const match = remaining.match(hunkRegex);
    if (!match) break;

    const hunkHeader = match[0];
    const hunkStartPos = match.index || 0;
    const hunkEndPos = hunkStartPos + hunkHeader.length;

    // Find next @@ or end of string
    const nextMatch = remaining.substring(hunkEndPos).match(hunkRegex);
    const nextHunkPos = nextMatch
      ? hunkEndPos + (nextMatch.index || 0)
      : remaining.length;

    // Extract hunk content (lines between @@ headers)
    const hunkContent = remaining.substring(hunkEndPos, nextHunkPos).trim();

    // Add hunk header and content
    formatted += "\n" + hunkHeader;
    if (hunkContent) {
      formatted += "\n" + hunkContent;
    }

    // Move to next hunk
    remaining = remaining.substring(nextHunkPos);
  }

  // Ensure ends with newline
  if (!formatted.endsWith("\n")) {
    formatted += "\n";
  }

  return formatted;
}
