// Define a generic CVSS metric type
export interface CvssMetric {
  [key: string]: string | number | null | Record<string, any>;
}

// Define all supported CVSS versions
export interface AllMetrics {
  cvssV2?: CvssMetric;
  cvssV3_0?: CvssMetric;
  cvssV3_1?: CvssMetric;
  cvssV4_0?: CvssMetric;
  cvssV5_0?: CvssMetric;
  [key: string]: CvssMetric | undefined; // future-proof for new versions
}

// Update your CVE record to include metrics
export interface CveRecord {
  id: string;
  assigner: string;
  category_type: string;
  cveid: string;
  datepublished: string;
  description: string;
  epss_probability: number;
  epss_score: number;
  exploit_score: number | null;
  exploit_score_date: string | null;
  latest_basescore: number | null;
  latest_cvss_version: number;
  latest_severity: string | null;
  product: string;
  title: string | null;
  vendor: string;
  patched: boolean | null;
  all_metrics?: AllMetrics; // add here
}
