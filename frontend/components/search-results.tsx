"use client";

import React from "react";
import { CveRecord } from "@/types/cveRecordData";
import { SearchResultItem } from "./search-result-items";

interface SearchResultsProps {
  results: CveRecord[];
  query?: string;
}

export function SearchResults({ results, query }: SearchResultsProps) {
  if (!results.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No vulnerabilities found for "{query}"
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((r) => (
        <SearchResultItem key={r.id} result={r} query={query} />
      ))}
    </div>
  );
}
