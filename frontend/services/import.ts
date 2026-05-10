/**
 * Import service — handles CVE data import via CSV/JSON files.
 * Currently a stub implementation since the backend does not have
 * a dedicated import endpoint.
 */

export interface ImportResponse {
  total_records: number;
  successful_imports: number;
  skipped_records: number;
  errors: Array<{ record: any; error: string }>;
}

/**
 * Validate an import file before uploading.
 */
export function validateImportFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = [".csv", ".json"];

  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds 50MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)` };
  }

  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  if (!allowedTypes.includes(ext)) {
    return { valid: false, error: `Unsupported file type: ${ext}. Only CSV and JSON files are accepted.` };
  }

  return { valid: true };
}

/**
 * Import CVE data from a file.
 * NOTE: This is a stub — no backend endpoint currently supports file import.
 */
export async function importCveData(
  _file: File,
  _overwrite: boolean = false
): Promise<ImportResponse> {
  // Simulate a delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return {
    total_records: 0,
    successful_imports: 0,
    skipped_records: 0,
    errors: [
      {
        record: {},
        error:
          "Import functionality is not yet available. The backend does not have an import endpoint configured.",
      },
    ],
  };
}

/**
 * Get a CSV template for importing CVE data.
 */
export async function getCsvTemplate(): Promise<Blob> {
  const header =
    "cve_id,description,published_date,cvss_base_score,cvss_base_severity,vendor,product\n";
  const example =
    'CVE-2024-0001,"Example vulnerability description",2024-01-01,7.5,HIGH,example_vendor,example_product\n';
  return new Blob([header + example], { type: "text/csv" });
}

/**
 * Get a JSON template for importing CVE data.
 */
export async function getJsonTemplate(): Promise<Blob> {
  const template = [
    {
      cve_id: "CVE-2024-0001",
      description: "Example vulnerability description",
      published_date: "2024-01-01",
      cvss_base_score: 7.5,
      cvss_base_severity: "HIGH",
      vendor: "example_vendor",
      product: "example_product",
    },
  ];
  return new Blob([JSON.stringify(template, null, 2)], {
    type: "application/json",
  });
}

/**
 * Download a template blob as a file.
 */
export function downloadTemplate(blob: Blob): void {
  const ext = blob.type.includes("json") ? "json" : "csv";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cve_import_template.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
