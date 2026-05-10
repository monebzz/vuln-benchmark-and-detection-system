export function downloadResultsJSON(data) {
  const payload = {
    report: {
      generated_by: "VulnScan — CodeBERT + Joern",
      filename: data.filename,
      scanned_at: data.scanned_at,
      summary: {
        total_functions: data.total_functions,
        vulnerable_count: data.vulnerable_count,
        safe_count: data.safe_count,
        vulnerability_rate:
          ((data.vulnerable_count / data.total_functions) * 100).toFixed(1) + "%",
      },
      functions: data.results.map((fn) => ({
        name: fn.function_name,
        lines: { start: fn.start_line, end: fn.end_line },
        classification: fn.label,
        confidence: (fn.confidence * 100).toFixed(2) + "%",
        vulnerability_type: fn.vulnerability_type || null,
      })),
    },
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const baseName = data.filename.replace(/\.[^.]+$/, "");
  link.href = url;
  link.download = `vulnscan_${baseName}_${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
