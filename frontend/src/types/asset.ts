export type AssetType =
  | "SERVER"
  | "WORKSTATION"
  | "LAPTOP"
  | "DESKTOP"
  | "DATABASE"
  | "WEB_APPLICATION"
  | "API"
  | "NETWORK_DEVICE"
  | "FIREWALL"
  | "ROUTER"
  | "SWITCH"
  | "IOT_DEVICE"
  | "CLOUD_RESOURCE"
  | "CONTAINER"
  | "VIRTUAL_MACHINE"
  | "OTHER";

export type AssetEnvironment =
  | "PRODUCTION"
  | "STAGING"
  | "DEVELOPMENT"
  | "TESTING"
  | "DISASTER_RECOVERY"
  | "OTHER";

export type AssetCriticality = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type DataClassification = "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED";

export type AssetStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "DECOMMISSIONED" | "UNKNOWN";

export interface AssetSoftware {
  id: string;
  software_id?: string;
  name: string;
  vendor?: string;
  version: string;
  architecture?: string;
  package_manager?: string;
  install_path?: string;
  source?: string;
  installed_at?: string;
}

import type { AssetVulnerability } from "./vulnerability";
export type { AssetVulnerability };

export interface Asset {
  id: string;
  organization_id: string;
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
  business_service?: string;
  created_at: string;
  updated_at: string;
  // Computed / related fields
  software_count?: number;
  software?: AssetSoftware[];
  vulnerability_count?: number;
  risk_score?: number;
  expected_loss?: number;
}

export interface AssetDetail extends Asset {
  software_count: number;
  software: AssetSoftware[];
}

export interface AssetListResponse {
  items: Asset[];
  page: number;
  limit: number;
  total: number;
}

export interface AssetStatistics {
  total_assets: number;
  active_assets: number;
  critical_assets: number;
  internet_exposed_assets: number;
  production_assets: number;
  servers: number;
  databases: number;
  network_devices: number;
  by_type: Record<string, number>;
  by_criticality: Record<string, number>;
  by_environment: Record<string, number>;
  by_status: Record<string, number>;
}

export type AssetStatisticsResponse = AssetStatistics;
