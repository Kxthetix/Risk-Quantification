import { z } from "zod";

export const threatScenarioCreateSchema = z.object({
  name: z.string().min(3, "Scenario name must be at least 3 characters").max(255),
  description: z.string().optional(),
  attacker_profile: z.enum([
    "EXTERNAL_ATTACKER",
    "INSIDER_THREAT",
    "COMPROMISED_PARTNER",
    "RANSOMWARE_ACTOR",
    "NATION_STATE",
  ]),
  objective: z.string().max(255).optional(),
  entry_point: z.string().max(255).optional(),
  target_asset_id: z.string().uuid("Invalid target asset ID").optional().or(z.literal("")),
  target_asset_name: z.string().optional(),
  probability: z.number().min(0).max(1).default(0.5),
  confidence: z.number().min(0).max(1).default(0.8),
  risk_score: z.number().min(0).max(100).default(50),
});

export const attackPathAnalyzeSchema = z.object({
  target_asset_id: z.string().uuid("Invalid asset UUID").optional().or(z.literal("")),
  max_path_length: z.number().min(2).max(15).default(8),
  max_paths: z.number().min(1).max(500).default(100),
  synchronous: z.boolean().default(true),
});

export type ThreatScenarioCreateForm = z.infer<typeof threatScenarioCreateSchema>;
export type AttackPathAnalyzeForm = z.infer<typeof attackPathAnalyzeSchema>;
