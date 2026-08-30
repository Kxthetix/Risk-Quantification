import { z } from "zod";

export const playbookStepSchema = z.object({
  step_id: z.string(),
  step_number: z.number().int(),
  name: z.string().min(2, "Step name is required"),
  action_type: z.string().min(2, "Action type is required"),
  target_type: z.string().default("ASSET"),
  default_target: z.string().optional(),
  requires_approval: z.boolean().default(false),
  is_high_risk: z.boolean().default(false),
  condition: z.string().optional(),
  timeout_seconds: z.number().int().default(60),
  rollback_action: z.string().optional(),
});

export type PlaybookStepInput = z.infer<typeof playbookStepSchema>;

export const playbookCreateSchema = z.object({
  name: z.string().min(3, "Playbook name must be at least 3 characters"),
  description: z.string().min(5, "Description is required"),
  category: z.string().min(2, "Category is required"),
  trigger_type: z.enum(["AUTOMATIC", "MANUAL", "SCHEDULED"]).default("MANUAL"),
  status: z.enum(["ENABLED", "DISABLED", "DRAFT"]).default("ENABLED"),
  steps: z.array(playbookStepSchema).default([]),
  required_permissions: z.array(z.string()).default([]),
});

export type PlaybookCreateInput = z.infer<typeof playbookCreateSchema>;

export const playbookExecutionSchema = z.object({
  incident_id: z.string().optional(),
  target_parameters: z.record(z.any()).default({}),
  dry_run: z.boolean().default(false),
});

export type PlaybookExecutionInput = z.infer<typeof playbookExecutionSchema>;
