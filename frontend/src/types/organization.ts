import { CurrencyCode } from "./common";

export interface OrganizationSettings {
  default_currency: CurrencyCode;
  timezone: string;
  country?: string;
  risk_tolerance_threshold?: number;
  financial_currency_symbol?: string;
  mfa_required?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  industry?: string;
  description?: string;
  logo_url?: string;
  settings?: OrganizationSettings;
  created_at: string;
  updated_at: string;
}
