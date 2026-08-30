import { apiClient } from "@/lib/api/client";
import type {
  NotificationItem,
  NotificationPreferences,
  NotificationRule,
  NotificationRuleCreate,
} from "./types";

const BASE = "/notifications";

export async function getNotifications(params?: { read?: boolean; severity?: string }): Promise<NotificationItem[]> {
  const query = new URLSearchParams();
  if (params?.read !== undefined) query.set("read", String(params.read));
  if (params?.severity) query.set("severity", params.severity);
  const qStr = query.toString() ? `?${query.toString()}` : "";
  return apiClient.get(`${BASE}${qStr}`);
}

export async function markNotificationRead(id: string): Promise<NotificationItem> {
  return apiClient.put(`${BASE}/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<{ message: string }> {
  return apiClient.put(`${BASE}/read-all`);
}

export async function deleteNotification(id: string): Promise<void> {
  return apiClient.delete(`${BASE}/${id}`);
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  return apiClient.get(`${BASE}/preferences`);
}

export async function updateNotificationPreferences(
  payload: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  return apiClient.put(`${BASE}/preferences`, payload);
}

export async function getNotificationRules(): Promise<NotificationRule[]> {
  return apiClient.get(`${BASE}/rules`);
}

export async function createNotificationRule(payload: NotificationRuleCreate): Promise<NotificationRule> {
  return apiClient.post(`${BASE}/rules`, payload);
}

export async function updateNotificationRule(
  id: string,
  payload: Partial<NotificationRuleCreate>
): Promise<NotificationRule> {
  return apiClient.put(`${BASE}/rules/${id}`, payload);
}

export async function deleteNotificationRule(id: string): Promise<void> {
  return apiClient.delete(`${BASE}/rules/${id}`);
}
