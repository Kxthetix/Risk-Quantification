export * from "@/types/organization";

export interface OrganizationUpdatePayload {
  name?: string;
  description?: string;
  industry?: string;
  country?: string;
  timezone?: string;
  default_currency?: "INR" | "USD" | "EUR" | "GBP" | "JPY";
  logo_url?: string;
}
