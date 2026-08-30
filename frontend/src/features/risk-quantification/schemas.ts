import { z } from "zod";

export const scenarioCreateSchema = z.object({
  name: z.string().min(3, "Scenario name must be at least 3 characters").max(255),
  description: z.string().max(2000).optional().or(z.literal("")),
  category: z.enum([
    "RANSOMWARE",
    "DATA_BREACH",
    "BUSINESS_INTERRUPTION",
    "CLOUD_OUTAGE",
    "INSIDER_THREAT",
    "SUPPLY_CHAIN",
    "CREDENTIAL_THEFT",
    "DDOS",
    "FRAUD",
    "THIRD_PARTY",
  ]),
  business_service_id: z.string().optional().or(z.literal("")),
  risk_owner: z.string().max(128).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("ACTIVE"),
  affected_asset_ids: z.array(z.string()).default([]),
  
  // Frequency
  frequency_method: z.enum(["ARO", "HISTORICAL", "EXPERT"]).default("ARO"),
  annual_rate_of_occurrence: z.coerce.number().min(0.001, "ARO must be greater than 0").max(100).default(0.35),
  frequency_min: z.coerce.number().min(0).optional(),
  frequency_mode: z.coerce.number().min(0).optional(),
  frequency_max: z.coerce.number().min(0).optional(),
  
  // Loss magnitude
  expected_downtime_hours: z.coerce.number().min(0).default(8),
  hourly_downtime_cost: z.coerce.number().min(0).optional(),
  expected_revenue_loss: z.coerce.number().min(0).optional(),
  recovery_cost: z.coerce.number().min(0).default(500000),
  data_breach_records: z.coerce.number().min(0).optional().default(0),
  cost_per_record: z.coerce.number().min(0).optional().default(250),
  potential_regulatory_fine: z.coerce.number().min(0).optional().default(0),
  legal_and_consulting_cost: z.coerce.number().min(0).optional().default(0),
  customer_compensation: z.coerce.number().min(0).optional().default(0),
  third_party_penalty: z.coerce.number().min(0).optional().default(0),
  insurance_recovery_limit: z.coerce.number().min(0).optional().default(0),
  insurance_deductible: z.coerce.number().min(0).optional().default(0),
  
  // Simulation
  simulation_count: z.coerce.number().min(1000).max(500000).default(10000),
  random_seed: z.coerce.number().default(42),
});

export type ScenarioCreateFormData = z.infer<typeof scenarioCreateSchema>;

export const whatIfSchema = z.object({
  downtime_hours: z.coerce.number().min(0).optional(),
  recovery_hours: z.coerce.number().min(0).optional(),
  dependency_factor: z.coerce.number().min(0).max(1).optional(),
  data_exposure_probability: z.coerce.number().min(0).max(1).optional(),
  incident_probability: z.coerce.number().min(0).max(1).optional(),
});

export type WhatIfFormData = z.infer<typeof whatIfSchema>;

export const controlRoiSchema = z.object({
  control_name: z.string().min(2, "Control title required").max(128),
  implementation_cost: z.coerce.number().min(0, "Cost must be positive"),
  risk_reduction_percentage: z.coerce.number().min(0.01).max(1.0).default(0.3),
});

export type ControlRoiFormData = z.infer<typeof controlRoiSchema>;

export const riskAppetiteSchema = z.object({
  max_expected_annual_loss: z.coerce.number().min(0, "Must be positive"),
  max_single_loss: z.coerce.number().min(0, "Must be positive"),
  max_p95_loss: z.coerce.number().min(0, "Must be positive"),
  max_service_exposure: z.coerce.number().min(0, "Must be positive"),
});

export type RiskAppetiteFormData = z.infer<typeof riskAppetiteSchema>;
