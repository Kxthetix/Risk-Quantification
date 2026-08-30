import { z } from "zod";

export const retryStepSchema = z.object({
  step_id: z.string().min(1, "Step ID is required"),
  force_override: z.boolean().default(false),
});

export type RetryStepInput = z.infer<typeof retryStepSchema>;

export const rollbackExecutionSchema = z.object({
  reason: z.string().min(3, "Rollback reason is required"),
  authorized_by: z.string().min(2, "Authorizer name is required"),
});

export type RollbackExecutionInput = z.infer<typeof rollbackExecutionSchema>;
