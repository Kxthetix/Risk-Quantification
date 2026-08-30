import { z } from "zod";

export const remediationCreateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(255),
  description: z.string().max(2000).optional().or(z.literal("")),
  remediation_type: z.enum([
    "PATCH",
    "UPGRADE",
    "CONFIGURATION_CHANGE",
    "NETWORK_SEGMENTATION",
    "ACCESS_CONTROL",
    "MFA",
    "WAF_RULE",
    "FIREWALL_RULE",
    "VIRTUAL_PATCH",
    "COMPENSATING_CONTROL",
    "ASSET_RETIREMENT",
  ]),
  priority_level: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("HIGH"),
  assigned_team: z.string().max(128).optional().or(z.literal("")),
  due_date: z.string().optional().or(z.literal("")),
  estimated_cost: z.coerce.number().min(0).optional(),
  recommended_fix: z.string().max(1000).optional().or(z.literal("")),
});

export type RemediationCreateFormData = z.infer<typeof remediationCreateSchema>;

export const riskAcceptanceSchema = z.object({
  justification: z
    .string()
    .min(10, "A detailed business justification of at least 10 characters is required")
    .max(2000),
  expiration_date: z.string().min(1, "Risk acceptance expiration date is mandatory"),
  approved_by: z.string().min(3, "Approver name / role is required").max(128),
  compensating_controls_in_place: z.string().max(1000).optional().or(z.literal("")),
});

export type RiskAcceptanceFormData = z.infer<typeof riskAcceptanceSchema>;

export const falsePositiveSchema = z.object({
  reason: z.string().min(10, "Provide a technical rationale of at least 10 characters").max(2000),
  evidence: z.string().max(2000).optional().or(z.literal("")),
  reviewer: z.string().min(3, "Reviewer identifier required").max(128),
});

export type FalsePositiveFormData = z.infer<typeof falsePositiveSchema>;
