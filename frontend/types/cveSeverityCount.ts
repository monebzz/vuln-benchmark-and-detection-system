export interface CveSeverityCount {
  id: string; // Firestore document ID
  critical: number;
  high: number;
  medium: number;
  low: number;
  none: number;
  unknown: number;
  total: number;
}
