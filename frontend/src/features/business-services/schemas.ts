import { z } from "zod";

export const businessServiceSchema = z.object({
  name: z.string().min(2, "Service name must have at least 2 characters").max(255),
  description: z.string().max(2000).optional().or(z.literal("")),
  revenue_dependency: z.coerce.number().min(0).max(1).default(1.0),
  criticality: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("HIGH"),
  daily_transaction_count: z.coerce.number().int().min(0).default(0),
  average_transaction_value: z.coerce.number().min(0).default(0),
});

export type BusinessServiceFormData = z.infer<typeof businessServiceSchema>;
