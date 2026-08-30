import { z } from "zod";

export const caseCreateSchema = z.object({
  title: z.string().min(3, "Case title must be at least 3 characters"),
  description: z.string().min(5, "Description is required"),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).default("HIGH"),
  lead_investigator: z.string().min(2, "Lead investigator is required"),
  incident_ids: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  hypothesis: z.string().optional(),
});

export type CaseCreateInput = z.infer<typeof caseCreateSchema>;

export const caseUpdateSchema = z.object({
  title: z.string().optional(),
  severity: z.string().optional(),
  status: z.string().optional(),
  lead_investigator: z.string().optional(),
  incident_ids: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  hypothesis: z.string().optional(),
});

export type CaseUpdateInput = z.infer<typeof caseUpdateSchema>;
