import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { controlsApi } from "./api";
import {
  ControlCreateInput,
  ControlEffectivenessInput,
  ControlType,
  ControlUpdateInput,
  SecurityControl,
} from "./types";

export const CONTROLS_QUERY_KEY = ["controls"] as const;

export function useControls(params?: { control_type?: ControlType; enabled?: boolean }) {
  return useQuery({
    queryKey: [...CONTROLS_QUERY_KEY, params],
    queryFn: () => controlsApi.getControls(params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useControl(controlId: string) {
  return useQuery({
    queryKey: [...CONTROLS_QUERY_KEY, "detail", controlId],
    queryFn: () => controlsApi.getControl(controlId),
    enabled: Boolean(controlId),
  });
}

export function useCreateControl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ControlCreateInput) => controlsApi.createControl(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTROLS_QUERY_KEY });
    },
  });
}

export function useUpdateControl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ controlId, payload }: { controlId: string; payload: ControlUpdateInput }) =>
      controlsApi.updateControl(controlId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CONTROLS_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: [...CONTROLS_QUERY_KEY, "detail", variables.controlId],
      });
    },
  });
}

export function useDeleteControl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (controlId: string) => controlsApi.deleteControl(controlId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTROLS_QUERY_KEY });
    },
  });
}

export function useSeedDefaultControls() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => controlsApi.seedDefaultControls(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTROLS_QUERY_KEY });
    },
  });
}

export function useAddControlEffectiveness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      controlId,
      payload,
    }: {
      controlId: string;
      payload: ControlEffectivenessInput;
    }) => controlsApi.addEffectiveness(controlId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CONTROLS_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: [...CONTROLS_QUERY_KEY, "detail", variables.controlId],
      });
    },
  });
}
