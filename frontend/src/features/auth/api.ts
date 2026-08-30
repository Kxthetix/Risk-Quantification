import { apiClient } from "@/lib/api/client";
import {
  TokenResponse,
  RefreshTokenRequest,
  User,
  ChangePasswordPayload,
  UserProfileUpdatePayload,
} from "./types";

export const authApi = {
  login: async (payload: { email: string; password: string }): Promise<TokenResponse> => {
    return apiClient.post<TokenResponse>("/auth/login", payload, { skipAuth: true });
  },

  logout: async (refreshToken?: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(
      "/auth/logout",
      refreshToken ? { refresh_token: refreshToken } : {}
    );
  },

  refreshSession: async (payload: RefreshTokenRequest): Promise<TokenResponse> => {
    return apiClient.post<TokenResponse>("/auth/refresh", payload, { skipAuth: true });
  },

  getCurrentUser: async (): Promise<User> => {
    return apiClient.get<User>("/auth/me");
  },

  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>("/auth/forgot-password", { email }, { skipAuth: true });
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(
      "/auth/reset-password",
      { token, new_password: newPassword },
      { skipAuth: true }
    );
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>("/auth/change-password", payload);
  },

  updateProfile: async (payload: UserProfileUpdatePayload): Promise<User> => {
    return apiClient.patch<User>("/auth/me", payload);
  },
};
