import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "./api";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";
import { ChangePasswordPayload, UserProfileUpdatePayload } from "./types";
import { getFriendlyErrorMessage } from "@/lib/api/errors";

export const AUTH_QUERY_KEYS = {
  currentUser: ["auth", "currentUser"] as const,
};

export function useCurrentUser() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: AUTH_QUERY_KEYS.currentUser,
    queryFn: () => authApi.getCurrentUser(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useLogin() {
  const { login } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      email,
      password,
      rememberMe,
    }: {
      email: string;
      password: string;
      rememberMe?: boolean;
    }) => {
      await login(email, password, rememberMe);
    },
    onSuccess: () => {
      toast({
        title: "Authenticated Successfully",
        description: "Welcome to the CyberRisk Analytics Platform.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Sign in failed",
        description: getFriendlyErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useLogout() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      await logout();
    },
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: "Signed Out",
        description: "Your session has been terminated safely.",
        variant: "info",
      });
    },
  });
}

export function useRequestPasswordReset() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (email: string) => authApi.requestPasswordReset(email),
    onSuccess: () => {
      toast({
        title: "Reset link sent",
        description: "If an account exists, password reset instructions have been delivered.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Request failed",
        description: getFriendlyErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useResetPassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      authApi.resetPassword(token, newPassword),
    onSuccess: () => {
      toast({
        title: "Password Reset Successfully",
        description: "You may now sign in using your updated credentials.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Reset failed",
        description: getFriendlyErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useChangePassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => authApi.changePassword(payload),
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "Your account password has been changed successfully.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: getFriendlyErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: UserProfileUpdatePayload) => authApi.updateProfile(payload),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(AUTH_QUERY_KEYS.currentUser, updatedUser);
      toast({
        title: "Profile Updated",
        description: "Your user profile details have been saved.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: getFriendlyErrorMessage(error),
        variant: "error",
      });
    },
  });
}
