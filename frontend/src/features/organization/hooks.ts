import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { organizationApi } from "./api";
import { OrganizationUpdatePayload } from "./types";
import { useOrganization as useOrgContext } from "@/providers/OrganizationProvider";
import { useToast } from "@/providers/ToastProvider";
import { getFriendlyErrorMessage } from "@/lib/api/errors";

export const ORG_QUERY_KEYS = {
  organization: (id?: string) => ["organization", id] as const,
};

export function useOrganization(organizationId?: string) {
  const { organization: contextOrg } = useOrgContext();
  const targetId = organizationId || contextOrg?.id;

  return useQuery({
    queryKey: ORG_QUERY_KEYS.organization(targetId),
    queryFn: () => organizationApi.getOrganization(targetId!),
    enabled: !!targetId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  const { organization: contextOrg, updateSettings } = useOrgContext();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id?: string;
      payload: OrganizationUpdatePayload;
    }) => {
      const targetId = id || contextOrg?.id;
      if (!targetId) throw new Error("No active organization found");
      const updated = await organizationApi.updateOrganization(targetId, payload);
      await updateSettings(payload);
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(ORG_QUERY_KEYS.organization(updated.id), updated);
      toast({
        title: "Organization Updated",
        description: "Organization profile and settings have been saved successfully.",
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

export function useUploadOrganizationLogo() {
  const queryClient = useQueryClient();
  const { organization: contextOrg } = useOrgContext();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, file }: { id?: string; file: File }) => {
      const targetId = id || contextOrg?.id;
      if (!targetId) throw new Error("No active organization found");
      return organizationApi.uploadLogo(targetId, file);
    },
    onSuccess: (data, variables) => {
      const targetId = variables.id || contextOrg?.id;
      queryClient.invalidateQueries({ queryKey: ORG_QUERY_KEYS.organization(targetId) });
      toast({
        title: "Logo Uploaded",
        description: "Organization branding logo updated successfully.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: getFriendlyErrorMessage(error),
        variant: "error",
      });
    },
  });
}
