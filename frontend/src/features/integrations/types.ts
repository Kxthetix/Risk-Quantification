// Phase 13: Integrations feature types

export interface IntegrationCatalogItem {
  id: string;
  name: string;
  category: string;
  description: string;
  auth_methods: string[];
  supported_data: string[];
  sync_methods: string[];
  version: string;
  icon: string;
}

export interface IntegrationItem {
  id: string;
  organization_id: string;
  name: string;
  category: string;
  connector_type: string;
  status: "CONNECTED" | "DISCONNECTED" | "DEGRADED" | "SYNCING" | "FAILED";
  auth_method: string;
  endpoint_url?: string | null;
  has_credentials: boolean;
  sync_frequency: string;
  sync_mode: string;
  is_enabled: boolean;
  last_sync_at?: string | null;
  last_sync_status?: string | null;
  last_error?: string | null;
  data_types_supported: string[];
  field_mappings: Record<string, string>;
  transformation_rules: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface IntegrationCreatePayload {
  name: string;
  category: string;
  connector_type: string;
  auth_method: string;
  endpoint_url?: string;
  credentials?: Record<string, any>;
  sync_frequency: string;
  sync_mode: string;
  is_enabled?: boolean;
  field_mappings?: Record<string, string>;
  transformation_rules?: Record<string, any>;
}

export interface IntegrationUpdatePayload {
  name?: string;
  endpoint_url?: string;
  credentials?: Record<string, any>;
  sync_frequency?: string;
  sync_mode?: string;
  is_enabled?: boolean;
  field_mappings?: Record<string, string>;
  transformation_rules?: Record<string, any>;
}

export interface IntegrationTestResult {
  status: "CONNECTED" | "FAILED" | "TIMEOUT" | "UNAUTHORIZED" | "RATE_LIMITED";
  latency_ms: number;
  message: string;
  records_preview_count: number;
}

export interface IntegrationSyncResult {
  log_id: string;
  status: string;
  records_received: number;
  records_accepted: number;
  records_rejected: number;
  records_updated: number;
  records_created: number;
  duration_ms: number;
  message: string;
}

export interface IntegrationLogItem {
  id: string;
  organization_id: string;
  integration_id: string;
  operation: string;
  status: string;
  records_received: number;
  records_accepted: number;
  records_rejected: number;
  records_updated: number;
  records_created: number;
  duration_ms: number;
  error_type?: string | null;
  error_message?: string | null;
  created_at: string;
}

export interface IntegrationStats {
  total_integrations: number;
  connected_count: number;
  disconnected_count: number;
  degraded_count: number;
  syncing_count: number;
  failed_count: number;
  last_sync_at?: string | null;
}

export interface DataQualityStats {
  assets_imported: number;
  vulnerabilities_imported: number;
  threats_imported: number;
  events_imported: number;
  identities_imported: number;
  accepted_percentage: number;
  duplicate_percentage: number;
  rejected_percentage: number;
}

export interface WebhookEndpointItem {
  id: string;
  organization_id: string;
  name: string;
  event_types: string[];
  is_active: boolean;
  events_received: number;
  events_failed: number;
  last_event_at?: string | null;
  created_at: string;
  webhook_url: string;
  signing_secret?: string | null;
}
