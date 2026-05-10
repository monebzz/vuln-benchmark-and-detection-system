export interface CveDailyCount {
  id: string;
  year: number;
  month: number;
  day: number;
  total_cves: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
}
