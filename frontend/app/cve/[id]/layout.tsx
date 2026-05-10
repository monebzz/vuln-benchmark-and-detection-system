import React from "react";
import type { Metadata } from "next";
import CVEClientLayout from "./CVEClientLayout";

// Utility: Check if a value is meaningful
function isMeaningful(value: any) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") {
    const t = value.trim();
    if (!t) return false;
    const lower = t.toLowerCase();
    return !(
      lower === "unknown" ||
      lower === "not defined" ||
      lower === "not available" ||
      lower === "n/a"
    );
  }
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

// Helper: Safely get nested properties
function getNestedValue(obj: any, path: string, defaultValue: any = null) {
  if (!obj) return defaultValue;
  const keys = path.split(".");
  let current: any = obj;
  for (const key of keys) {
    if (!current || typeof current !== "object") return defaultValue;
    current = current[key];
  }
  return current ?? defaultValue;
}

// --- Generate Metadata for CVE page ---
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const id = await params;
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000";

  const fallbackTitle = `CVE Details for ${id.id}`;
  const fallbackDescription = `Details and analysis for CVE ${id.id}`;

  let data: any = {};
  try {
    const res = await fetch(`${baseUrl}/api/cve-detail?id=${id.id}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        title: fallbackTitle,
        description: fallbackDescription,
      };
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return {
        title: fallbackTitle,
        description: fallbackDescription,
      };
    }

    data = await res.json();
  } catch {
    return {
      title: fallbackTitle,
      description: fallbackDescription,
    };
  }

  const cveRecordData = data.cverecord_data ?? {};
  const cveDataData = data.cvedata_data ?? {};
  const cnaContainer = getNestedValue(
    cveRecordData,
    "containers.cna",
    {},
  ) as any;

  // --- Basic CVE Info ---
  const cveId =
    getNestedValue(cveRecordData, "cveMetadata.cveId") ??
    getNestedValue(cveDataData, "cveId") ??
    null;
  const title = getNestedValue(cnaContainer, "title", null);

  // --- Description ---
  const cnaDescriptions = getNestedValue(
    cnaContainer,
    "descriptions",
    [],
  ) as any[];
  let description = getNestedValue(cveDataData, "description_of_cve", null);
  if (Array.isArray(cnaDescriptions) && cnaDescriptions.length > 0) {
    const enDesc = cnaDescriptions.find((d: any) => d.lang === "en");
    if (enDesc?.value) description = enDesc.value;
  }

  // --- CWE Info ---
  const cweIds = getNestedValue(cveDataData, "cweIdsCve", []) as any[];
  const problemTypes = getNestedValue(
    cnaContainer,
    "problemTypes",
    [],
  ) as any[];

  let cweId: string | null = null;
  let cweTitle: string | null = null;
  let cweDescription: string | null = null;

  if (Array.isArray(cweIds) && cweIds.length > 0) {
    const first = cweIds[0];
    cweId = first.cweId ?? null;
    cweTitle = first.title ?? null;
    cweDescription = first.description ?? null;
  } else if (Array.isArray(problemTypes) && problemTypes.length > 0) {
    const firstProblem = problemTypes[0].descriptions?.[0] ?? null;
    if (firstProblem) {
      cweId = firstProblem.cweId ?? null;
      cweDescription = firstProblem.description ?? null;
    }
  }

  // --- Scores ---
  const scoreData = getNestedValue(cveDataData, "scoreData", {}) as any;
  const cnaMetrics = getNestedValue(cnaContainer, "metrics", []) as any[];

  let severity: string | null = null;
  let cvssScore: string | null = null;
  let cvssVector: string | null = null;
  let cvssVersion: string | null = null;

  if (Array.isArray(cnaMetrics) && cnaMetrics.length > 0) {
    const metrics = cnaMetrics[0];
    const cvssVersions = [
      "cvssV5_1",
      "cvssV5_0",
      "cvssV4_0",
      "cvssV3_1",
      "cvssV3_0",
      "cvssV2",
    ];
    for (const ver of cvssVersions) {
      const cvss = metrics[ver];
      if (cvss) {
        severity = cvss.baseSeverity ?? null;
        cvssScore = cvss.baseScore?.toString() ?? null;
        cvssVector = cvss.vectorString ?? null;
        cvssVersion = ver.replace("cvssV", "").replace("_", ".");
        break;
      }
    }
  }

  // --- EPSS ---
  const epssData = getNestedValue(scoreData, "eps_sScore", {}) as any;
  let epssScore = getNestedValue(epssData, "probability", null);
  if (isMeaningful(epssScore) && !isNaN(Number(epssScore))) {
    epssScore = Number(epssScore).toFixed(2) + "%";
  } else {
    epssScore = null;
  }

  // --- Dates & Metadata ---
  const cveMetadata = getNestedValue(cveRecordData, "cveMetadata", {}) as any;
  const datePublished = getNestedValue(cveMetadata, "datePublished", null);
  const dateUpdated = getNestedValue(cveMetadata, "dateUpdated", datePublished);

  // --- Affected Products ---
  const affectedArray = getNestedValue(cnaContainer, "affected", []) as any[];
  const affectedProducts =
    Array.isArray(affectedArray) && affectedArray.length > 0
      ? affectedArray
          .map((a: any) => `${a.vendor ?? ""} ${a.product ?? ""}`.trim())
          .filter(Boolean)
      : [];
  const vendor = affectedArray?.[0]?.vendor ?? null;
  const product = affectedArray?.[0]?.product ?? null;
  const categoryType = getNestedValue(cveDataData, "category_type", null);
  const assigners = getNestedValue(cveDataData, "assigners", null);

  const safe = (value: string | null | undefined) => value ?? "";

  // --- Meta Keywords ---
  const rawKeywords = `
${safe(cveId)}, ${safe(cweDescription)}, ${safe(cweTitle)}, ${safe(affectedProducts.join(", "))}, ${safe(vendor)}, ${safe(product)}, ${safe(categoryType)}, ${safe(assigners)}, CVE, cybersecurity, vulnerability, security vulnerability, exploit, threat intelligence, CVSS score, EPSS score, vulnerability management, critical vulnerabilities, high severity vulnerabilities, low severity vulnerabilities, software vulnerabilities, hardware vulnerabilities, vendor security advisories, product security patches, security updates, vulnerability scanner, threat monitoring, risk management system, vulnerability benchmarking, CVE database, security alerts, vulnerability trends, cyber risk analysis, zero-day vulnerabilities, patch management
`;

  // Step 1: Split by comma, trim, remove empty
  const keywordsArray = rawKeywords
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k);

  // Step 2: Remove duplicates
  const uniqueKeywords = Array.from(new Set(keywordsArray));

  // Step 3: Join back into string
  const metaKeywords = uniqueKeywords.join(", ");
  return {
    title: data.title || `${fallbackTitle}${title ? ` | ${title}` : ""}`,
    description: description || fallbackDescription,
    keywords: metaKeywords,
  };
}

// --- CVE Layout ---
export default function CVELayout({ children }: { children: React.ReactNode }) {
  return <CVEClientLayout>{children}</CVEClientLayout>;
}
