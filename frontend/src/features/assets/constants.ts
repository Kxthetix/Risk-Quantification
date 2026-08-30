import {
  AssetType,
  AssetCriticality,
  AssetEnvironment,
  AssetStatus,
  DataClassification,
} from "@/types/asset";

export const ASSET_TYPE_OPTIONS: { value: AssetType; label: string }[] = [
  { value: "SERVER", label: "Server" },
  { value: "DATABASE", label: "Database" },
  { value: "WEB_APPLICATION", label: "Web Application" },
  { value: "API", label: "API Gateway / Service" },
  { value: "CLOUD_RESOURCE", label: "Cloud Resource (AWS / GCP / Azure)" },
  { value: "CONTAINER", label: "Container / Kubernetes Pod" },
  { value: "VIRTUAL_MACHINE", label: "Virtual Machine" },
  { value: "NETWORK_DEVICE", label: "Network Device" },
  { value: "FIREWALL", label: "Firewall / WAF" },
  { value: "ROUTER", label: "Router" },
  { value: "SWITCH", label: "Switch" },
  { value: "IOT_DEVICE", label: "IoT / OT Device" },
  { value: "WORKSTATION", label: "Workstation" },
  { value: "LAPTOP", label: "Laptop" },
  { value: "DESKTOP", label: "Desktop" },
  { value: "OTHER", label: "Other" },
];

export const ASSET_CRITICALITY_OPTIONS: { value: AssetCriticality; label: string; color: string }[] = [
  { value: "CRITICAL", label: "Critical (Tier 1)", color: "text-rose-500 bg-rose-500/10 border-rose-500/30" },
  { value: "HIGH", label: "High (Tier 2)", color: "text-orange-500 bg-orange-500/10 border-orange-500/30" },
  { value: "MEDIUM", label: "Medium (Tier 3)", color: "text-amber-500 bg-amber-500/10 border-amber-500/30" },
  { value: "LOW", label: "Low (Tier 4)", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" },
];

export const ASSET_ENVIRONMENT_OPTIONS: { value: AssetEnvironment; label: string }[] = [
  { value: "PRODUCTION", label: "Production" },
  { value: "STAGING", label: "Staging / Pre-Prod" },
  { value: "DEVELOPMENT", label: "Development" },
  { value: "TESTING", label: "Testing / QA" },
  { value: "DISASTER_RECOVERY", label: "Disaster Recovery (DR)" },
  { value: "OTHER", label: "Other" },
];

export const ASSET_STATUS_OPTIONS: { value: AssetStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "DECOMMISSIONED", label: "Decommissioned" },
  { value: "UNKNOWN", label: "Unknown" },
];

export const DATA_CLASSIFICATION_OPTIONS: { value: DataClassification; label: string }[] = [
  { value: "PUBLIC", label: "Public" },
  { value: "INTERNAL", label: "Internal" },
  { value: "CONFIDENTIAL", label: "Confidential (PII / Financial)" },
  { value: "RESTRICTED", label: "Restricted (Secret / Sensitive)" },
];

export const RELATIONSHIP_TYPE_OPTIONS = [
  { value: "DEPENDS_ON", label: "Depends On" },
  { value: "CONNECTS_TO", label: "Connects To" },
  { value: "NETWORK_REACHABILITY", label: "Network Reachability" },
  { value: "HOSTS", label: "Hosts" },
  { value: "TRUSTS", label: "Trusts" },
  { value: "AUTHENTICATES_TO", label: "Authenticates To" },
  { value: "COMMUNICATES_WITH", label: "Communicates With" },
];
