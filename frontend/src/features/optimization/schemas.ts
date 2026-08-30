import { z } from "zod";

export const optimizationAlgorithmEnum = z.enum(["KNAPSACK", "GREEDY"]);

export const optimizationRunSchema = z.object({
  budget: z.coerce.number().min(10000, "Budget must be at least ₹10,000"),
  algorithm: optimizationAlgorithmEnum.default("KNAPSACK"),
  scenario_id: z.string().uuid().optional().nullable(),
  horizon_years: z.coerce.number().min(1).max(10).default(1),
  synchronous: z.boolean().default(true),
});

export const whatIfOptimizationSchema = z.object({
  remediation_ids: z.array(z.string()).default([]),
  control_ids: z.array(z.string()).default([]),
  horizon_years: z.coerce.number().min(1).max(10).default(1),
});
