export type RemediationStatus =
  | "OPEN"
  | "PLANNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "VERIFIED"
  | "ACCEPTED_RISK"
  | "REJECTED";

export type RemediationType =
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

export type RemediationPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Remediation {
  id: string;
  organization_id: string;
  title: string;
  description?: string;
  remediation_type: RemediationType;
  status: RemediationStatus;
  priority: RemediationPriority;
  estimated_cost?: number;
  risk_reduction_score?: number;
  assigned_to?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface RemediationListResponse {
  items: Remediation[];
  total: number;
  skip: number;
  limit: number;
}
