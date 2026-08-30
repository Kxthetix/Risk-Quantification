import { apiClient } from "@/lib/api/client";
import type {
  AnnouncementItem,
  ApiKeyCreateResponse,
  ApiKeyItem,
  BackgroundJobItem,
  IntegrationItem,
  IntegrationTestResult,
  LoginActivityItem,
  OrganizationItem,
  PermissionItem,
  PlatformUsage,
  RoleDetail,
  RoleItem,
  SecurityEventItem,
  SecurityPolicies,
  SystemHealth,
  UserInvitation,
  UserInvitationCreate,
  UserItem,
} from "./types";

const BASE = "/admin";

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getAdminDashboard(): Promise<PlatformUsage> {
  return apiClient.get(`${BASE}/dashboard`);
}

// ─── Users & Invitations ──────────────────────────────────────────────────────

export async function getUsers(): Promise<UserItem[]> {
  return apiClient.get("/users");
}

export async function getUser(id: string): Promise<UserItem> {
  return apiClient.get(`/users/${id}`);
}

export async function inviteUser(payload: UserInvitationCreate): Promise<UserInvitation> {
  return apiClient.post(`${BASE}/users/invite`, payload);
}

export async function disableUser(id: string): Promise<UserItem> {
  return apiClient.post(`${BASE}/users/${id}/disable`);
}

export async function enableUser(id: string): Promise<UserItem> {
  return apiClient.post(`${BASE}/users/${id}/enable`);
}

export async function revokeUserSessions(id: string): Promise<{ message: string }> {
  return apiClient.post(`${BASE}/users/${id}/revoke-sessions`);
}

// ─── Roles & Permissions ──────────────────────────────────────────────────────

export async function getRoles(): Promise<RoleItem[]> {
  return apiClient.get(`${BASE}/roles`);
}

export async function getRole(roleName: string): Promise<RoleDetail> {
  return apiClient.get(`${BASE}/roles/${roleName}`);
}

export async function getPermissions(): Promise<PermissionItem[]> {
  return apiClient.get(`${BASE}/permissions`);
}

// ─── Organizations ────────────────────────────────────────────────────────────

export async function getOrganizations(): Promise<OrganizationItem[]> {
  return apiClient.get(`${BASE}/organizations`);
}

export async function suspendOrganization(id: string): Promise<{ message: string }> {
  return apiClient.post(`${BASE}/organizations/${id}/suspend`);
}

export async function activateOrganization(id: string): Promise<{ message: string }> {
  return apiClient.post(`${BASE}/organizations/${id}/activate`);
}

// ─── Policies ─────────────────────────────────────────────────────────────────

export async function getSecurityPolicies(): Promise<SecurityPolicies> {
  return apiClient.get(`${BASE}/policies`);
}

export async function updateSecurityPolicies(payload: Partial<SecurityPolicies>): Promise<SecurityPolicies> {
  return apiClient.put(`${BASE}/policies`, payload);
}

// ─── API Keys ─────────────────────────────────────────────────────────────────

export async function getApiKeys(): Promise<ApiKeyItem[]> {
  return apiClient.get(`${BASE}/api-keys`);
}

export async function createApiKey(payload: { name: string; expiration_days?: number }): Promise<ApiKeyCreateResponse> {
  return apiClient.post(`${BASE}/api-keys`, payload);
}

export async function revokeApiKey(id: string): Promise<void> {
  return apiClient.delete(`${BASE}/api-keys/${id}`);
}

// ─── Integrations ─────────────────────────────────────────────────────────────

export async function getIntegrations(): Promise<IntegrationItem[]> {
  return apiClient.get(`${BASE}/integrations`);
}

export async function testIntegration(id: string): Promise<IntegrationTestResult> {
  return apiClient.post(`${BASE}/integrations/${id}/test`);
}

export async function updateIntegration(
  id: string,
  payload: { name?: string; status?: string; credentials?: Record<string, any> }
): Promise<IntegrationItem> {
  return apiClient.put(`${BASE}/integrations/${id}`, payload);
}

// ─── System Health & Background Jobs ──────────────────────────────────────────

export async function getSystemHealth(): Promise<SystemHealth> {
  return apiClient.get(`${BASE}/health`);
}

export async function getSystemDiagnostics(): Promise<Record<string, any>> {
  return apiClient.get(`${BASE}/system`);
}

export async function getBackgroundJobs(): Promise<BackgroundJobItem[]> {
  return apiClient.get(`${BASE}/jobs`);
}

export async function retryBackgroundJob(id: string): Promise<{ message: string }> {
  return apiClient.post(`${BASE}/jobs/${id}/retry`);
}

export async function cancelBackgroundJob(id: string): Promise<{ message: string }> {
  return apiClient.post(`${BASE}/jobs/${id}/cancel`);
}

// ─── Announcements & Maintenance ──────────────────────────────────────────────

export async function getAnnouncements(): Promise<AnnouncementItem[]> {
  return apiClient.get(`${BASE}/announcements`);
}

export async function createAnnouncement(payload: {
  title: string;
  message: string;
  is_active?: boolean;
}): Promise<AnnouncementItem> {
  return apiClient.post(`${BASE}/announcements`, payload);
}

export async function getMaintenanceStatus(): Promise<{ enabled: boolean; message: string }> {
  return apiClient.get(`${BASE}/maintenance`);
}

export async function updateMaintenanceStatus(enabled: boolean, message?: string): Promise<{ enabled: boolean; message: string }> {
  return apiClient.post(`${BASE}/maintenance`, { enabled, message });
}

// ─── Security Events & Activity ───────────────────────────────────────────────

export async function getSecurityEvents(): Promise<SecurityEventItem[]> {
  return apiClient.get(`${BASE}/security-events`);
}

export async function getLoginActivity(): Promise<LoginActivityItem[]> {
  return apiClient.get(`${BASE}/login-activity`);
}
