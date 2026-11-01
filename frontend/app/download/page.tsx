"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Globe,
  Download,
  FileText,
  Code2,
  GitBranch,
  Phone,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import Background from "@/components/background";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  downloadAndroidZip,
  downloadChromiumZip,
  downloadGithubZip,
  downloadGitLabZip,
  downloadKernelZip,
} from "@/lib/cve_data_download";

export default function DownloadPage() {
  return (
    <div className="w-full min-h-screen relative">
      <Background />
      <div className="relative z-10">
        <DashboardHeader />
        <div className="flex flex-col items-center justify-center min-h-[80vh] py-10 px-4">
          <Card className="w-full max-w-2xl border border-white/[0.07] rounded-xl bg-[#111113] shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-center text-white tracking-tight">
                Download Center
              </CardTitle>
              <CardDescription className="text-center mt-1.5 text-xs text-[#8A8A93] max-w-lg mx-auto leading-relaxed">
                Access curated CVE vulnerability records, commit patches, and dataset dumps for offline research, machine learning benchmarks, and security automation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* CVE Data Download */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#151518] border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                <div className="w-9 h-9 rounded-lg bg-[#0D0D0F] border border-white/[0.08] flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-white">
                    CVE Records
                  </div>
                  <div className="text-xs text-[#8A8A93] line-clamp-1">
                    Download latest CVE vulnerability records in JSON format.
                  </div>
                </div>
                <Button
                  asChild
                  size="sm"
                  className="h-8 px-3 rounded-lg bg-white hover:bg-[#EAEAEA] active:bg-[#DFDFDF] text-[#0A0A0B] text-xs font-medium shrink-0"
                >
                  <a href="https://github.com/CVEProject/cvelistV5/archive/refs/heads/main.zip">
                    <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                  </a>
                </Button>
              </div>

              {/* GitHub Patch Data Download */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#151518] border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                <div className="w-9 h-9 rounded-lg bg-[#0D0D0F] border border-white/[0.08] flex items-center justify-center shrink-0">
                  <Code2 className="h-4 w-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-white">
                    GitHub Patch Data
                  </div>
                  <div className="text-xs text-[#8A8A93] line-clamp-1">
                    Curated patch and commit data from GitHub repositories.
                  </div>
                </div>
                <Button
                  size="sm"
                  className="h-8 px-3 rounded-lg bg-white hover:bg-[#EAEAEA] active:bg-[#DFDFDF] text-[#0A0A0B] text-xs font-medium shrink-0"
                  onClick={downloadGithubZip}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                </Button>
              </div>

              {/* Kernel Patch Details Download */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#151518] border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                <div className="w-9 h-9 rounded-lg bg-[#0D0D0F] border border-white/[0.08] flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-white">
                    Kernel Patch Data
                  </div>
                  <div className="text-xs text-[#8A8A93] line-clamp-1">
                    Curated patch data from Kernel Sites related to CVEs.
                  </div>
                </div>
                <Button
                  size="sm"
                  className="h-8 px-3 rounded-lg bg-white hover:bg-[#EAEAEA] active:bg-[#DFDFDF] text-[#0A0A0B] text-xs font-medium shrink-0"
                  onClick={downloadKernelZip}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                </Button>
              </div>

              {/* GitLab */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#151518] border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                <div className="w-9 h-9 rounded-lg bg-[#0D0D0F] border border-white/[0.08] flex items-center justify-center shrink-0">
                  <GitBranch className="h-4 w-4 text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-white">
                    GitLab Patch Data
                  </div>
                  <div className="text-xs text-[#8A8A93] line-clamp-1">
                    Curated patch and commit data from GitLab repositories.
                  </div>
                </div>
                <Button
                  size="sm"
                  className="h-8 px-3 rounded-lg bg-white hover:bg-[#EAEAEA] active:bg-[#DFDFDF] text-[#0A0A0B] text-xs font-medium shrink-0"
                  onClick={downloadGitLabZip}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                </Button>
              </div>

              {/* Chromium */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#151518] border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                <div className="w-9 h-9 rounded-lg bg-[#0D0D0F] border border-white/[0.08] flex items-center justify-center shrink-0">
                  <Globe className="h-4 w-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-white">
                    Chromium Google Source Patch Data
                  </div>
                  <div className="text-xs text-[#8A8A93] line-clamp-1">
                    Curated patch data from Chromium Google Source repositories.
                  </div>
                </div>
                <Button
                  size="sm"
                  className="h-8 px-3 rounded-lg bg-white hover:bg-[#EAEAEA] active:bg-[#DFDFDF] text-[#0A0A0B] text-xs font-medium shrink-0"
                  onClick={downloadChromiumZip}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                </Button>
              </div>

              {/* Android */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#151518] border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                <div className="w-9 h-9 rounded-lg bg-[#0D0D0F] border border-white/[0.08] flex items-center justify-center shrink-0">
                  <Smartphone className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-white">
                    Android Google Source Patch Data
                  </div>
                  <div className="text-xs text-[#8A8A93] line-clamp-1">
                    Curated patch data from Android Google Source repositories.
                  </div>
                </div>
                <Button
                  size="sm"
                  className="h-8 px-3 rounded-lg bg-white hover:bg-[#EAEAEA] active:bg-[#DFDFDF] text-[#0A0A0B] text-xs font-medium shrink-0"
                  onClick={downloadAndroidZip}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                </Button>
              </div>
            </CardContent>
          </Card>
          <div className="mt-6 text-center text-xs font-mono text-[#8A8A93] max-w-md">
            <p>
              Datasets are refreshed on regular cycles and provided in standard archive formats for integration with research tooling and scripts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
