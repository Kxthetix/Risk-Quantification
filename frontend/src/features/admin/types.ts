// Admin feature types (Phase 12)

export interface PlatformUsage {
  active_users_count: number;
  admin_users_count: number;
  organizations_count: number;
  pending_invitations_count: number;
  critical_alerts_count: number;
  failed_notifications_count: number;
  audit_events_count: number;
  integration_failures_count: number;
  api_requests_count: number;
  storage_bytes_used: number;
}

export interface UserItem {
  id: string;
  organization_id: string;
  full_name: string;
  email: string;
  role: "ADMIN" | "SECURITY_ANALYST" | "MANAGER" | "VIEWER";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserInvitation {
  id: string;
  email: string;
  organization_id: string;
  role: string;
  expires_at: string;
  message?: string | null;
  status: "PENDING" | "ACCEPTED" | "EXPIRED";
  created_at: string;
}

export interface UserInvitationCreate {
  email: string;
  organization_id?: string;
  role: string;
  expiration_hours?: number;
  message?: string;
}

export interface RoleItem {
  role: string;
  description: string;
  users: number;
  status: string;
}

export interface RoleDetail {
  role: string;
  permissions: string[];
}

export interface PermissionItem {
  permission: string;
  description: string;
  category: string;
}

export interface OrganizationItem {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  users_count: number;
  assets_count: number;
  services_count: number;
  risk_score: number;
  created_at: string;
}

export interface SecurityPolicies {
  id?: string;
  organization_id?: string;
  password_policy: {
    min_length: number;
    complexity_required: boolean;
    expiration_days: number;
    history_limit?: number;
    lockout_attempts?: number;
    lockout_duration_mins?: number;
  };
  session_policy: {
    timeout_seconds: number;
    max_duration_seconds: number;
    concurrent_sessions_limit: number;
    idle_timeout_seconds: number;
  };
  mfa_policy: {
    mfa_required: boolean;
    mfa_method: string;
    recovery_options_enabled: boolean;
    grace_period_days: number;
  };
  data_retention_policy: {
    audit_logs_retention_years: number;
    incidents_retention_years: number;
    alerts_retention_days: number;
    reports_retention_days: number;
  };
  updated_at?: string;
}

export interface ApiKeyItem {
  id: string;
  organization_id: string;
  name: string;
  is_active: boolean;
  last_used_at?: string | null;
  expires_at?: string | null;
  created_at: string;
}

export interface ApiKeyCreateResponse {
  api_key: ApiKeyItem;
  secret_key: string;
}

export interface IntegrationItem {
  id: string;
  name: string;
  type: string;
  status: "CONNECTED" | "DEGRADED" | "FAILED" | "DISCONNECTED";
  last_sync_at?: string | null;
  last_error?: string | null;
  configured: boolean;
}

export interface IntegrationTestResult {
  status: "CONNECTED" | "FAILED";
  latency_ms: number;
  message: string;
}

export interface ServiceHealth {
  name: string;
  status: "Healthy" | "Degraded" | "Down" | "Unknown";
  latency_ms?: number | null;
  version?: string | null;
  error_rate_percentage: number;
  last_check_at: string;
}

export interface SystemHealth {
  api_status: string;
  environment: string;
  version: string;
  services: ServiceHealth[];
  timestamp: string;
}

export interface BackgroundJobItem {
  id: string;
  organization_id: string;
  job_type: string;
  status: string;
  progress_percentage: number;
  attempts: number;
  max_attempts: number;
  error_code?: string | null;
  error_message?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  is_active: boolean;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SecurityEventItem {
  id: string;
  timestamp: string;
  event_type: string;
  message: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  ip_address?: string;
}

export interface LoginActivityItem {
  id: string;
  timestamp: string;
  email: string;
  result: "SUCCESS" | "FAILED";
  location: string;
  device: string;
  ip_address: string;
}
