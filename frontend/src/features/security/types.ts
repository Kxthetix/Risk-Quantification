export interface UserSession {
  id: string;
  user_id: string;
  device_type?: string;
  browser?: string;
  os?: string;
  ip_address?: string;
  location?: string;
  is_current: boolean;
  last_active_at: string;
  created_at: string;
}

export interface AuditLogEvent {
  id: string;
  user_id?: string;
  user_email?: string;
  organization_id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  status: "SUCCESS" | "FAILURE" | "DENIED";
  ip_address?: string;
  request_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface AuditLogFilterParams {
  [key: string]: string | number | boolean | undefined | null;
  skip?: number;
  limit?: number;
  search?: string;
  user_id?: string;
  action?: string;
  resource_type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}
