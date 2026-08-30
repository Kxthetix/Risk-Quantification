import { apiClient } from "@/lib/api/client";
import { BusinessService, BusinessServiceCreatePayload } from "./types";
import { FinancialServiceRisk } from "@/features/dashboard/types";

export const businessServicesApi = {
  list: async (): Promise<BusinessService[]> => {
    return apiClient.get<BusinessService[]>("/financial/business-services");
  },

  create: async (payload: BusinessServiceCreatePayload): Promise<BusinessService> => {
    return apiClient.post<BusinessService>("/financial/business-services", payload);
  },

  getFinancialRankings: async (): Promise<FinancialServiceRisk[]> => {
    return apiClient.get<FinancialServiceRisk[]>("/dashboard/financial-risk/business-services");
  },
};
