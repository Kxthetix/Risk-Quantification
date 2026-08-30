import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vulnerabilitiesApi } from "./api";
import {
  VulnerabilityFilterParams,
  RemediationCreatePayload,
  RiskAcceptancePayload,
} from "./types";
import { useToast } from "@/providers/ToastProvider";
import { getFriendlyErrorMessage } from "@/lib/api/errors";

export const VULNERABILITY_QUERY_KEYS = {
  all: ["vulnerabilities"] as const,
  list: (params?: VulnerabilityFilterParams) => ["vulnerabilities", "list", params] as const,
  statistics: ["vulnerabilities", "statistics"] as const,
  search: (q: string) => ["vulnerabilities", "search", q] as const,
  detail: (cveId: string) => ["vulnerabilities", "detail", cveId] as const,
  syncStatus: (jobId: string) => ["vulnerabilities", "sync", jobId] as const,
  validationQueue: ["validation", "review-queue"] as const,
};

export function useVulnerabilities(params?: VulnerabilityFilterParams) {
  return useQuery({
    queryKey: VULNERABILITY_QUERY_KEYS.list(params),
    queryFn: () => vulnerabilitiesApi.list(params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useVulnerabilityStatistics() {
  return useQuery({
    queryKey: VULNERABILITY_QUERY_KEYS.statistics,
    queryFn: () => vulnerabilitiesApi.getStatistics(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useSearchVulnerabilities(q: string) {
  return useQuery({
    queryKey: VULNERABILITY_QUERY_KEYS.search(q),
    queryFn: () => vulnerabilitiesApi.search(q),
    enabled: q.trim().length > 0,
    staleTime: 1000 * 60,
  });
}

export function useVulnerability(cveId: string) {
  return useQuery({
    queryKey: VULNERABILITY_QUERY_KEYS.detail(cveId),
    queryFn: () => vulnerabilitiesApi.getByCveId(cveId),
    enabled: !!cveId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSyncJobStatus(jobId?: string) {
  return useQuery({
    queryKey: VULNERABILITY_QUERY_KEYS.syncStatus(jobId || ""),
    queryFn: () => vulnerabilitiesApi.getSyncJobStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "COMPLETED" || status === "FAILED" ? false : 2000;
    },
  });
}

export function useTriggerNvdSync() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ maxRecords, cveId }: { maxRecords?: number; cveId?: string }) =>
      vulnerabilitiesApi.triggerNvdSync(maxRecords, cveId),
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: VULNERABILITY_QUERY_KEYS.all });
      toast({
        title: "NVD Sync Dispatched",
        description: `Job ID ${job.job_id} queued for CVE ingestion.`,
        variant: "info",
      });
    },
    onError: (error) => {
      toast({
        title: "Sync Failed to Start",
        description: getFriendlyErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useMatchVulnerabilities() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (assetId?: string) => vulnerabilitiesApi.matchInventory(assetId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: VULNERABILITY_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast({
        title: "Matching Engine Complete",
        description: `Correlated ${res.software_processed} packages and detected ${res.matches_found} vulnerability instances.`,
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Matching Failed",
        description: getFriendlyErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useValidationReviewQueue() {
  return useQuery({
    queryKey: VULNERABILITY_QUERY_KEYS.validationQueue,
    queryFn: () => vulnerabilitiesApi.getValidationQueue(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateRemediation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: RemediationCreatePayload) =>
      vulnerabilitiesApi.createRemediation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VULNERABILITY_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["remediations"] });
      toast({
        title: "Remediation Action Created",
        description: "Assigned treatment action to security operations queue.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Remediation",
        description: getFriendlyErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useAcceptRisk() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      remediationId,
      payload,
    }: {
      remediationId: string;
      payload: RiskAcceptancePayload;
    }) => vulnerabilitiesApi.acceptRisk(remediationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VULNERABILITY_QUERY_KEYS.all });
      toast({
        title: "Risk Accepted",
        description: "Risk acceptance recorded with formal expiration in audit ledger.",
        variant: "warning",
      });
    },
    onError: (error) => {
      toast({
        title: "Risk Acceptance Failed",
        description: getFriendlyErrorMessage(error),
        variant: "error",
      });
    },
  });
}
