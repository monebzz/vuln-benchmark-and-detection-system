"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CveList } from "@/components/random-10-cve-list";
import { Button } from "@/components/ui/button";
import { Download, Upload, RefreshCw } from "lucide-react";
import { PaginatedCveList } from "../paginated-cve-list";
import { useEffect } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import Background from "../background";

export function DatabaseView() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleCveSelect = (cveId: string) => {
    router.push(`/cve/${cveId}`);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate refresh
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="w-full min-h-screen relative bg-[#0A0A0B]">
      <Background />
      <div className="relative z-10 flex flex-col min-h-screen">
        <DashboardHeader />
        <main className="flex-1 flex flex-col items-center justify-start px-2 md:px-8 py-6 md:py-10">
          <div className="w-full max-w-5xl">
            <Card className="rounded-2xl shadow-none bg-[#111113] border border-white/[0.07]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-semibold text-white">
                  All CVE Records
                </CardTitle>
                <CardDescription className="text-xs text-[#8A8A93]">
                  Browse and search all CVE records in the database
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 md:p-4">
                <PaginatedCveList
                  onSelectCve={handleCveSelect}
                  endpointType="all"
                />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
