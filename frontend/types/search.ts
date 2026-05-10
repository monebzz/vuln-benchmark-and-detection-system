export interface SearchResult {
  cveid: string;
  description: string;
  vendors: string;
  products: string;
  severity?: string;
  cvss_score?: string;
  date_published?: string;
  pub_year?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total_count: number;
  search_time_ms: number;
  search_type: string;
  query: string;
  page: number;
  limit: number;
}

export interface AutocompleteResult {
  suggestion: string;
  category: string;
  frequency: number;
}

export interface AutocompleteResponse {
  suggestions: AutocompleteResult[];
  total_count: number;
  query: string;
}

export interface SearchStats {
  total_cves: number;
  total_vendors: number;
  total_products: number;
  earliest_year: number;
  latest_year: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
}

export interface SearchFilters {
  severity?: string;
  year?: number;
  year_from?: number;
  year_to?: number;
  vendor?: string;
  product?: string;
  assigner?: string;
  category_type?: string;
}

export interface SearchParams extends SearchFilters {
  q: string;
  skip?: number;
  limit?: number;
}

export interface SearchSuggestions {
  query_examples: {
    cve_searches: Array<{ query: string; description: string }>;
    vendor_searches: Array<{ query: string; description: string }>;
    product_searches: Array<{ query: string; description: string }>;
    severity_searches: Array<{ query: string; description: string }>;
  };
  search_tips: string[];
  available_endpoints: Record<string, string>;
}
