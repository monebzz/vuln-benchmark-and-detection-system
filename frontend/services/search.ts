import { AutocompleteResponse } from "@/types/search";

/**
 * Autocomplete search — sends a query to the backend search API
 * and returns categorized suggestions for the search dropdown.
 */
export async function autocompleteSearch(
  query: string,
  _category?: string,
  limit: number = 8
): Promise<AutocompleteResponse> {
  if (!query || query.trim().length < 2) {
    return { suggestions: [], total_count: 0, query };
  }

  try {
    const params = new URLSearchParams();
    params.set("q", query);
    params.set("pageSize", String(limit));

    const res = await fetch(`/api/search?${params.toString()}`);
    if (!res.ok) {
      return { suggestions: [], total_count: 0, query };
    }

    const data = await res.json();
    const records = data.records || [];

    // Build suggestions from search results
    const seen = new Set<string>();
    const suggestions: AutocompleteResponse["suggestions"] = [];

    for (const record of records) {
      // Add CVE ID suggestion
      if (record.cveid && !seen.has(record.cveid)) {
        seen.add(record.cveid);
        suggestions.push({
          suggestion: record.cveid,
          category: "cve",
          frequency: 1,
        });
      }

      // Add vendor suggestion
      if (
        record.vendor &&
        record.vendor !== "Unknown" &&
        !seen.has(`vendor:${record.vendor}`)
      ) {
        seen.add(`vendor:${record.vendor}`);
        suggestions.push({
          suggestion: record.vendor,
          category: "vendor",
          frequency: 1,
        });
      }

      // Add product suggestion
      if (
        record.product &&
        record.product !== "Unknown" &&
        !seen.has(`product:${record.product}`)
      ) {
        seen.add(`product:${record.product}`);
        suggestions.push({
          suggestion: record.product,
          category: "product",
          frequency: 1,
        });
      }

      if (suggestions.length >= limit) break;
    }

    return {
      suggestions: suggestions.slice(0, limit),
      total_count: data.totalCount || suggestions.length,
      query,
    };
  } catch (error) {
    console.error("Autocomplete search error:", error);
    return { suggestions: [], total_count: 0, query };
  }
}
