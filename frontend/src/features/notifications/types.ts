// Notification feature types (Phase 12)
export type NotificationSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export interface NotificationItem {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  read: boolean;
  created_at: string;
  metadata?: Record<string, any> | null;
}

export interface NotificationPreferences {
  id?: string;
  user_id?: string;
  email_alerts_enabled: boolean;
  in_app_alerts_enabled: boolean;
  webhook_alerts_enabled: boolean;
  webhook_url?: string | null;
  critical_only: boolean;
  updated_at?: string;
}

export interface NotificationRule {
  id: string;
  organization_id: string;
  event_type: string;
  condition_operator: string;
  condition_value: string;
  recipients: string[];
  channel: string;
  frequency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationRuleCreate {
  event_type: string;
  condition_operator: string;
  condition_value: string;
  recipients: string[];
  channel: string;
  frequency: string;
  is_active?: boolean;
}
