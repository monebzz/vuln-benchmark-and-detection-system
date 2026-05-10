export interface EpssRangeStats {
  id: string;
  change_10_to_20pct: number;
  change_1_to_2pct: number;
  change_20_to_50pct: number;
  change_2_to_5pct: number;
  change_5_to_10pct: number;
  change_over_50pct: number;
  change_under_1pct: number;
  total_with_change_data: number;
}
