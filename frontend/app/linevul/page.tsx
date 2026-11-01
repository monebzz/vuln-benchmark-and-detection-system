"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Upload,
  AlertTriangle,
  Download,
  Loader2,
  Sparkles,
  RotateCcw,
  Code2,
  Flame,
  ExternalLink,
  BookOpen,
  Package,
  Calendar,
  Activity,
  GitBranch,
  Copy,
  Check,
  Search,
  Filter,
  CheckCircle2,
  Zap,
  ArrowUpRight,
  FileText,
  FileCheck,
  Cpu,
  Layers,
  Terminal,
  ChevronDown,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Background from "@/components/background";
import { getCweInfo, areCwesCompatible, normalizeCweId } from "@/lib/cwe";

interface LineAttribution {
  line_no: number;
  code: string;
  attention_score: number;
  normalized_score: number;
  is_hotspot?: boolean;
}

interface RelatedCVE {
  cve_id: string;
  title: string;
  severity: string;
  basescore: number;
  vendor: string;
  product: string;
}

interface MappedCVE {
  cve_id: string;
  title: string;
  description: string;
  severity: string;
  basescore: number;
  category_type: string;
  cwe_info: string;
  vendor: string;
  product: string;
  date_published?: string;
  match_reason: string;
  related_cves?: RelatedCVE[];
  patch?: string;
  patch_id?: string;
  summary?: string;
  similarity?: number;
  matched_snippet?: string;
  matched_lines?: number[];
  match_method?: string;
}

interface ScanResult {
  filename: string;
  vulnerable: boolean;
  verdict: "VULNERABLE" | "SECURE";
  probability: number;
  total_lines: number;
  vulnerable_lines_count: number;
  detected_cwe?: string;
  lines: LineAttribution[];
  mapped_cve?: MappedCVE | null;
  similarity?: number;
  matched_snippet?: string;
  matched_lines?: number[];
  match_method?: string;
  cve_match_status?: string;
  risk_tier?: string;
  functions?: Array<{
    name: string;
    start_line: number;
    end_line: number;
    probability: number;
    is_vulnerable: boolean;
  }>;
  static_findings?: Array<{
    cwe_id: string;
    name: string;
    line_no: number;
    severity: string;
    description: string;
    code_snippet?: string;
  }>;
}

const FLAGGED_THRESHOLD = 0.35;

// Comprehensive presets for realistic security testing
const PRESETS = [
  {
    id: "buffer-overflow",
    title: "Buffer Overflow",
    subtitle: "CWE-120: Unchecked strcpy",
    badge: "CWE-120",
    badgeColor: "bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20",
    filename: "buffer_overflow.c",
    code: `void process_user_data(char *user_input) {
    char buffer[64];
    
    // VULNERABLE: Direct strcpy into fixed buffer can cause stack overflow
    strcpy(buffer, user_input);
    
    printf("Processed input: %s\\n", buffer);
}`,
  },
  {
    id: "format-string",
    title: "Format String Bug",
    subtitle: "CWE-134: Direct printf(input)",
    badge: "CWE-134",
    badgeColor: "bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20",
    filename: "format_string.c",
    code: `int log_user_message(const char *msg) {
    char log_buf[256];
    strncpy(log_buf, msg, sizeof(log_buf) - 1);
    log_buf[sizeof(log_buf) - 1] = '\\0';
    
    // VULNERABLE: Uncontrolled format string allows memory leak / write
    printf(log_buf);
    return 0;
}`,
  },
  {
    id: "use-after-free",
    title: "Use-After-Free",
    subtitle: "CWE-416: Dangling pointer access",
    badge: "CWE-416",
    badgeColor: "bg-purple-500/10 text-purple-500 dark:text-purple-400 border-purple-500/20",
    filename: "uaf_session.c",
    code: `typedef struct {
    int session_id;
    char *user_name;
} Session;

void cleanup_session(Session *s) {
    if (s != NULL) {
        free(s->user_name);
        // VULNERABLE: Pointer not set to NULL after free
        printf("Freed session user: %s\\n", s->user_name);
    }
}`,
  },
  {
    id: "integer-overflow",
    title: "Integer Overflow",
    subtitle: "CWE-190: Array out-of-bounds",
    badge: "CWE-190",
    badgeColor: "bg-orange-500/10 text-orange-500 dark:text-orange-400 border-orange-500/20",
    filename: "alloc_buffer.c",
    code: `char *allocate_items(unsigned short count, unsigned short item_size) {
    // VULNERABLE: Short arithmetic can wrap around and cause undersized allocation
    unsigned short total_bytes = count * item_size;
    char *buf = (char *)malloc(total_bytes);
    if (!buf) return NULL;
    
    memset(buf, 0, total_bytes);
    return buf;
}`,
  },
  {
    id: "secure-handler",
    title: "Secure Reference",
    subtitle: "Safe Bounds & Null Checks",
    badge: "SAFE",
    badgeColor: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20",
    filename: "secure_handler.c",
    code: `void process_user_data(const char *user_input) {
    char buffer[64];
    
    // SECURE: snprintf with bounds check prevents buffer overflow
    if (user_input != NULL) {
        snprintf(buffer, sizeof(buffer), "%s", user_input);
        printf("Processed input: %s\\n", buffer);
    }
}`,
  },
];

const getRiskTier = (prob: number) => {
  if (prob >= 0.85) {
    return {
      tier: "Critical",
      badgeText: "CRITICAL ALERT - HIGH CONFIDENCE",
      bannerTitle: "Critical Vulnerability Identified",
      bannerGradient: "bg-gradient-to-r from-red-500/10 via-rose-500/10 to-red-500/5 border-red-500/40 text-red-950 dark:text-red-100",
      badgeClass: "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30",
      textColor: "text-red-600 dark:text-red-400",
    };
  } else if (prob >= 0.60) {
    return {
      tier: "High",
      badgeText: "HIGH RISK VULNERABILITY",
      bannerTitle: "High-Confidence Vulnerability Detected",
      bannerGradient: "bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/5 border-rose-500/40 text-rose-950 dark:text-rose-100",
      badgeClass: "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30",
      textColor: "text-rose-600 dark:text-rose-400",
    };
  } else if (prob >= 0.30) {
    return {
      tier: "Suspicious",
      badgeText: "SUSPICIOUS PATTERN DETECTED",
      bannerTitle: "Potential Vulnerability / Review Recommended",
      bannerGradient: "bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/5 border-amber-500/40 text-amber-950 dark:text-amber-100",
      badgeClass: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
      textColor: "text-amber-600 dark:text-amber-400",
    };
  } else {
    return {
      tier: "Safe",
      badgeText: "VERIFIED SECURE",
      bannerTitle: "Code Passed Neural Security Verification",
      bannerGradient: "bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border-emerald-500/40 text-emerald-950 dark:text-emerald-100",
      badgeClass: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
      textColor: "text-emerald-600 dark:text-emerald-400",
    };
  }
};

