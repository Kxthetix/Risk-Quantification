import { z } from "zod";

export const remediationTypeEnum = z.enum([
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
]);

export const remediationStatusEnum = z.enum([
  "OPEN",
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "VERIFIED",
  "ACCEPTED_RISK",
  "REJECTED",
]);

export const remediationPriorityLevelEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const remediationCostDetailsSchema = z.object({
  minimum_cost: z.coerce.number().min(0).default(0),
  most_likely_cost: z.coerce.number().min(0).default(0),
  maximum_cost: z.coerce.number().min(0).default(0),
  labor_cost: z.coerce.number().min(0).default(0),
  technology_cost: z.coerce.number().min(0).default(0),
  one_time_cost: z.coerce.number().min(0).default(0),
  recurring_annual_cost: z.coerce.number().min(0).default(0),
  confidence: z.coerce.number().min(0.1).max(1.0).default(0.8),
});

export const remediationCreateSchema = z.object({
  asset_vulnerability_id: z.string().uuid().optional().nullable(),
  title: z.string().min(3, "Title must be at least 3 characters").max(255),
  description: z.string().optional(),
  remediation_type: remediationTypeEnum,
  estimated_cost: z.coerce.number().min(0, "Cost must be non-negative").default(0),
  estimated_duration_hours: z.coerce.number().min(0.1).optional().nullable(),
  due_date: z.string().optional().nullable(),
  assigned_to: z.string().optional().nullable(),
  cost_details: remediationCostDetailsSchema.optional().nullable(),
});

export const remediationUpdateSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().optional(),
  remediation_type: remediationTypeEnum.optional(),
  status: remediationStatusEnum.optional(),
  estimated_cost: z.coerce.number().min(0).optional(),
  estimated_duration_hours: z.coerce.number().min(0.1).optional().nullable(),
  due_date: z.string().optional().nullable(),
  assigned_to: z.string().optional().nullable(),
  cost_details: remediationCostDetailsSchema.optional().nullable(),
});

export const remediationVerifySchema = z.object({
  evidence: z.record(z.any()).default({}),
  verification_notes: z.string().optional(),
});

export const riskAcceptanceSchema = z.object({
  business_justification: z.string().min(10, "Justification must be at least 10 characters"),
  accepted_by: z.string().min(2, "Approver name required"),
  expiration_date: z.string().min(4, "Expiration date required"),
  compensating_controls: z.string().optional(),
});
