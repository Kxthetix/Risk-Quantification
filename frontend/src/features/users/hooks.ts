import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "./api";
import { User, UserInvitePayload, UserFilterParams } from "./types";
import { useToast } from "@/providers/ToastProvider";
import { getFriendlyErrorMessage } from "@/lib/api/errors";

export const USERS_QUERY_KEYS = {
  all: ["users"] as const,
  list: (params?: UserFilterParams) => ["users", "list", params] as const,
  detail: (id?: string) => ["users", "detail", id] as const,
};

export function useUsers(params: UserFilterParams = {}) {
  return useQuery({
    queryKey: USERS_QUERY_KEYS.list(params),
    queryFn: () => usersApi.listUsers(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useUser(id?: string) {
  return useQuery({
    queryKey: USERS_QUERY_KEYS.detail(id),
    queryFn: () => usersApi.getUserById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: UserInvitePayload) => usersApi.inviteUser(payload),
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.all });
      toast({
        title: "User Invited Successfully",
        description: `Invitation sent to ${newUser.email}.`,
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Invitation failed",
        description: getFriendlyErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      role,
    }: {
      id: string;
      role: "ADMIN" | "SECURITY_ANALYST" | "MANAGER" | "VIEWER";
    }) => usersApi.updateUserRole(id, { role }),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.all });
      toast({
        title: "User Role Updated",
        description: `${updatedUser.full_name}'s role was changed to ${updatedUser.role}.`,
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Role update failed",
        description: getFriendlyErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useSuspendUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      usersApi.suspendUser(id, reason),
    onSuccess: (suspendedUser) => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.all });
      toast({
        title: "User Suspended",
        description: `${suspendedUser.full_name}'s account access has been suspended.`,
        variant: "warning",
      });
    },
    onError: (error) => {
      toast({
        title: "Suspension failed",
        description: getFriendlyErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useReactivateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => usersApi.reactivateUser(id),
    onSuccess: (reactivatedUser) => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.all });
      toast({
        title: "User Reactivated",
        description: `${reactivatedUser.full_name}'s account has been restored to Active.`,
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Reactivation failed",
        description: getFriendlyErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEYS.all });
      toast({
        title: "User Removed",
        description: "User account has been permanently removed.",
        variant: "info",
      });
    },
    onError: (error) => {
      toast({
        title: "Deletion failed",
        description: getFriendlyErrorMessage(error),
        variant: "error",
      });
    },
  });
}
