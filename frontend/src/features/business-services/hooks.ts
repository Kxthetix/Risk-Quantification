import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { businessServicesApi } from "./api";
import { BusinessServiceCreatePayload } from "./types";
import { useToast } from "@/providers/ToastProvider";
import { getFriendlyErrorMessage } from "@/lib/api/errors";

export const BUSINESS_SERVICES_QUERY_KEYS = {
  all: ["business-services"] as const,
  list: ["business-services", "list"] as const,
  financialRankings: ["business-services", "financialRankings"] as const,
};

export function useBusinessServices() {
  return useQuery({
    queryKey: BUSINESS_SERVICES_QUERY_KEYS.list,
    queryFn: () => businessServicesApi.list(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useBusinessServicesRankings() {
  return useQuery({
    queryKey: BUSINESS_SERVICES_QUERY_KEYS.financialRankings,
    queryFn: () => businessServicesApi.getFinancialRankings(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateBusinessService() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: BusinessServiceCreatePayload) =>
      businessServicesApi.create(payload),
    onSuccess: (service) => {
      queryClient.invalidateQueries({ queryKey: BUSINESS_SERVICES_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Business service registered",
        description: `Successfully mapped ${service.name} into workflow catalog.`,
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: getFriendlyErrorMessage(error),
        variant: "error",
      });
    },
  });
}
