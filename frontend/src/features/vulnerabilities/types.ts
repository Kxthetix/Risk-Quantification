import {
  Vulnerability,
  VulnerabilityDetail,
  VulnerabilitySeverity,
  ValidationStatus,
  ExploitAvailability,
  AssetVulnerabilityStatus,
  AssetVulnerability,
  SyncJobInfo,
} from "@/types/vulnerability";

export interface VulnerabilityFilterParams {
  [key: string]: string | number | boolean | undefined | null;
  page?: number;
  limit?: number;
  q?: string;
  severity?: VulnerabilitySeverity;
  cvss_min?: number;
  cvss_max?: number;
  published_after?: string;
  published_before?: string;
  known_exploited?: boolean;
  exploit_available?: ExploitAvailability;
  cwe_id?: string;
  vendor?: string;
  product?: string;
}

export interface ThreatIntelligenceSummary {
  cve_id: string;
  threat_activity_tier: "NONE" | "EMERGING" | "ACTIVE" | "WIDESPREAD";
  exploit_maturity: "NO_KNOWN_EXPLOIT" | "POC" | "FUNCTIONAL" | "ACTIVE_EXPLOITATION";
  cisa_kev: boolean;
  cisa_date_added?: string;
  cisa_due_date?: string;
  epss_score: number;
  epss_percentile: number;
  threat_actors: Array<{
    name: string;
    type: string;
    confidence: number;
    origin?: string;
  }>;
  campaigns: Array<{
    name: string;
    first_seen?: string;
    last_seen?: string;
    target_industries?: string[];
  }>;
  malware: Array<{
    name: string;
    category: string;
  }>;
  mitre_attack_techniques: Array<{
    technique_id: string;
    name: string;
    tactic: string;
  }>;
}

export interface VulnerabilityRiskBreakdown {
  cve_id: string;
  risk_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH" | "CRITICAL";
  priority_tier: "P1" | "P2" | "P3" | "P4";
  priority_label: string;
  affected_assets_count: number;
  critical_assets_count: number;
  internet_facing_assets_count: number;
  production_assets_count: number;
  contributing_factors: Array<{
    factor: string;
    weight: number;
    description: string;
  }>;
}

export interface VulnerabilityFinancialSummary {
  cve_id: string;
  currency: string;
  annual_expected_loss: number;
  potential_worst_case_loss: number;
  downtime_loss: number;
  revenue_loss: number;
  incident_response_loss: number;
  data_breach_loss: number;
  regulatory_fine_loss: number;
  affected_assets_exposure: Array<{
    asset_id: string;
    asset_name: string;
    asset_type: string;
    business_service?: string;
    expected_loss: number;
    risk_score: number;
  }>;
}

export interface RemediationCreatePayload {
  title: string;
  description?: string;
  remediation_type:
    | "PATCH"
    | "UPGRADE"
    | "CONFIGURATION_CHANGE"
    | "NETWORK_SEGMENTATION"
    | "ACCESS_CONTROL"
    | "MFA"
    | "WAF_RULE"
    | "FIREWALL_RULE"
    | "VIRTUAL_PATCH"
    | "COMPENSATING_CONTROL"
    | "ASSET_RETIREMENT";
  priority_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  assigned_team?: string;
  target_asset_id?: string;
  cve_id?: string;
  due_date?: string;
  estimated_cost?: number;
  recommended_fix?: string;
}

export interface RiskAcceptancePayload {
  justification: string;
  expiration_date: string;
  approved_by: string;
  compensating_controls_in_place?: string;
}

export interface VulnerabilityHistoryItem {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  previous_value?: string;
  new_value?: string;
  details?: string;
}

export interface PrioritizationMatrixPoint {
  id: string;
  cve_id: string;
  title: string;
  cvss_score: number;
  business_risk_score: number;
  financial_exposure: number;
  affected_assets: number;
  severity: VulnerabilitySeverity;
  known_exploited: boolean;
  priority_tier: "P1" | "P2" | "P3" | "P4";
}
