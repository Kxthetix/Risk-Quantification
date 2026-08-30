export type ComplianceFramework = "ISO/IEC 27001" | "NIST CSF" | "CIS Controls";
export type ComplianceStatus = "IMPLEMENTED" | "PARTIAL" | "MISSING" | "NOT_ASSESSED";

export interface ComplianceRequirement {
  id: string;
  framework: ComplianceFramework;
  control_id: string;
  title: string;
  description: string;
  status: ComplianceStatus;
  score: number; // 0-100
}

export interface ComplianceOverview {
  framework: ComplianceFramework;
  overall_compliance_percentage: number;
  implemented_count: number;
  partial_count: number;
  missing_count: number;
  total_requirements: number;
}
