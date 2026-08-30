import { z } from "zod";

export const AuditFilterSchema = z.object({
  action: z.string().optional(),
  resource_type: z.string().optional(),
  user_id: z.string().uuid().optional(),
  skip: z.number().nonnegative().default(0),
  limit: z.number().positive().max(100).default(50),
});
