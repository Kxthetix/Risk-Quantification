export type ControlType =
  | "WAF"
  | "EDR"
  | "MFA"
  | "NETWORK_SEGMENTATION"
  | "PAM"
  | "IDS_IPS"
  | "BACKUP"
  | "ZERO_TRUST_ACCESS"
  | "SIEM";

export interface SecurityControl {
  id: string;
  organization_id: string;
  name: string;
  control_type: ControlType;
  description?: string;
  effectiveness_score: number; // 0-100
  coverage_percentage: number; // 0-100
  annual_cost?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
