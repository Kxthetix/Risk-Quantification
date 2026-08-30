import { z } from "zod";

export const approvalActionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  justification: z.string().min(3, "Approval justification must be at least 3 characters"),
  approver_name: z.string().optional(),
  confirmed_destructive_risk: z.boolean().default(false),
});

export type ApprovalActionInput = z.infer<typeof approvalActionSchema>;
