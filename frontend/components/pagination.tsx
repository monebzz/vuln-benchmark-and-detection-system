"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
  showInfo?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className,
  showInfo = true,
}: PaginationProps) {
  const [jumpPage, setJumpPage] = useState<number | "">("");

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    if (currentPage <= 2) {
      pages.push(1, 2, 3, "...", totalPages);
    } else if (currentPage >= totalPages - 1) {
      pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage, "...", totalPages);
    }

    return pages;
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      typeof jumpPage === "number" &&
      jumpPage >= 1 &&
      jumpPage <= totalPages
    ) {
      onPageChange(jumpPage);
      setJumpPage("");
    }
  };

  if (totalPages <= 1) {
    return showInfo ? (
      <div
        className={cn(
          "flex justify-center text-xs text-[#8A8A93] font-mono",
          className
        )}
      >
        Showing {totalItems} {totalItems === 1 ? "result" : "results"}
      </div>
    ) : null;
  }

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4",
        className
      )}
    >
      {showInfo && (
        <div className="text-xs text-[#8A8A93] font-mono">
          Showing {startItem.toLocaleString()} to {endItem.toLocaleString()} of{" "}
          {totalItems.toLocaleString()} results
        </div>
      )}

      <div className="flex items-center gap-1.5">
        {/* Previous Button */}
        <Button
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-8 px-2.5 bg-[#151518] hover:bg-white/[0.08] text-[#8A8A93] hover:text-white border border-white/[0.08] rounded-lg disabled:opacity-40 disabled:hover:bg-[#151518] text-xs font-mono"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline ml-1">Prev</span>
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === "..." ? (
                <div className="flex h-8 w-8 items-center justify-center">
                  <MoreHorizontal className="h-3.5 w-3.5 text-[#8A8A93]" />
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  className={cn(
                    "h-8 w-8 rounded-lg font-mono text-xs transition-colors",
                    currentPage === page
                      ? "bg-white hover:bg-[#EAEAEA] text-[#0A0A0B] font-semibold shadow-sm"
                      : "bg-[#151518] hover:bg-white/[0.08] text-[#8A8A93] hover:text-white border border-white/[0.08]"
                  )}
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next Button */}
        <Button
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-8 px-2.5 bg-[#151518] hover:bg-white/[0.08] text-[#8A8A93] hover:text-white border border-white/[0.08] rounded-lg disabled:opacity-40 disabled:hover:bg-[#151518] text-xs font-mono"
        >
          <span className="hidden sm:inline mr-1">Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>

        {/* Jump to Page */}
        {totalPages > 3 && (
          <form onSubmit={handleJumpSubmit} className="flex items-center gap-1 ml-1">
            <input
              type="number"
              value={jumpPage}
              onChange={(e) =>
                setJumpPage(e.target.value ? parseInt(e.target.value) : "")
              }
              placeholder="Go"
              min={1}
              max={totalPages}
              className="w-12 h-8 rounded-lg border border-white/[0.08] px-2 bg-[#0D0D0F] text-white text-xs font-mono outline-none focus:border-white/20"
            />
          </form>
        )}
      </div>
    </div>
  );
}
