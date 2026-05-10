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
          "flex justify-center text-sm text-muted-foreground",
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
        <div className="text-sm text-muted-foreground">
          Showing {startItem.toLocaleString()} to {endItem.toLocaleString()} of{" "}
          {totalItems.toLocaleString()} results
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <Button
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-9 px-3 bg-[rgb(53,65,82)] text-white rounded-xl"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Prev</span>
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === "..." ? (
                <div className="flex h-9 w-9 items-center justify-center">
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  className={cn(
                    "h-9 w-9 rounded-xl",
                    currentPage === page
                      ? "bg-[rgb(86,27,122)] text-white"
                      : "bg-[rgb(53,65,82)] text-white"
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
          className="h-9 px-3 bg-[rgb(53,65,82)] text-white rounded-xl"
        >
          <span className="hidden sm:inline mr-1">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Jump to Page */}
        {totalPages > 3 && (
          <form onSubmit={handleJumpSubmit} className="flex items-center gap-1">
            <input
              type="number"
              value={jumpPage}
              onChange={(e) =>
                setJumpPage(e.target.value ? parseInt(e.target.value) : "")
              }
              placeholder="Go"
              min={1}
              max={totalPages}
              className="w-14 h-9 rounded-xl border px-2 bg-[rgb(53,65,82)] text-white text-sm"
            />
          </form>
        )}
      </div>
    </div>
  );
}
