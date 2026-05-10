"use client";

import { Menu, Search } from "lucide-react";
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
        sticky top-0 z-30 h-16 m-2 mx-2 md:mx-8 rounded-2xl border border-transparent 
        transition-all duration-300
        bg-white text-gray-900 
        dark:bg-[rgb(29,41,56)] dark:text-white
      "
    >
      <div className="flex h-full items-center gap-4 px-4 md:px-6">
        {/* Sidebar toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="
            text-gray-700 hover:text-gray-900 hover:bg-gray-100
            dark:text-white/80 dark:hover:text-white dark:hover:bg-white/10
          "
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Title */}
        <div className="flex-1 truncate">
          <h1 className="text-lg md:text-xl font-semibold gradient-text-primary">
            Vulnerability Benchmark System
          </h1>
        </div>

        {/* Search Input */}
        <div
          className="
            hidden sm:flex items-center w-40 md:w-1/2 rounded-xl px-3 py-0
            bg-gray-100 dark:bg-[rgb(53,65,82)] 
            transition-all focus-within:outline-none focus-within:ring-0
          "
        >
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={loading ? "Searching..." : "Search CVEs..."}
            className="
              w-full bg-transparent border-0 outline-none ring-0 
              text-gray-800 placeholder:text-gray-500
              dark:text-white dark:placeholder:text-white/60
              focus:outline-none focus:ring-0
            "
            style={{ outline: "none", boxShadow: "none", border: "none" }}
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleSearch(query)}
            disabled={loading}
            className="text-gray-600 dark:text-white/70 hover:bg-transparent"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <ThemeToggle />
      </div>
    </header>
  );
}
