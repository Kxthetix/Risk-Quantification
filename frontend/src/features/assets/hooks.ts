import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assetsApi } from "./api";
import {
  AssetFilterParams,
  AssetCreatePayload,
  AssetUpdatePayload,
  AssetPatchPayload,
  NetworkRelationshipCreatePayload,
} from "./types";
import { useToast } from "@/providers/ToastProvider";
import { getFriendlyErrorMessage } from "@/lib/api/errors";

export const ASSET_QUERY_KEYS = {
  all: ["assets"] as const,
  list: (params?: AssetFilterParams) => ["assets", "list", params] as const,
  statistics: ["assets", "statistics"] as const,
  search: (q: string) => ["assets", "search", q] as const,
  detail: (id: string) => ["assets", "detail", id] as const,
  risk: (id: string) => ["assets", "risk", id] as const,
  vulnerabilities: (id: string) => ["assets", "vulnerabilities", id] as const,
  software: (id: string) => ["assets", "software", id] as const,
  relationships: ["network", "relationships"] as const,
};

export function useAssets(params?: AssetFilterParams) {
  return useQuery({
    queryKey: ASSET_QUERY_KEYS.list(params),
    queryFn: () => assetsApi.list(params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useAssetStatistics() {
  return useQuery({
    queryKey: ASSET_QUERY_KEYS.statistics,
    queryFn: () => assetsApi.getStatistics(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useSearchAssets(q: string) {
  return useQuery({
    queryKey: ASSET_QUERY_KEYS.search(q),
    queryFn: () => assetsApi.search(q),
    enabled: q.trim().length > 0,
    staleTime: 1000 * 60,
  });
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: ASSET_QUERY_KEYS.detail(id),
    queryFn: () => assetsApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

export function useAssetRisk(id: string) {
  return useQuery({
    queryKey: ASSET_QUERY_KEYS.risk(id),
    queryFn: () => assetsApi.getRisk(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

export function useAssetVulnerabilities(id: string) {
  return useQuery({
    queryKey: ASSET_QUERY_KEYS.vulnerabilities(id),
    queryFn: () => assetsApi.listVulnerabilities(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

export function useAssetSoftware(id: string) {
  return useQuery({
    queryKey: ASSET_QUERY_KEYS.software(id),
    queryFn: () => assetsApi.listSoftware(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAssetRelationships() {
  return useQuery({
    queryKey: ASSET_QUERY_KEYS.relationships,
    queryFn: () => assetsApi.getRelationships(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: AssetCreatePayload) => assetsApi.create(payload),
    onSuccess: (asset) => {
      queryClient.invalidateQueries({ queryKey: ASSET_QUERY_KEYS.all });
      toast({
        title: "Asset registered",
        description: `Successfully added ${asset.name} to inventory.`,
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to register asset",
        description: getFriendlyErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AssetUpdatePayload }) =>
      assetsApi.update(id, payload),
    onSuccess: (asset) => {
      queryClient.invalidateQueries({ queryKey: ASSET_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ASSET_QUERY_KEYS.detail(asset.id) });
      toast({
        title: "Asset updated",
        description: `Changes to ${asset.name} saved successfully.`,
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

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => assetsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSET_QUERY_KEYS.all });
      toast({
        title: "Asset deleted",
        description: "The asset and its local bindings were removed.",
        variant: "success",
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

export function useCreateRelationship() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: NetworkRelationshipCreatePayload) =>
      assetsApi.createRelationship(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSET_QUERY_KEYS.relationships });
      toast({
        title: "Relationship connected",
        description: "Topology dependency link mapped.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create connection",
        description: getFriendlyErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useDeleteRelationship() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => assetsApi.deleteRelationship(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSET_QUERY_KEYS.relationships });
      toast({
        title: "Connection removed",
        description: "Topology edge detached.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove connection",
        description: getFriendlyErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useBulkRecalculateRisk() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ assetIds, allOrg }: { assetIds?: string[]; allOrg?: boolean }) =>
      assetsApi.calculateBulkRisk(assetIds, allOrg),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ASSET_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Risk recalculation complete",
        description: `Recalculated scores for ${res.processed_count} assets.`,
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Recalculation failed",
        description: getFriendlyErrorMessage(error),
        variant: "error",
      });
    },
  });
}
