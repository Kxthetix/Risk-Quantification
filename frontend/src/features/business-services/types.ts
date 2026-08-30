import { AssetCriticality } from "@/types/asset";

export interface BusinessService {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  revenue_dependency: number;
  criticality: AssetCriticality;
  daily_transaction_count: number;
  average_transaction_value: number;
  created_at: string;
  updated_at: string;
  // Computed analytics
  risk_score?: number;
  expected_loss?: number;
  p90_loss?: number;
  asset_count?: number;
}

export interface BusinessServiceCreatePayload {
  name: string;
  description?: string;
  revenue_dependency?: number;
  criticality?: AssetCriticality;
  daily_transaction_count?: number;
  average_transaction_value?: number;
}

export interface BusinessServiceUpdatePayload extends Partial<BusinessServiceCreatePayload> {}