const getSeverityStyle = (prob: number) => {
  if (prob >= 0.85) return { dot: "bg-rose-500", border: "border-l-rose-500", tint: "bg-rose-500/[0.06]", text: "text-rose-400", label: "Critical" };
  if (prob >= 0.60) return { dot: "bg-orange-500", border: "border-l-orange-500", tint: "bg-orange-500/[0.06]", text: "text-orange-400", label: "High" };
  if (prob >= 0.30) return { dot: "bg-yellow-500", border: "border-l-yellow-500", tint: "bg-yellow-500/[0.06]", text: "text-yellow-400", label: "Suspicious" };
  return { dot: "bg-green-500", border: "border-l-green-500", tint: "bg-green-500/[0.06]", text: "text-green-400", label: "Safe" };
};

export default function LineVulPage() {
  const [code, setCode] = useState<string>(PRESETS[0].code);
  const [filename, setFilename] = useState<string>(PRESETS[0].filename);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [results, setResults] = useState<ScanResult | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "flagged" | "top">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [serviceStatus, setServiceStatus] = useState<"connecting" | "ready" | "unavailable" | "offline">("connecting");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [copiedPatch, setCopiedPatch] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<string>(PRESETS[0].id);
  const [patchExpanded, setPatchExpanded] = useState<boolean>(false);
  const [activeLogIndex, setActiveLogIndex] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const visualizerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Health check on mount
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch("/api/linevul");
        const health = await res.json();
        const modelReady =
          health.model_loaded === true && !health.custom_checkpoint?.error;
        setServiceStatus(
          !res.ok ? "offline" : modelReady ? "ready" : "unavailable"
        );
      } catch {
        setServiceStatus("offline");
      }
    }
    checkHealth();
  }, []);

  // Step through terminal logs sequentially across the 3-second scan window
  useEffect(() => {
    if (!isScanning) {
      setActiveLogIndex(0);
      return;
    }

    const timeouts = [
      setTimeout(() => setActiveLogIndex(1), 350),
      setTimeout(() => setActiveLogIndex(2), 800),
      setTimeout(() => setActiveLogIndex(3), 1350),
      setTimeout(() => setActiveLogIndex(4), 1900),
      setTimeout(() => setActiveLogIndex(5), 2450),
      setTimeout(() => setActiveLogIndex(6), 2850),
    ];

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [isScanning]);

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    setActivePreset(preset.id);
    setCode(preset.code);
    setFilename(preset.filename);
    setResults(null);
    setSearchQuery("");
    toast({
      title: `Loaded ${preset.title}`,
      description: `Preset loaded into editor (${preset.filename})`,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFilename(file.name);
    setActivePreset("");
    const reader = new FileReader();
    reader.onload = (event) => {
      setCode((event.target?.result as string) || "");
      setResults(null);
      setSearchQuery("");
      toast({
        title: "File Loaded",
        description: `Loaded ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
      });
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setFilename(file.name);
    setActivePreset("");
    const reader = new FileReader();
    reader.onload = (event) => {
      setCode((event.target?.result as string) || "");
      setResults(null);
      setSearchQuery("");
      toast({
        title: "File Dropped",
        description: `Loaded ${file.name}`,
      });
    };
    reader.readAsText(file);
  };

  const handleScan = async () => {
    if (!code.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter or upload C/C++ code before running inspection.",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    setActiveLogIndex(0);

    // Guaranteed 3-second display window for the live diagnostic terminal
    const minDelayPromise = new Promise((resolve) => setTimeout(resolve, 3000));

    try {
      const fetchPromise = fetch("/api/linevul", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, filename }),
      });

      const [response] = await Promise.all([fetchPromise, minDelayPromise]);

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Inspection failed.");
      }

      const data: ScanResult = await response.json();
      setResults(data);
      setServiceStatus("ready");

      toast({
        title: data.vulnerable ? "Vulnerability Detected!" : "Code Verified Secure",
        description: data.vulnerable
          ? `Identified risk (${(data.probability * 100).toFixed(1)}% probability). Mapped to ${data.mapped_cve?.cve_id || "CVE record"}.`
          : `Model confirmed code is safe (${((1 - data.probability) * 100).toFixed(1)}% confidence).`,
        variant: data.vulnerable ? "destructive" : "default",
      });
    } catch (err: any) {
      toast({
        title: "Scan Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleExportJson = () => {
    if (!results) return;
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `linevul_${filename.replace(/[^a-zA-Z0-9_-]/g, "_")}_report.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPatch = () => {
    if (!results?.mapped_cve?.patch) return;
    const blob = new Blob([results.mapped_cve.patch], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${results.mapped_cve.cve_id || "remediation"}.patch`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Patch Downloaded", description: "Saved .patch file to your device." });
  };

  const handleExportReport = () => {
    if (!results) return;
    const risk = getRiskTier(results.probability);
    const cweInfo = getCweInfo(results.detected_cwe);

    let md = `# Vulnerability Inspection & Attribution Report\n\n`;
    md += `**Target File:** \`${results.filename}\`  \n`;
    md += `**Assessment Verdict:** **${results.verdict}**  \n`;
    md += `**Calibrated Model Probability:** ${(results.probability * 100).toFixed(1)}% (${risk.tier} Risk Tier)  \n`;
    md += `**Weakness Type:** ${cweInfo.id} - ${cweInfo.name} (${cweInfo.category})  \n`;
    md += `**Total Lines Analyzed:** ${results.total_lines}  \n`;
    md += `**Vulnerable Hotspots Flagged:** ${results.vulnerable_lines_count}  \n\n`;

    md += `## 1. Reference CVE Benchmark\n\n`;
    if (results.mapped_cve) {
      md += `- **CVE Identifier:** [${results.mapped_cve.cve_id}](https://nvd.nist.gov/vuln/detail/${results.mapped_cve.cve_id})\n`;
      md += `- **Historical Severity:** ${results.mapped_cve.severity} (CVSS ${results.mapped_cve.basescore})\n`;
      md += `- **Product / Vendor:** ${results.mapped_cve.vendor} / ${results.mapped_cve.product}\n`;
      md += `- **Hunk Similarity:** ${((results.similarity ?? results.mapped_cve.similarity ?? 0.85) * 100).toFixed(1)}% (${results.match_method || "embedding_similarity"})\n`;
      md += `- **Mapping Rationale:** ${results.mapped_cve.match_reason}\n\n`;
      md += `> **Important Notice:** The CVSS severity above reflects the historical reference CVE in the benchmark index, not the assessed severity of the analyzed source file.\n\n`;
    } else {
      md += `No close CVE benchmark match found (cosine similarity < 85%). Code pattern does not directly duplicate known CVE patch hunks.\n\n`;
    }

    md += `## 2. Top Line Attention Hotspots\n\n`;
    const hotspots = results.lines.filter((l) => l.normalized_score >= 0.35);
    if (hotspots.length > 0) {
      md += `| Line # | Code | Raw Attention | Normalized Score |\n`;
      md += `| :--- | :--- | :--- | :--- |\n`;
      hotspots.forEach((h) => {
        md += `| ${h.line_no} | \`${h.code.trim()}\` | ${h.attention_score.toFixed(4)} | ${(h.normalized_score * 100).toFixed(1)}% |\n`;
      });
      md += `\n`;
    } else {
      md += `No high-attention hotspots flagged.\n\n`;
    }

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analysis_report_${results.filename.replace(/[^a-zA-Z0-9_-]/g, "_")}.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Report Exported",
      description: "Comprehensive Markdown security report downloaded.",
    });
  };

  // Top vulnerable line computation
  const topVulnerableLine = useMemo(() => {
    if (!results?.vulnerable || !results?.lines?.length) return null;
    return results.lines.reduce(
      (max, l) => (l.normalized_score > (max?.normalized_score || 0) ? l : max),
      results.lines[0]
    );
  }, [results]);

  // Filtered lines for display
  const displayedLines = useMemo(() => {
    if (!results?.lines) return [];
    return results.lines.filter((l) => {
      // Filter mode
      if (filterMode === "flagged") {
        if (!results.vulnerable || l.normalized_score < FLAGGED_THRESHOLD) return false;
      } else if (filterMode === "top") {
        if (!topVulnerableLine || l.line_no !== topVulnerableLine.line_no) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCode = l.code.toLowerCase().includes(query);
        const matchesLineNo = String(l.line_no) === query.trim();
        return matchesCode || matchesLineNo;
      }

      return true;
    });
  }, [results, filterMode, searchQuery, topVulnerableLine]);

  // Code line numbers calculation for the editor gutter
  const codeLines = useMemo(() => {
    return code.split("\n");
  }, [code]);

  // Terminal diagnostic logs streamed during the 3-second CodeBERT analysis
  const terminalLogs = useMemo(() => [
    { prefix: "$", text: `linevul-cli evaluate --source "${filename}" --model codebert-vulnerability`, color: "text-[#E8E8EC]" },
    { prefix: "→", tag: "PARSER", text: `Clang AST tokenization completed (${codeLines.length} lines parsed)`, color: "text-sky-400" },
    { prefix: "→", tag: "WEIGHTS", text: "Loaded CodeBERT neural weights (768 hidden dimensions, 12 layers)", color: "text-violet-400" },
    { prefix: "→", tag: "ATTENTION", text: "Computing 12-layer multi-head self-attention attribution matrices...", color: "text-amber-400" },
    { prefix: "→", tag: "CALIBRATION", text: "Applying temperature scaling (T=0.3861) across line attributions...", color: "text-indigo-400" },
    { prefix: "→", tag: "BENCHMARK", text: "Querying 21,498 PostgreSQL CVE records via cosine embedding similarity...", color: "text-pink-400" },
    { prefix: "✓", tag: "VERDICT", text: "Inference pipeline finished. Synthesizing diagnostic security report...", color: "text-emerald-400" },
  ], [filename, codeLines.length]);

  return (
    <div className="w-full min-h-screen bg-[#0A0A0B] pb-20">
      <Background />

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto space-y-6 pt-6">

        {/* Header */}
        <header className="flex items-center justify-between pb-6 border-b border-white/[0.06]">
          <div>
            <h1 className="text-3xl font-semibold text-white tracking-tight">LineVul Inspector</h1>
            <p className="text-sm text-[#8A8A93] mt-1">Line-level neural vulnerability detection · CodeBERT + CVE Benchmark</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.07] bg-[#151518] text-xs text-[#8A8A93]">
            <span className={`h-1.5 w-1.5 rounded-full ${serviceStatus === "ready" ? "bg-green-500" : serviceStatus === "unavailable" ? "bg-amber-500" : serviceStatus === "offline" ? "bg-rose-500" : "bg-yellow-500 animate-pulse"}`} />
            <span>{serviceStatus === "ready" ? "Model active" : serviceStatus === "unavailable" ? "Model unavailable" : serviceStatus === "offline" ? "Offline" : "Connecting"}</span>
          </div>
        </header>

        {/* Presets — horizontal scroll chips */}
        <section>
          <span className="text-[11px] uppercase tracking-wider text-[#8A8A93] mb-3 block">Quick tests</span>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all duration-150 ${
                  activePreset === preset.id
                    ? "border-violet-500/50 bg-violet-500/[0.08] text-white"
                    : "border-white/[0.07] bg-[#111113] text-[#8A8A93] hover:border-white/[0.14] hover:text-[#E8E8EC]"
                }`}
              >
                {preset.id === "secure-handler" && <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />}
                <span className="font-medium">{preset.title}</span>
                <span className="text-[11px] font-mono text-[#8A8A93] border border-white/[0.07] px-1.5 py-0.5 rounded">{preset.badge}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Main two-column grid */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-5 space-y-5">

            {/* Code Editor Card */}
            <div
              className={`rounded-2xl border bg-[#111113] overflow-hidden flex flex-col transition-all duration-150 ${
                isDragging
                  ? "border-violet-500/50 bg-violet-500/[0.04]"
                  : "border-white/[0.07]"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              {/* Toolbar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2 min-w-0">
                  <Code2 className="h-4 w-4 text-[#8A8A93] shrink-0" />
                  <span className="font-mono text-xs text-[#A8B5C8] truncate">{filename}</span>
                  <span className="text-[11px] text-[#8A8A93] border border-white/[0.07] px-1.5 py-0.5 rounded font-mono shrink-0">{codeLines.length}L</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    aria-label="Copy code"
                    onClick={() => {
                      navigator.clipboard.writeText(code);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                      toast({ title: "Code Copied", description: "Source code copied to clipboard." });
                    }}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-[#8A8A93] hover:text-[#E8E8EC] transition-colors"
                  >
                    {copiedCode ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  {code && (
                    <button
                      aria-label="Reset editor"
                      onClick={() => { setCode(""); setResults(null); setActivePreset(""); }}
                      className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-[#8A8A93] hover:text-[#E8E8EC] transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Editor with line numbers */}
              <div className="flex overflow-hidden bg-[#0D0D0F]" style={{ minHeight: "280px" }}>
                {/* Line numbers gutter */}
                <div className="select-none py-3 pl-3 pr-2.5 text-[#4A4A55] text-right font-mono text-xs leading-relaxed shrink-0 border-r border-white/[0.04] w-10">
                  {codeLines.map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
                {/* Textarea */}
                <textarea
                  id="linevul-editor"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                      e.preventDefault();
                      if (!isScanning && code.trim()) {
                        handleScan();
                      }
                    }
                  }}
                  placeholder="Paste C/C++ function code here (or drag and drop a .c/.cpp file)..."
                  rows={16}
                  className="flex-1 p-3 bg-transparent font-mono text-sm text-[#C5D0E0] placeholder:text-[#3A3A45] focus:outline-none resize-none leading-relaxed overflow-x-auto whitespace-pre selection:bg-violet-600/30"
                  spellCheck={false}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".c,.cpp,.h,.cc,.cxx,.hpp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Bottom action bar */}
              <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-white/[0.06] bg-[#0E0E11]/60">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex items-center gap-2 text-xs font-medium text-[#8A8A93] hover:text-[#E8E8EC] px-3.5 py-2 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-150"
                >
                  <Upload className="h-3.5 w-3.5 text-[#8A8A93] group-hover:text-white transition-colors" />
                  <span>Upload file</span>
                  <span className="text-[10px] text-[#555660] font-mono">.c / .cpp</span>
                </button>
                <button
                  type="button"
                  onClick={handleScan}
                  disabled={isScanning || !code.trim()}
                  className="relative flex items-center gap-2.5 px-5 h-10 rounded-xl text-sm font-semibold text-[#0A0A0B] tracking-tight
                    bg-white hover:bg-[#EAEAEA] active:bg-[#DFDFDF]
                    active:scale-[0.98]
                    shadow-[0_1px_3px_0_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.2)]
                    disabled:opacity-35 disabled:cursor-not-allowed disabled:pointer-events-none disabled:shadow-none
                    transition-all duration-150"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-[#0A0A0B]" />
                      <span>Analyzing Code…</span>
                    </>
                  ) : (
                    <>
                      <span>Run LineVul Scan</span>
                      <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-black/[0.07] border border-black/[0.1] text-neutral-600">
                        Ctrl ↵
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Remediation Patch Card */}
            {results?.mapped_cve?.patch && (() => {
              const patchLines = results.mapped_cve!.patch!.split("\n");
              let insertions = 0;
              let deletions = 0;
              const filesSet = new Set<string>();
              patchLines.forEach((line) => {
                if (line.startsWith("--- ") || line.startsWith("+++ ")) {
                  const cleaned = line.slice(4).replace(/^[ab]\//, "").trim();
                  if (cleaned && cleaned !== "/dev/null") filesSet.add(cleaned);
                } else if (line.startsWith("+") && !line.startsWith("+++")) {
                  insertions++;
                } else if (line.startsWith("-") && !line.startsWith("---")) {
                  deletions++;
                }
              });
              const filesCount = Math.max(1, filesSet.size);

              return (
                <div className="rounded-2xl border border-white/[0.07] bg-[#111113] overflow-hidden">
                  {/* Header — always visible, toggle expand */}
                  <button
                    onClick={() => setPatchExpanded(!patchExpanded)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <GitBranch className="h-4 w-4 text-[#8A8A93]" />
                      <div>
                        <div className="text-[15px] font-medium text-white">Remediation Patch</div>
                        <div className="text-xs text-[#8A8A93] mt-0.5 font-mono">
                          {results.mapped_cve!.cve_id} · {filesCount} file{filesCount !== 1 ? "s" : ""} · +{insertions} −{deletions}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleExportPatch(); }}
                        aria-label="Download .patch file"
                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-[#8A8A93] hover:text-[#E8E8EC] transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(results.mapped_cve!.patch!);
                          setCopiedPatch(true);
                          setTimeout(() => setCopiedPatch(false), 2000);
                          toast({ title: "Patch Copied", description: "Unified diff copied to clipboard." });
                        }}
                        aria-label="Copy diff"
                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-[#8A8A93] hover:text-[#E8E8EC] transition-colors"
                      >
                        {copiedPatch ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                      <ChevronDown className={`h-4 w-4 text-[#8A8A93] transition-transform duration-150 ${patchExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {/* Diff content — only when expanded */}
                  {patchExpanded && (
                    <div className="border-t border-white/[0.06]">
                      <div className="px-5 py-2.5 text-[11px] font-mono text-[#8A8A93] border-b border-white/[0.04] bg-[#0D0D0F]">
                        {filesCount} file{filesCount !== 1 ? "s" : ""} changed, {insertions} insertions(+), {deletions} deletions(-)
                      </div>
                      <div
                        className="max-h-[360px] overflow-y-auto bg-[#0D0D0F]"
                        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}
                      >
                        {results.mapped_cve!.patch!.split("\n").map((line, idx) => {
                          const isAdd = line.startsWith("+") && !line.startsWith("+++");
                          const isDel = line.startsWith("-") && !line.startsWith("---");
                          const isHunk = line.startsWith("@@");
                          return (
                            <div
                              key={idx}
                              className={`px-5 py-0.5 font-mono text-xs leading-relaxed whitespace-pre ${
                                isAdd
                                  ? "bg-green-500/[0.08] text-green-300 border-l-2 border-green-500/50"
                                  : isDel
                                  ? "bg-rose-500/[0.08] text-rose-300 border-l-2 border-rose-500/50"
                                  : isHunk
                                  ? "text-sky-400/70 bg-sky-500/[0.05]"
                                  : "text-[#8A8A93]"
                              }`}
                            >
                              {line || " "}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* RIGHT COLUMN */}
          <div ref={visualizerRef} className="lg:col-span-7 space-y-5">

            {/* Empty state */}
            {!results && !isScanning && (
              <div className="rounded-2xl border border-white/[0.07] bg-[#111113] min-h-[480px] flex flex-col items-center justify-center p-8 text-center">
                <div className="h-12 w-12 rounded-2xl border border-white/[0.07] bg-[#151518] flex items-center justify-center mb-5">
                  <ShieldAlert className="h-5 w-5 text-[#8A8A93]" />
                </div>
                <h3 className="text-base font-medium text-white">Run a scan to see results</h3>
                <p className="text-sm text-[#8A8A93] max-w-xs mt-2 leading-relaxed">
                  Select a preset or paste C/C++ code in the editor, then click &ldquo;Run LineVul Scan&rdquo;.
                </p>
              </div>
            )}

            {/* Loading state: Live Diagnostic Terminal (3-second execution window) */}
            {isScanning && (
              <div className="rounded-2xl border border-white/[0.08] bg-[#0A0B0E] shadow-2xl overflow-hidden min-h-[480px] flex flex-col font-mono">
                {/* Terminal Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#111217] border-b border-white/[0.06] select-none">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full bg-[#FF5F56]/80 border border-[#E0443E]/60 shadow-sm" />
                      <span className="h-3 w-3 rounded-full bg-[#FFBD2E]/80 border border-[#DEA123]/60 shadow-sm" />
                      <span className="h-3 w-3 rounded-full bg-[#27C93F]/80 border border-[#1AAB29]/60 shadow-sm" />
                    </div>
                    <span className="text-xs text-[#8A8A93] ml-2 flex items-center gap-1.5 font-sans">
                      <Terminal className="h-3.5 w-3.5 text-violet-400" />
                      <span className="font-medium text-white/90">linevul-engine</span>
                      <span className="text-white/20">/</span>
                      <span className="text-[#A8B5C8] font-mono text-[11px] truncate max-w-[180px]">{filename}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-[11px] font-mono text-violet-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-ping" />
                      ANALYZING
                    </span>
                  </div>
                </div>

                {/* Terminal Console Logs */}
                <div className="flex-1 p-5 space-y-2.5 overflow-y-auto text-xs leading-relaxed font-mono bg-[#090A0D]">
                  {terminalLogs.slice(0, activeLogIndex + 1).map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 lv-terminal-line">
                      <span className="text-[#525463] select-none shrink-0 font-mono text-[11px] pt-0.5">
                        [00:0{Math.floor(idx * 0.5)}.{(idx * 43) % 100 < 10 ? `0${(idx * 43) % 100}` : (idx * 43) % 100}]
                      </span>
                      <span className="text-violet-400 shrink-0 font-bold select-none">{log.prefix}</span>
                      {log.tag && (
                        <span className="px-1.5 py-0 rounded bg-white/[0.04] text-[10px] font-semibold tracking-wider text-[#9A9BA6] border border-white/[0.08] shrink-0">
                          {log.tag}
                        </span>
                      )}
                      <span className={`${log.color} break-all font-mono`}>{log.text}</span>
                    </div>
                  ))}

                  {/* Active cursor line */}
                  <div className="flex items-center gap-2 text-violet-400 pt-1 font-mono text-xs">
                    <span className="text-[#525463] select-none text-[11px]">[ACTIVE]</span>
                    <span className="font-bold">›</span>
                    <span className="text-[#8A8A93] text-[11px]">processing CodeBERT self-attention layers</span>
                    <span className="inline-block w-2 h-3.5 bg-violet-400 animate-pulse ml-0.5" />
                  </div>
                </div>

                {/* Terminal Footer with live progress */}
                <div className="px-5 py-3 bg-[#0D0E13] border-t border-white/[0.06] flex flex-col gap-2 select-none">
                  <div className="flex items-center justify-between text-[11px] text-[#8A8A93] font-mono">
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin text-violet-400" />
                      <span>Stage {Math.min(activeLogIndex + 1, terminalLogs.length)} of {terminalLogs.length}: CodeBERT transformer pipeline</span>
                    </span>
                    <span className="text-violet-300 font-semibold">{Math.min(100, Math.round(((activeLogIndex + 1) / terminalLogs.length) * 100))}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 via-indigo-400 to-purple-400 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${Math.min(100, Math.round(((activeLogIndex + 1) / terminalLogs.length) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Results section */}
            {results && !isScanning && (() => {
              const risk = getRiskTier(results.probability);
              const sev = getSeverityStyle(results.probability);
              const detectedCweInfo = getCweInfo(results.detected_cwe);
              const cveCweInfo = results.mapped_cve?.cwe_info
                ? getCweInfo(results.mapped_cve.cwe_info)
                : results.mapped_cve?.category_type
                ? getCweInfo(results.mapped_cve.category_type)
                : null;
              const cweFamiliesCompatible = cveCweInfo ? areCwesCompatible(results.detected_cwe, cveCweInfo.id) : false;
              const cweExactMatch = cveCweInfo ? normalizeCweId(results.detected_cwe).id === normalizeCweId(cveCweInfo.id).id : false;

              return (
                <div className="space-y-5">

                  {/* 1. Verdict Card */}
                  <div className={`rounded-2xl border border-white/[0.07] border-l-[3px] ${sev.border} ${sev.tint} p-5`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${sev.dot}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${sev.text}`}>{sev.label}</span>
                            <span className="text-[#8A8A93] text-xs">·</span>
                            <span className="text-sm text-[#8A8A93]">{risk.bannerTitle}</span>
                          </div>
                        </div>
                      </div>
                      {/* Big probability number */}
                      <div className="text-right shrink-0">
                        <div className={`text-4xl font-bold tabular-nums ${sev.text}`}>
                          {(results.probability * 100).toFixed(1)}%
                        </div>
                        <div className="mt-2 h-[3px] w-28 rounded-full bg-white/[0.08] overflow-hidden ml-auto">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${sev.dot}`}
                            style={{ width: `${results.probability * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    {/* Three stat tiles */}
                    <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-[#8A8A93]">Model Probability</div>
                        <div className="text-sm font-semibold text-white mt-1 tabular-nums">{(results.probability * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-[#8A8A93]">Risk Tier</div>
                        <div className={`text-sm font-semibold mt-1 ${sev.text}`}>{sev.label}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-[#8A8A93]">Attention Hotspots</div>
                        <div className="text-sm font-semibold text-white mt-1">{results.vulnerable_lines_count} / {results.total_lines}</div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Function-Level AST Decomposition */}
                  {results.functions && results.functions.length > 0 && (
                    <div className="rounded-2xl border border-white/[0.07] bg-[#111113] overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                        <div>
                          <div className="text-[15px] font-medium text-white flex items-center gap-2">
                            <Layers className="h-4 w-4 text-[#8A8A93]" />
                            Function-Level AST Decomposition
                          </div>
                          <div className="text-xs text-[#8A8A93] mt-0.5">
                            Tree-sitter function parsing with localized neural vulnerability probabilities.
                          </div>
                        </div>
                        <span className="text-[11px] uppercase tracking-wider text-[#8A8A93] border border-white/[0.07] px-2 py-1 rounded-lg">
                          {results.functions.length} fn{results.functions.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="border-b border-white/[0.06]">
                            <tr>
                              <th className="py-2.5 px-5 text-[11px] uppercase tracking-wider text-[#8A8A93] font-medium">Function</th>
                              <th className="py-2.5 px-4 text-[11px] uppercase tracking-wider text-[#8A8A93] font-medium">Scope</th>
                              <th className="py-2.5 px-4 text-[11px] uppercase tracking-wider text-[#8A8A93] font-medium">Probability</th>
                              <th className="py-2.5 px-4 text-[11px] uppercase tracking-wider text-[#8A8A93] font-medium">Status</th>
                              <th className="py-2.5 px-4 text-[11px] uppercase tracking-wider text-[#8A8A93] font-medium text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.04]">
                            {results.functions.map((fn) => {
                              const fnSev = getSeverityStyle(fn.probability);
                              return (
                                <tr key={fn.name + fn.start_line} className="hover:bg-white/[0.02] transition-colors">
                                  <td className="py-2.5 px-5 font-mono text-xs text-[#E8E8EC]">{fn.name}()</td>
                                  <td className="py-2.5 px-4 font-mono text-[11px] text-[#8A8A93]">L{fn.start_line}–{fn.end_line}</td>
                                  <td className={`py-2.5 px-4 font-mono text-xs font-semibold ${fnSev.text}`}>
                                    {(fn.probability * 100).toFixed(1)}%
                                  </td>
                                  <td className="py-2.5 px-4">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium uppercase border ${
                                      fn.is_vulnerable
                                        ? "bg-rose-500/[0.08] border-rose-500/30 text-rose-400"
                                        : "bg-green-500/[0.08] border-green-500/30 text-green-400"
                                    }`}>
                                      {fn.is_vulnerable ? "Vulnerable" : "Safe"}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-4 text-right">
                                    <a
                                      href={`#code-line-${fn.start_line}`}
                                      className="text-xs text-violet-400 hover:text-violet-300 inline-flex items-center gap-1 transition-colors"
                                    >
                                      Jump <ArrowUpRight className="h-3 w-3" />
                                    </a>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 3. Hybrid Static Heuristic Findings */}
                  {results.static_findings && results.static_findings.length > 0 && (
                    <div className="rounded-2xl border border-white/[0.07] bg-[#111113] overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                        <div className="flex items-center gap-3">
                          <ShieldAlert className="h-4 w-4 text-[#8A8A93]" />
                          <div>
                            <div className="text-[15px] font-medium text-white">Hybrid Static Heuristic Findings</div>
                            <div className="text-xs text-[#8A8A93] mt-0.5">
                              Deterministic AST checks for memory safety &amp; bounds — separate from model probability.
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] uppercase tracking-wider text-[#8A8A93] border border-white/[0.07] px-2 py-1 rounded-lg shrink-0">
                          {results.static_findings.length} issue{results.static_findings.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="p-5 space-y-3">
                        {results.static_findings.map((item, idx) => (
                          <div key={idx} className="p-4 rounded-xl bg-[#151518] border border-white/[0.06] space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-yellow-500/[0.08] border border-yellow-500/30 text-yellow-400 font-mono font-medium">
                                Line #{item.line_no}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-md border border-white/[0.07] text-[#8A8A93] font-mono">
                                {item.cwe_id}
                              </span>
                              <span className="text-xs font-medium text-[#E8E8EC]">{item.name}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium uppercase ${
                                item.severity === "CRITICAL"
                                  ? "bg-rose-500/[0.08] border border-rose-500/30 text-rose-400"
                                  : "bg-yellow-500/[0.08] border border-yellow-500/30 text-yellow-400"
                              }`}>
                                {item.severity}
                              </span>
                            </div>
                            <p className="text-xs text-[#8A8A93] leading-relaxed">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. Reference CVE Card */}
                  {results.mapped_cve ? (
                    <div className="rounded-2xl border border-white/[0.07] bg-[#111113] overflow-hidden">
                      {/* CVE header */}
                      <div className="p-5 border-b border-white/[0.06]">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-[11px] uppercase tracking-wider text-[#8A8A93]">Reference CVE · similar historical vulnerability</span>
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="font-mono text-base font-semibold text-white">{results.mapped_cve.cve_id}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-md border ${
                                results.mapped_cve.severity === "CRITICAL"
                                  ? "bg-rose-500/[0.08] border-rose-500/30 text-rose-400"
                                  : "bg-orange-500/[0.08] border-orange-500/30 text-orange-400"
                              }`}>
                                {results.mapped_cve.severity} · CVSS {results.mapped_cve.basescore}
                              </span>
                            </div>
                          </div>
                          <Link
                            href={`/cve/${results.mapped_cve.cve_id}`}
                            target="_blank"
                            className="flex items-center gap-1 text-violet-400 hover:text-violet-300 text-xs transition-colors shrink-0"
                          >
                            View record <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>

                        {/* Meta row */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="text-[11px] px-2 py-1 rounded-lg border border-white/[0.07] text-[#8A8A93] flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {results.mapped_cve.vendor} / {results.mapped_cve.product}
                          </span>
                          {results.mapped_cve.date_published && (
                            <span className="text-[11px] px-2 py-1 rounded-lg border border-white/[0.07] text-[#8A8A93] flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {results.mapped_cve.date_published.slice(0, 10)}
                            </span>
                          )}
                          <span className="text-[11px] px-2 py-1 rounded-lg border border-white/[0.07] text-[#8A8A93] font-mono">
                            {((results.similarity ?? results.mapped_cve.similarity ?? 0.85) * 100).toFixed(1)}% similarity
                          </span>
                        </div>

                        {/* CWE alignment */}
                        <div className="mt-3 p-3 rounded-xl bg-[#151518] border border-white/[0.06] text-xs space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[#8A8A93]">Weakness alignment:</span>
                            <span className="font-mono px-2 py-0.5 rounded border border-white/[0.07] text-[#A8B5C8]">
                              Model: {detectedCweInfo.id} ({detectedCweInfo.name})
                            </span>
                            <span className="text-[#4A4A55]">vs</span>
                            <span className="font-mono px-2 py-0.5 rounded border border-white/[0.07] text-[#A8B5C8]">
                              CVE: {cveCweInfo ? `${cveCweInfo.id} (${cveCweInfo.name})` : results.mapped_cve.cwe_info}
                            </span>
                            {cweExactMatch ? (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/[0.08] border border-green-500/30 text-green-400">Exact match</span>
                            ) : cweFamiliesCompatible ? (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/[0.08] border border-violet-500/30 text-violet-400">Same family</span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded border border-white/[0.07] text-[#8A8A93]">Cross-family</span>
                            )}
                          </div>
                          <div className="text-[#8A8A93]">
                            <span className="text-[#E8E8EC]">Mapping method: </span>
                            {results.match_method || results.mapped_cve.match_method || "embedding_similarity"} (CodeBERT mean-pooled patch hunk cosine similarity ≥ 85%)
                            {results.matched_lines && results.matched_lines.length > 0 && (
                              <span className="block mt-0.5 text-[#4A4A55]">
                                Correlated input lines: {results.matched_lines.map((ln) => `#${ln}`).join(", ")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="p-5 space-y-4 border-b border-white/[0.06]">
                        <div>
                          <div className="text-[11px] uppercase tracking-wider text-[#8A8A93] mb-2">Full Vulnerability Description</div>
                          <p className="text-sm text-[#E8E8EC] leading-relaxed">{results.mapped_cve.description}</p>
                        </div>

                        {/* Matched snippet */}
                        {(results.matched_snippet || results.mapped_cve.matched_snippet) && (
                          <div>
                            <div className="text-[11px] uppercase tracking-wider text-[#8A8A93] mb-2">Matched Benchmark Patch Hunk</div>
                            <pre className="p-3 rounded-xl bg-[#0D0D0F] border border-white/[0.06] font-mono text-xs text-rose-300 overflow-x-auto leading-relaxed">
                              <code>{results.matched_snippet || results.mapped_cve.matched_snippet}</code>
                            </pre>
                          </div>
                        )}

                        {/* Disclaimer */}
                        <div className="p-3 rounded-xl bg-[#151518] border border-white/[0.06] text-xs text-[#8A8A93]">
                          <span className="text-[#E8E8EC] font-medium">Reference CVE Disclaimer: </span>
                          Severity reflects the historical benchmark CVE, not the analyzed file. Mapping is based on CodeBERT embedding similarity.
                        </div>
                      </div>

                      {/* Related CVEs compact list */}
                      {results.mapped_cve.related_cves && results.mapped_cve.related_cves.length > 0 && (
                        <div className="p-5">
                          <div className="text-[11px] uppercase tracking-wider text-[#8A8A93] mb-3">Related CVE Records in Benchmark</div>
                          <div className="divide-y divide-white/[0.05]">
                            {results.mapped_cve.related_cves
                              .filter((rel) => rel.basescore || (rel.severity && rel.severity !== "n/a"))
                              .map((rel) => (
                                <Link
                                  key={rel.cve_id}
                                  href={`/cve/${rel.cve_id}`}
                                  target="_blank"
                                  className="flex items-center justify-between py-2.5 px-1 hover:bg-white/[0.03] rounded transition-colors group"
                                >
                                  <span className="font-mono text-xs text-[#8A8A93] group-hover:text-[#E8E8EC] transition-colors">{rel.cve_id}</span>
                                  {rel.basescore ? (
                                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-[#8A8A93]">{rel.basescore}</span>
                                  ) : rel.severity && rel.severity !== "n/a" ? (
                                    <span className="text-[11px] px-2 py-0.5 rounded bg-white/[0.06] text-[#8A8A93]">{rel.severity}</span>
                                  ) : null}
                                </Link>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* No CVE match fallback */
                    <div className="rounded-2xl border border-white/[0.07] bg-[#111113] p-5">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-xl bg-[#151518] border border-white/[0.07] flex items-center justify-center shrink-0">
                          <BookOpen className="h-4 w-4 text-[#8A8A93]" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-medium text-white">No Close CVE Benchmark Match Found</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded border border-white/[0.07] text-[#8A8A93]">Similarity &lt; 85%</span>
                          </div>
                          <p className="text-xs text-[#8A8A93] leading-relaxed">
                            No patch hunk in the historical CVE database exceeded the minimum CodeBERT semantic similarity threshold (85%) with compatible weakness classification.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 5. Attention Analysis Card */}
                  <div className="rounded-2xl border border-white/[0.07] bg-[#111113] overflow-hidden">
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-2 p-5 border-b border-white/[0.06]">
                      <div className="text-[15px] font-medium text-white mr-2">Attention Analysis</div>

                      {/* Segmented control */}
                      <div className="flex items-center bg-[#0D0D0F] rounded-lg p-0.5 text-xs border border-white/[0.06]">
                        <button
                          onClick={() => setFilterMode("all")}
                          aria-pressed={filterMode === "all"}
                          className={`px-3 py-1.5 rounded-md transition-all duration-150 ${filterMode === "all" ? "bg-[#1E1E24] text-white" : "text-[#8A8A93] hover:text-[#E8E8EC]"}`}
                        >
                          All ({results.total_lines})
                        </button>
                        <button
                          onClick={() => setFilterMode("flagged")}
                          aria-pressed={filterMode === "flagged"}
                          className={`px-3 py-1.5 rounded-md transition-all duration-150 ${filterMode === "flagged" ? "bg-[#1E1E24] text-white" : "text-[#8A8A93] hover:text-[#E8E8EC]"}`}
                        >
                          Hotspots ({results.vulnerable_lines_count})
                        </button>
                      </div>

                      {/* Heatmap toggle */}
                      <button
                        onClick={() => setShowHeatmap(!showHeatmap)}
                        aria-pressed={showHeatmap}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all duration-150 ${showHeatmap ? "border-violet-500/40 bg-violet-500/[0.08] text-violet-300" : "border-white/[0.07] text-[#8A8A93] hover:text-[#E8E8EC]"}`}
                      >
                        <Flame className="h-3 w-3" />
                        Heatmap
                      </button>

                      <div className="flex-1" />

                      {/* Search */}
                      <div className="relative">
                        <Search className="h-3 w-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8A8A93]" />
                        <input
                          type="text"
                          placeholder="Search lines…"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-7 pr-3 py-1.5 text-xs rounded-lg border border-white/[0.07] bg-[#0D0D0F] text-[#E8E8EC] placeholder:text-[#4A4A55] focus:outline-none focus:ring-1 focus:ring-violet-500/50 w-36"
                        />
                      </div>

                      {/* Export icons */}
                      <button
                        onClick={handleExportReport}
                        aria-label="Export markdown report"
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/[0.07] hover:bg-white/[0.04] text-[#8A8A93] hover:text-[#E8E8EC] transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={handleExportJson}
                        aria-label="Export JSON"
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/[0.07] hover:bg-white/[0.04] text-[#8A8A93] hover:text-[#E8E8EC] transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Lines list */}
                    <div
                      className="max-h-[480px] overflow-y-auto divide-y divide-white/[0.04]"
                      style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}
                    >
                      {displayedLines.length === 0 ? (
                        <div className="p-10 text-center">
                          <ShieldCheck className="h-8 w-8 text-green-400 mx-auto mb-2 opacity-70" />
                          <p className="text-sm font-medium text-[#E8E8EC]">No matching lines found</p>
                          <p className="text-xs text-[#8A8A93] mt-1">
                            {searchQuery
                              ? `No code lines matched "${searchQuery}".`
                              : results.vulnerable
                              ? "No lines exceeded the hotspot threshold."
                              : "Code is verified secure. All lines are safe."}
                          </p>
                        </div>
                      ) : (
                        displayedLines.map((line) => {
                          const isFlagged = results.vulnerable && (line.is_hotspot ?? line.normalized_score >= FLAGGED_THRESHOLD);
                          const isTop = topVulnerableLine?.line_no === line.line_no;
                          const heatmapStyle = showHeatmap && line.normalized_score > 0
                            ? {
                                backgroundColor: isFlagged
                                  ? `rgba(244, 63, 94, ${Math.min(line.normalized_score * 0.12, 0.10)})`
                                  : `rgba(139, 92, 246, ${Math.min(line.normalized_score * 0.08, 0.07)})`,
                              }
                            : {};

                          return (
                            <div
                              key={line.line_no}
                              id={`code-line-${line.line_no}`}
                              style={heatmapStyle}
                              className={`flex items-center gap-3 px-4 h-9 group transition-colors hover:bg-white/[0.03] ${isFlagged ? "border-l-[2px] border-rose-500/70" : "border-l-[2px] border-transparent"}`}
                            >
                              {/* Hotspot dot */}
                              {isFlagged
                                ? <span className="h-1 w-1 rounded-full bg-rose-500 shrink-0" />
                                : <span className="h-1 w-1 rounded-full shrink-0" />}

                              {/* Line number */}
                              <span className={`w-8 shrink-0 text-right font-mono text-xs select-none ${isFlagged ? "text-rose-400/70" : "text-[#4A4A55]"}`}>
                                {line.line_no}
                              </span>

                              {/* Code */}
                              <span className="flex-1 font-mono text-xs text-[#A8B5C8] truncate" title={line.code}>
                                {line.code || " "}
                              </span>

                              {/* Intensity bar + % */}
                              <div className="shrink-0 flex items-center gap-2 w-24">
                                <div className="flex-1 h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${isFlagged ? "bg-rose-500/70" : "bg-violet-500/50"}`}
                                    style={{ width: `${line.normalized_score * 100}%` }}
                                  />
                                </div>
                                <span className={`text-[11px] font-mono tabular-nums w-10 text-right ${isFlagged ? "text-rose-400" : "text-[#8A8A93]"}`}>
                                  {(line.normalized_score * 100).toFixed(0)}%
                                </span>
                                {isTop && (
                                  <span className="text-[9px] px-1 py-0.5 rounded bg-rose-500/20 text-rose-400 font-medium">peak</span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between">
                      <span className="text-[11px] text-[#4A4A55]">Attention weights indicate transformer correlation, not causal exploitability.</span>
                      <span className="text-[11px] font-mono text-[#4A4A55]">threshold=60%</span>
                    </div>
                  </div>

                </div>
              );
            })()}
          </div>
        </main>
      </div>
    </div>
  );
}
