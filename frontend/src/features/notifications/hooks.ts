import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createNotificationRule,
  deleteNotification,
  deleteNotificationRule,
  getNotificationPreferences,
  getNotificationRules,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
  updateNotificationRule,
} from "./api";
import type { NotificationPreferences, NotificationRuleCreate } from "./types";

export const NOTIFICATION_KEYS = {
  all: ["notifications"] as const,
  list: (params?: { read?: boolean; severity?: string }) => ["notifications", "list", params] as const,
  preferences: ["notifications", "preferences"] as const,
  rules: ["notifications", "rules"] as const,
};

export function useNotifications(params?: { read?: boolean; severity?: string }) {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.list(params),
    queryFn: () => getNotifications(params),
    refetchInterval: 15000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.preferences,
    queryFn: getNotificationPreferences,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<NotificationPreferences>) => updateNotificationPreferences(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.preferences });
    },
  });
}

export function useNotificationRules() {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.rules,
    queryFn: getNotificationRules,
  });
}

export function useCreateNotificationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: NotificationRuleCreate) => createNotificationRule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.rules });
    },
  });
}

export function useUpdateNotificationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<NotificationRuleCreate> }) =>
      updateNotificationRule(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.rules });
    },
  });
}

export function useDeleteNotificationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNotificationRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.rules });
    },
  });
}
