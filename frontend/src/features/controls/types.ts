import { z } from "zod";
import { controlCreateSchema, controlUpdateSchema, controlEffectivenessCreateSchema } from "./schemas";

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

export interface ControlEffectiveness {
  id: string;
  control_id: string;
  threat_scenario_type?: string | null;
  risk_factor_type?: string | null;
  vulnerability_category?: string | null;
  attenuation_factor: number;
  confidence: number;
  description?: string | null;
  created_at: string;
}

export interface SecurityControl {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description?: string | null;
  control_type: ControlType;
  effectiveness_score: number; // 0.0 - 100.0 %
  coverage_percentage: number;  // 0.0 - 100.0 %
  annual_cost: number;
  implementation_cost: number;
  is_active: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  effectiveness_mappings?: ControlEffectiveness[];
}

export type ControlCreateInput = z.infer<typeof controlCreateSchema>;
export type ControlUpdateInput = z.infer<typeof controlUpdateSchema>;
export type ControlEffectivenessInput = z.infer<typeof controlEffectivenessCreateSchema>;

export interface ControlSummaryKPIs {
  totalControls: number;
  activeControls: number;
  avgEffectiveness: number;
  avgCoverage: number;
  totalAnnualCost: number;
  totalImplementationCost: number;
}
