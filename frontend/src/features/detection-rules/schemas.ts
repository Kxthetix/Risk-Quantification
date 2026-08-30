import { z } from "zod";

export const detectionRuleCreateSchema = z.object({
  name: z.string().min(2, "Rule name must be at least 2 characters"),
  description: z.string().min(5, "Description is required"),
  severity: z.string().default("HIGH"),
  source: z.string().default("SIEM"),
  mitre_technique: z.string().min(2, "MITRE technique is required"),
  mitre_tactic: z.string().min(2, "MITRE tactic is required"),
  detection_logic: z.string().min(5, "Detection logic query or signature is required"),
  data_sources: z.array(z.string()).default([]),
  enabled: z.boolean().default(true),
});

export type DetectionRuleCreateInput = z.infer<typeof detectionRuleCreateSchema>;

export const detectionRuleTestSchema = z.object({
  rule_logic: z.string().optional(),
  sample_event_payload: z.record(z.any()),
});

export type DetectionRuleTestInput = z.infer<typeof detectionRuleTestSchema>;
