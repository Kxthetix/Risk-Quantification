// Audit feature types (Phase 12)
export interface AuditLogItem {
  id: string;
  organization_id: string;
  user_id: string;
  user_email?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  result: "SUCCESS" | "FAILURE";
  source_ip?: string | null;
  created_at: string;
}

export interface AuditLogDetail extends AuditLogItem {
  before_state?: Record<string, any> | null;
  after_state?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
}

export interface AuditLogFilters {
  action?: string;
  resource_type?: string;
  user_id?: string;
  skip?: number;
  limit?: number;
}
