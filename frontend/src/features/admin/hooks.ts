import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  activateOrganization,
  cancelBackgroundJob,
  createAnnouncement,
  createApiKey,
  disableUser,
  enableUser,
  getAdminDashboard,
  getAnnouncements,
  getApiKeys,
  getBackgroundJobs,
  getIntegrations,
  getLoginActivity,
  getOrganizations,
  getPermissions,
  getRole,
  getRoles,
  getSecurityEvents,
  getSecurityPolicies,
  getSystemDiagnostics,
  getSystemHealth,
  getUser,
  getUsers,
  inviteUser,
  retryBackgroundJob,
  revokeApiKey,
  revokeUserSessions,
  suspendOrganization,
  testIntegration,
  updateIntegration,
  updateSecurityPolicies,
} from "./api";
import type { SecurityPolicies, UserInvitationCreate } from "./types";

export const ADMIN_KEYS = {
  all: ["admin"] as const,
  dashboard: ["admin", "dashboard"] as const,
  users: ["admin", "users"] as const,
  user: (id: string) => ["admin", "users", id] as const,
  roles: ["admin", "roles"] as const,
  role: (name: string) => ["admin", "roles", name] as const,
  permissions: ["admin", "permissions"] as const,
  organizations: ["admin", "organizations"] as const,
  policies: ["admin", "policies"] as const,
  apiKeys: ["admin", "api-keys"] as const,
  integrations: ["admin", "integrations"] as const,
  health: ["admin", "health"] as const,
  system: ["admin", "system"] as const,
  jobs: ["admin", "jobs"] as const,
  announcements: ["admin", "announcements"] as const,
  securityEvents: ["admin", "security-events"] as const,
  loginActivity: ["admin", "login-activity"] as const,
};

export function useAdminDashboard() {
  return useQuery({
    queryKey: ADMIN_KEYS.dashboard,
    queryFn: getAdminDashboard,
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ADMIN_KEYS.users,
    queryFn: getUsers,
  });
}

export function useUser(id: string | null) {
  return useQuery({
    queryKey: ADMIN_KEYS.user(id || ""),
    queryFn: () => getUser(id!),
    enabled: Boolean(id),
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserInvitationCreate) => inviteUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.users });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.dashboard });
    },
  });
}

export function useDisableUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => disableUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.users });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.dashboard });
    },
  });
}

export function useEnableUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enableUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.users });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.dashboard });
    },
  });
}

export function useRevokeUserSessions() {
  return useMutation({
    mutationFn: (id: string) => revokeUserSessions(id),
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ADMIN_KEYS.roles,
    queryFn: getRoles,
  });
}

export function useRole(name: string) {
  return useQuery({
    queryKey: ADMIN_KEYS.role(name),
    queryFn: () => getRole(name),
    enabled: Boolean(name),
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: ADMIN_KEYS.permissions,
    queryFn: getPermissions,
  });
}

export function useOrganizations() {
  return useQuery({
    queryKey: ADMIN_KEYS.organizations,
    queryFn: getOrganizations,
  });
}

export function useSuspendOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => suspendOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.organizations });
    },
  });
}

export function useActivateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activateOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.organizations });
    },
  });
}

export function useSecurityPolicies() {
  return useQuery({
    queryKey: ADMIN_KEYS.policies,
    queryFn: getSecurityPolicies,
  });
}

export function useUpdateSecurityPolicies() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<SecurityPolicies>) => updateSecurityPolicies(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.policies });
    },
  });
}

export function useApiKeys() {
  return useQuery({
    queryKey: ADMIN_KEYS.apiKeys,
    queryFn: getApiKeys,
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; expiration_days?: number }) => createApiKey(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.apiKeys });
    },
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => revokeApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.apiKeys });
    },
  });
}

export function useIntegrations() {
  return useQuery({
    queryKey: ADMIN_KEYS.integrations,
    queryFn: getIntegrations,
  });
}

export function useTestIntegration() {
  return useMutation({
    mutationFn: (id: string) => testIntegration(id),
  });
}

export function useUpdateIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name?: string; status?: string; credentials?: Record<string, any> } }) =>
      updateIntegration(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.integrations });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.health });
    },
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ADMIN_KEYS.health,
    queryFn: getSystemHealth,
    refetchInterval: 30000,
  });
}

export function useSystemDiagnostics() {
  return useQuery({
    queryKey: ADMIN_KEYS.system,
    queryFn: getSystemDiagnostics,
  });
}

export function useBackgroundJobs() {
  return useQuery({
    queryKey: ADMIN_KEYS.jobs,
    queryFn: getBackgroundJobs,
    refetchInterval: 10000,
  });
}

export function useRetryBackgroundJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => retryBackgroundJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.jobs });
    },
  });
}

export function useCancelBackgroundJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelBackgroundJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.jobs });
    },
  });
}

export function useAnnouncements() {
  return useQuery({
    queryKey: ADMIN_KEYS.announcements,
    queryFn: getAnnouncements,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.announcements });
    },
  });
}

export function useSecurityEvents() {
  return useQuery({
    queryKey: ADMIN_KEYS.securityEvents,
    queryFn: getSecurityEvents,
  });
}

export function useLoginActivity() {
  return useQuery({
    queryKey: ADMIN_KEYS.loginActivity,
    queryFn: getLoginActivity,
  });
}
