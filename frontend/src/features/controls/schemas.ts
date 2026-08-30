import { z } from "zod";

export const controlTypeEnum = z.enum([
  "WAF",
  "EDR",
  "MFA",
  "NETWORK_SEGMENTATION",
  "PAM",
  "IDS_IPS",
  "BACKUP",
  "ZERO_TRUST_ACCESS",
  "SIEM",
]);

export const controlCreateSchema = z.object({
  code: z.string().min(2, "Control code must be at least 2 characters").max(50),
  name: z.string().min(2, "Control name must be at least 2 characters").max(255),
  description: z.string().optional(),
  control_type: controlTypeEnum,
  effectiveness_score: z.coerce.number().min(0, "Effectiveness must be between 0 and 100").max(100),
  coverage_percentage: z.coerce.number().min(0, "Coverage must be between 0 and 100").max(100),
  annual_cost: z.coerce.number().min(0, "Annual cost must be non-negative").default(0),
  implementation_cost: z.coerce.number().min(0, "Implementation cost must be non-negative").default(0),
  is_active: z.boolean().default(true),
  notes: z.string().optional(),
});

export const controlUpdateSchema = controlCreateSchema.partial();

export const controlEffectivenessCreateSchema = z.object({
  threat_scenario_type: z.string().optional().nullable(),
  risk_factor_type: z.string().optional().nullable(),
  vulnerability_category: z.string().optional().nullable(),
  attenuation_factor: z.coerce.number().min(0.01, "Attenuation factor must be between 0.01 and 1.0").max(1.0),
  confidence: z.coerce.number().min(0.1, "Confidence must be between 0.1 and 1.0").max(1.0).default(0.8),
  description: z.string().optional().nullable(),
});
