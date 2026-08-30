import { RiskLevel } from "@/types/risk";

export interface ComplianceSummary {
  overall_compliance_pct: number;
  control_coverage_pct: number;
  total_controls: number;
  implemented_controls_count: number;
  open_gaps_count: number;
  critical_gaps_count: number;
  overdue_assessments_count: number;
  evidence_coverage_pct: number;
  total_compliance_risk_exposure: number;
  frameworks_count: number;
}

export interface FrameworkItem {
  id: string;
  name: string;
  version: string;
  code: string;
  description?: string | null;
  total_controls: number;
  implemented_controls: number;
  gaps_count: number;
  compliance_pct: number;
  risk_level: RiskLevel;
  last_assessment_date?: string | null;
  status: string;
}

export interface FrameworkClauseItem {
  clause_id: string;
  title: string;
  description?: string | null;
  total_controls: number;
  implemented_controls: number;
  compliance_pct: number;
  status: string;
}

export interface FrameworkDetail {
  id: string;
  name: string;
  version: string;
  code: string;
  description?: string | null;
  compliance_pct: number;
  total_controls: number;
  implemented_controls: number;
  open_gaps_count: number;
  critical_gaps_count: number;
  evidence_coverage_pct: number;
  financial_exposure: number;
  clauses: FrameworkClauseItem[];
  audit_history_count: number;
  last_assessment_date?: string | null;
  status: string;
}

export interface FrameworkControlItem {
  control_id: string;
  code: string;
  name: string;
  requirement: string;
  category: string;
  clause: string;
  owner?: string | null;
  responsible_team?: string | null;
  implementation_status: "Not Implemented" | "Planned" | "Partially Implemented" | "Implemented" | "Effective" | "Not Applicable";
  effectiveness_score: number;
  effectiveness_tier: "Ineffective" | "Partially Effective" | "Mostly Effective" | "Effective";
  has_evidence: boolean;
  evidence_count: number;
  is_gap: boolean;
  gap_severity?: "Critical" | "High" | "Medium" | "Low" | "Informational" | null;
  risk_level: RiskLevel;
  financial_exposure: number;
  mapped_assets_count: number;
  mapped_vulnerabilities_count: number;
  mapped_attack_paths_count: number;
  last_assessed_at?: string | null;
}

export interface ControlDetail {
  id: string;
  code: string;
  name: string;
  control_type: string;
  objective: string;
  description: string;
  expected_outcome?: string | null;
  implementation_guidance?: string | null;
  owner?: string | null;
  department?: string | null;
  responsible_team?: string | null;
  reviewer?: string | null;
  implementation_status: string;
  implementation_date?: string | null;
  technology_stack?: string | null;
  process_notes?: string | null;
  people_roles?: string | null;
  effectiveness_score: number;
  effectiveness_tier: string;
  framework_mappings: Array<{ framework: string; clause: string; requirement: string }>;
  mapped_assets: Array<{ id: string; name: string; criticality: string; coverage: string }>;
  mapped_business_services: Array<{ id: string; name: string; exposure: number }>;
  mapped_vulnerabilities: Array<{ cve_id: string; name: string; severity: string }>;
  mapped_attack_paths: Array<{ id: string; name: string; risk_score: number; status: string }>;
  evidence_items: Array<{ id: string; title: string; type: string; uploaded_at: string; status: string }>;
  assessments: Array<{ id: string; assessor: string; date: string; score: number; finding: string }>;
  financial_exposure: number;
  remediation_items: Array<{ id: string; action: string; due_date: string; status: string }>;
}

export interface AssessmentItem {
  id: string;
  framework_id: string;
  framework_name: string;
  control_id: string;
  control_name: string;
  control_code: string;
  assessor_name: string;
  assessment_date: string;
  status: "Draft" | "In Progress" | "Submitted" | "Under Review" | "Approved" | "Rejected" | "Closed";
  effectiveness_score: number;
  finding?: string | null;
  recommendation?: string | null;
  evidence_attached: number;
}

export interface EvidenceItem {
  id: string;
  title: string;
  description?: string | null;
  control_id: string;
  control_code: string;
  framework_name: string;
  evidence_type: "Policy" | "Procedure" | "Screenshot" | "Configuration" | "Log" | "Audit Report" | "Certificate" | "Document" | "Ticket" | "System Record";
  file_name: string;
  file_size_bytes: number;
  uploaded_by: string;
  uploaded_at: string;
  expiration_date?: string | null;
  expiration_status: "Valid" | "Expiring Soon" | "Expired" | "Missing";
  verification_status: "Pending" | "Verified" | "Rejected";
  verified_by?: string | null;
  verified_at?: string | null;
}

export interface ComplianceGapItem {
  id: string;
  title: string;
  description: string;
  framework: string;
  control_code: string;
  control_name: string;
  severity: "Critical" | "High" | "Medium" | "Low" | "Informational";
  business_service?: string | null;
  asset_name?: string | null;
  risk_score: number;
  risk_level: RiskLevel;
  financial_exposure: number;
  owner?: string | null;
  due_date?: string | null;
  status: "Open" | "Assigned" | "In Progress" | "Under Review" | "Resolved" | "Risk Accepted";
  attack_paths_count: number;
  vulnerabilities_count: number;
}

export interface ComplianceGapDetail {
  id: string;
  title: string;
  description: string;
  requirement: string;
  framework: string;
  control_code: string;
  control_name: string;
  severity: string;
  root_cause: string;
  risk_score: number;
  risk_level: RiskLevel;
  financial_exposure: number;
  expected_annual_loss: number;
  p95_loss: number;
  affected_assets: Array<{ id: string; name: string; criticality: string }>;
  affected_attack_paths: Array<{ id: string; name: string; risk_score: number }>;
  remediation_actions: Array<{ id: string; action: string; owner: string; due_date: string; status: string }>;
  owner?: string | null;
  due_date?: string | null;
  status: string;
}

export interface ComplianceCyberRiskMapNode {
  requirement: string;
  control_code: string;
  control_name: string;
  control_effectiveness: number;
  is_gap: boolean;
  gap_title?: string | null;
  vulnerability_cve?: string | null;
  affected_asset: string;
  attack_path_name: string;
  business_service: string;
  financial_impact: number;
}

export interface ComplianceCyberRiskMapResponse {
  chains: ComplianceCyberRiskMapNode[];
  total_chains: number;
  uncovered_critical_assets_count: number;
  high_priority_remediation_count: number;
}

export interface ComplianceRemediationItem {
  id: string;
  finding: string;
  control_code: string;
  owner: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  due_date: string;
  status: "Open" | "Assigned" | "In Progress" | "Blocked" | "Completed" | "Verified" | "Closed";
  risk_level: RiskLevel;
  financial_impact: number;
  risk_reduction_pct: number;
  financial_reduction: number;
}

export interface ComplianceAuditItem {
  id: string;
  name: string;
  framework_name: string;
  auditor_name: string;
  start_date: string;
  end_date?: string | null;
  status: "Planned" | "In Progress" | "Fieldwork" | "Reporting" | "Closed";
  total_findings: number;
  critical_findings: number;
  scope_description?: string | null;
}

export interface ComplianceTrendPoint {
  timestamp: string;
  compliance_score: number;
  control_effectiveness: number;
  evidence_coverage: number;
  open_gaps: number;
}

export interface CrossFrameworkMappingItem {
  common_control_name: string;
  iso_27001_control: string;
  nist_csf_control: string;
  soc2_control: string;
  pci_dss_control: string;
  implementation_status: string;
  effectiveness_score: number;
}
