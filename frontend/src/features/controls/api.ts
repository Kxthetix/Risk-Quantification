import { apiClient } from "@/lib/api/client";
import {
  SecurityControl,
  ControlEffectiveness,
  ControlCreateInput,
  ControlUpdateInput,
  ControlEffectivenessInput,
  ControlType,
} from "./types";

export const controlsApi = {
  getControls: async (params?: { control_type?: ControlType; enabled?: boolean }): Promise<SecurityControl[]> => {
    return apiClient.get<SecurityControl[]>("/api/v1/controls", { params });
  },

  getControl: async (controlId: string): Promise<SecurityControl> => {
    return apiClient.get<SecurityControl>(`/api/v1/controls/${controlId}`);
  },

  createControl: async (payload: ControlCreateInput): Promise<SecurityControl> => {
    return apiClient.post<SecurityControl>("/api/v1/controls", payload);
  },

  updateControl: async (controlId: string, payload: ControlUpdateInput): Promise<SecurityControl> => {
    return apiClient.put<SecurityControl>(`/api/v1/controls/${controlId}`, payload);
  },

  deleteControl: async (controlId: string): Promise<void> => {
    return apiClient.delete<void>(`/api/v1/controls/${controlId}`);
  },

  seedDefaultControls: async (): Promise<SecurityControl[]> => {
    return apiClient.post<SecurityControl[]>("/api/v1/controls/seed-defaults", {});
  },

  addEffectiveness: async (
    controlId: string,
    payload: ControlEffectivenessInput
  ): Promise<ControlEffectiveness> => {
    return apiClient.post<ControlEffectiveness>(`/api/v1/controls/${controlId}/effectiveness`, payload);
  },
};
