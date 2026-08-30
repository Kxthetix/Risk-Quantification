import { apiClient } from "@/lib/api/client";
import {
  User,
  UserInvitePayload,
  UserUpdateRolePayload,
  UserStatusUpdatePayload,
  UserFilterParams,
} from "./types";

export const usersApi = {
  listUsers: async (params: UserFilterParams = {}): Promise<User[]> => {
    return apiClient.get<User[]>("/users", { params });
  },

  getUserById: async (id: string): Promise<User> => {
    return apiClient.get<User>(`/users/${id}`);
  },

  inviteUser: async (payload: UserInvitePayload): Promise<User> => {
    return apiClient.post<User>("/users", payload);
  },

  updateUser: async (id: string, payload: Partial<User>): Promise<User> => {
    return apiClient.put<User>(`/users/${id}`, payload);
  },

  updateUserRole: async (
    id: string,
    payload: UserUpdateRolePayload
  ): Promise<User> => {
    return apiClient.put<User>(`/users/${id}`, payload);
  },

  suspendUser: async (id: string, reason?: string): Promise<User> => {
    return apiClient.put<User>(`/users/${id}`, {
      status: "SUSPENDED",
      suspension_reason: reason,
    });
  },

  reactivateUser: async (id: string): Promise<User> => {
    return apiClient.put<User>(`/users/${id}`, {
      status: "ACTIVE",
    });
  },

  resendInvitation: async (id: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(`/users/${id}/resend-invitation`);
  },

  cancelInvitation: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/users/${id}/invitation`);
  },

  deleteUser: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/users/${id}`);
  },
};
