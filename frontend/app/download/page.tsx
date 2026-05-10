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
  Chrome,
  ChromeIcon,
  Download,
  FileText,
  Github,
  Gitlab,
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
        <div className="flex flex-col items-center justify-center min-h-[80vh] py-8 px-4">
          <Card className="w-full max-w-2xl shadow-lg border border-gray-200 dark:border-white/10 rounded-2xl bg-white dark:bg-[rgb(29,41,56)]">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                Download Center
              </CardTitle>
              <CardDescription className="text-center mt-2 text-base text-gray-600 dark:text-gray-300">
                Access and download the latest CVE data, GitHub patch datasets,
                and vulnerability details. Choose the dataset you need and click
                the download button. All files are provided in convenient
                formats for research and analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 mt-2">
              {/* CVE Data Download */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-[rgba(45,65,85,0.8)]">
                <ShieldCheck className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                <div className="flex-1">
                  <div className="font-semibold text-lg text-gray-900 dark:text-white">
                    CVE Records
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Download the latest CVE vulnerability records in JSON format
                    for offline analysis and integration.
                  </div>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="border-blue-500 text-blue-600 dark:text-blue-300 dark:border-blue-400 rounded-xl transition-all duration-150 shadow-sm hover:shadow-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 active:scale-95 focus:ring-2 focus:ring-blue-400"
                >
                  <a href="https://github.com/CVEProject/cvelistV5/archive/refs/heads/main.zip">
                    <Download className="mr-2" /> Download
                  </a>
                </Button>
              </div>
              {/* GitHub Patch Data Download */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-[rgba(45,65,85,0.8)]">
                <Github className="h-8 w-8 text-gray-800 dark:text-white" />
                <div className="flex-1">
                  <div className="font-semibold text-lg text-gray-900 dark:text-white">
                    GitHub Patch Data
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Get curated patch and commit data from GitHub repositories
                    related to CVEs, useful for vulnerability research and
                    automation.
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-gray-500 text-gray-700 dark:text-gray-200 dark:border-gray-400 rounded-xl transition-all duration-150 shadow-sm hover:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-800/40 active:scale-95 focus:ring-2 focus:ring-gray-400"
                  onClick={downloadGithubZip}
                >
                  <Download className="mr-2" /> Download
                </Button>
              </div>
              {/* Patch Details Download */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-[rgba(45,65,85,0.8)]">
                <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
                <div className="flex-1">
                  <div className="font-semibold text-lg text-gray-900 dark:text-white">
                    Kernel Patch Data
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Get curated patch and commit data from Kernel Sites related
                    to CVEs, useful for vulnerability research and automation.
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-green-500 text-green-700 dark:text-green-300 dark:border-green-400 rounded-xl transition-all duration-150 shadow-sm hover:shadow-lg hover:bg-green-50 dark:hover:bg-green-900/30 active:scale-95 focus:ring-2 focus:ring-green-400"
                  onClick={downloadKernelZip}
                >
                  <Download className="mr-2" /> Download
                </Button>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-[rgba(45,65,85,0.8)]">
                <Gitlab className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                <div className="flex-1">
                  <div className="font-semibold text-lg text-gray-900 dark:text-white">
                    GitLab Patch Data
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Get curated patch and commit data from GitLab Sites related
                    to CVEs, useful for vulnerability research and automation.
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-orange-500 text-orange-700 dark:text-orange-300 dark:border-orange-400 rounded-xl transition-all duration-150 shadow-sm hover:shadow-lg hover:bg-orange-50 dark:hover:bg-orange-900/30 active:scale-95 focus:ring-2 focus:ring-orange-400"
                  onClick={downloadGitLabZip}
                >
                  <Download className="mr-2" /> Download
                </Button>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-[rgba(45,65,85,0.8)]">
                <Chrome className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                  <div className="font-semibold text-lg text-gray-900 dark:text-white">
                    Chromium Google Source Patch Data
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Get curated patch and commit data from Chromium Google
                    Source Sites related to CVEs, useful for vulnerability
                    research and automation.
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-blue-500 text-blue-700 dark:text-blue-300 dark:border-blue-400 rounded-xl transition-all duration-150 shadow-sm hover:shadow-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 active:scale-95 focus:ring-2 focus:ring-blue-400"
                  onClick={downloadChromiumZip}
                >
                  <Download className="mr-2" /> Download
                </Button>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-[rgba(45,65,85,0.8)]">
                <Smartphone className="h-8 w-8 text-red-600 dark:text-red-400" />
                <div className="flex-1">
                  <div className="font-semibold text-lg text-gray-900 dark:text-white">
                    Android Google Source Patch Data
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Get curated patch and commit data from Android Google Source
                    Sites related to CVEs, useful for vulnerability research and
                    automation.
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-red-500 text-red-700 dark:text-red-300 dark:border-red-400 rounded-xl transition-all duration-150 shadow-sm hover:shadow-lg hover:bg-red-50 dark:hover:bg-red-900/30 active:scale-95 focus:ring-2 focus:ring-red-400"
                  onClick={downloadAndroidZip}
                >
                  <Download className="mr-2" /> Download
                </Button>
              </div>
            </CardContent>
          </Card>
          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 max-w-xl">
            <p>
              <strong>How to use:</strong> Click any download button above to
              get the latest data. Files are updated regularly and provided in
              JSON format for easy import into your tools or scripts. For
              questions or custom data requests, contact the system
              administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
