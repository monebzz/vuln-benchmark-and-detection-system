import { CveRecord } from "./cveRecordData";

export interface FirestoreSearchOptions {
  page?: number;
  limitCount?: number;
  lastdoc?: any;
}

export interface FirestoreSearchResponse {
  results: CveRecord[];
  total_count: number; // we'll approximate with returned docs
  search_time_ms: number;
  search_type: "firestore";
  lastDoc?: any; // for pagination
}
