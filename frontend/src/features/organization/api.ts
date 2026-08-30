import { apiClient } from "@/lib/api/client";
import { Organization, OrganizationUpdatePayload } from "./types";

export const organizationApi = {
  getOrganization: async (id: string): Promise<Organization> => {
    return apiClient.get<Organization>(`/organizations/${id}`);
  },

  updateOrganization: async (
    id: string,
    payload: OrganizationUpdatePayload
  ): Promise<Organization> => {
    return apiClient.put<Organization>(`/organizations/${id}`, payload);
  },

  uploadLogo: async (id: string, file: File): Promise<{ logo_url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<{ logo_url: string }>(`/organizations/${id}/logo`, formData);
  },
};
