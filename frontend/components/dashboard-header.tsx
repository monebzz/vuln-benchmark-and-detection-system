"use client";

import Link from "next/link";
import { Menu, Search, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { ThemeToggle } from "./theme-toggle";

export function DashboardHeader() {
  const router = useRouter();
  const { toggleSidebar } = useSidebar();

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Only navigate, do not call searchCves here
  const handleSearch = useCallback(
    (searchTerm: string) => {
      if (!searchTerm.trim()) return;
      setLoading(true);
      try {
        router.push(`/searchResult?q=${encodeURIComponent(searchTerm)}`);
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch(query);
    }
  };

  return (
    <header
      className="
        sticky top-0 z-30 h-16 m-2 mx-2 md:mx-8 rounded-2xl
        border border-white/[0.07]
        transition-all duration-300
        bg-[#111113]/90 backdrop-blur-md text-white shadow-sm
      "
    >
      <div className="flex h-full items-center gap-4 px-4 md:px-6">
        {/* Sidebar toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="
            text-[#8A8A93] hover:text-white hover:bg-white/[0.06] rounded-xl
          "
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Title */}
        <div className="flex-1 truncate">
          <h1 className="text-base md:text-lg font-semibold text-white tracking-tight">
            Vulnerability Benchmark System
          </h1>
        </div>

        {/* Search Input */}
        <div
          className="
            hidden sm:flex items-center w-40 md:w-1/2 rounded-xl px-3 py-0.5
            bg-[#0D0D0F] border border-white/[0.07]
            transition-all focus-within:border-white/20
          "
        >
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={loading ? "Searching..." : "Search CVEs by ID, vendor, product..."}
            className="
              w-full bg-transparent border-0 outline-none ring-0 
              text-xs text-[#E8E8EC] placeholder:text-[#8A8A93]
              focus:outline-none focus:ring-0
            "
            style={{ outline: "none", boxShadow: "none", border: "none" }}
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleSearch(query)}
            disabled={loading}
            className="text-[#8A8A93] hover:text-white hover:bg-transparent h-7 w-7"
          >
            <Search className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* AI Scanner Direct Access Pill */}
        <Link
          href="/linevul"
          className="
            hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
            bg-violet-500/10 hover:bg-violet-500/20 text-violet-300
            border border-violet-500/30 transition-all duration-200 shadow-sm
          "
        >
          <ShieldAlert className="h-3.5 w-3.5 text-violet-400" />
          <span>AI Scanner</span>
        </Link>

        <ThemeToggle />
      </div>
    </header>
  );
}
