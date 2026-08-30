import { z } from "zod";

export const alertAssignSchema = z.object({
  assigned_to: z.string().min(2, "Assignee name or role is required"),
  notes: z.string().optional(),
});

export type AlertAssignInput = z.infer<typeof alertAssignSchema>;

export const alertResolveSchema = z.object({
  resolution_notes: z.string().min(5, "Resolution notes must be at least 5 characters"),
  root_cause: z.string().optional(),
});

export type AlertResolveInput = z.infer<typeof alertResolveSchema>;

export const alertFalsePositiveSchema = z.object({
  reason: z.string().min(5, "Justification must be at least 5 characters"),
  comment: z.string().optional(),
});

export type AlertFalsePositiveInput = z.infer<typeof alertFalsePositiveSchema>;
