export type ReportType =
  | "EXECUTIVE_RISK"
  | "CYBER_RISK"
  | "FINANCIAL_RISK"
  | "VULNERABILITY"
  | "ATTACK_PATH"
  | "REMEDIATION"
  | "SECURITY_INVESTMENT"
  | "COMPLIANCE";

export type ReportFormat = "PDF" | "JSON" | "CSV" | "XLSX";
export type ReportStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface Report {
  id: string;
  organization_id: string;
  title: string;
  report_type: ReportType;
  format: ReportFormat;
  status: ReportStatus;
  file_url?: string;
  file_size_bytes?: number;
  created_by?: string;
  created_at: string;
  completed_at?: string;
}
