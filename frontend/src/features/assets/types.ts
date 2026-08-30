import {
  Asset,
  AssetDetail,
  AssetType,
  AssetCriticality,
  AssetEnvironment,
  AssetStatus,
  DataClassification,
  AssetSoftware,
  AssetVulnerability,
  AssetStatistics,
} from "@/types/asset";

export interface AssetCreatePayload {
  name: string;
  description?: string;
  asset_type: AssetType;
  hostname?: string;
  ip_address?: string;
  mac_address?: string;
  operating_system?: string;
  os_version?: string;
  environment: AssetEnvironment;
  criticality: AssetCriticality;
  business_value?: number;
  data_classification: DataClassification;
  internet_exposed: boolean;
  status: AssetStatus;
  location?: string;
  owner?: string;
}

export interface AssetUpdatePayload extends AssetCreatePayload {}

export interface AssetPatchPayload extends Partial<AssetCreatePayload> {}

export interface ImportRowError {
  row: number;
  field?: string;
  message: string;
}

export interface ImportResult {
  total_rows: number;
  successful: number;
  failed: number;
  errors: ImportRowError[];
}

export interface NetworkRelationship {
  id: string;
  organization_id: string;
  source_asset_id: string;
  destination_asset_id: string;
  destination_asset_name?: string;
  relationship_type:
    | "NETWORK_REACHABILITY"
    | "DEPENDS_ON"
    | "CONNECTS_TO"
    | "TRUSTS"
    | "AUTHENTICATES_TO"
    | "HOSTS"
    | "COMMUNICATES_WITH";
  protocol?: string;
  port?: number;
  direction: "INBOUND" | "OUTBOUND" | "BIDIRECTIONAL";
  verified: boolean;
  confidence: number;
  created_at: string;
  updated_at: string;
}

export interface NetworkRelationshipCreatePayload {
  source_asset_id: string;
  destination_asset_id: string;
  relationship_type: string;
  protocol?: string;
  port?: number;
  direction?: string;
  verified?: boolean;
}

export interface AssetRiskSummary {
  asset_id: string;
  risk_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  vulnerability_count: number;
  critical_vulnerabilities: number;
  high_vulnerabilities: number;
  expected_loss: number;
  attack_path_count: number;
  top_factors?: { factor: string; percentage: number }[];
}

export interface AssetFilterParams {
  [key: string]: string | number | boolean | undefined | null;
  page?: number;
  limit?: number;
  q?: string;
  asset_type?: AssetType;
  criticality?: AssetCriticality;
  environment?: AssetEnvironment;
  status?: AssetStatus;
  data_classification?: DataClassification;
  internet_exposed?: boolean;
}
