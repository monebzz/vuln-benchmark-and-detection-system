// types/cveScoreRange.ts
export interface CveScoreRange {
  id: string;
  score_counts: Record<string, number>;
}
