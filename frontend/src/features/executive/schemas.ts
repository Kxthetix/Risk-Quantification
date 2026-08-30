// Executive feature – Zod schemas (Phase 11)
import { z } from "zod";

export const RiskLevelSchema = z.enum(["Critical", "High", "Medium", "Low", "Minimal"]);
export const TrendDirectionSchema = z.enum(["up", "down", "stable"]);

export const DataFreshnessSchema = z.object({
  last_updated: z.string().optional(),
  calculation_time: z.string().optional(),
  data_coverage_pct: z.number(),
});

export const RiskScoreCardSchema = z.object({
  current_score: z.number(),
  previous_score: z.number().optional(),
  change: z.number().optional(),
  level: RiskLevelSchema,
  last_updated: z.string().optional(),
});

export const RiskTrendPointSchema = z.object({
  timestamp: z.string(),
  cyber_risk: z.number(),
  financial_risk: z.number().optional(),
  operational_risk: z.number().optional(),
  compliance_risk: z.number().optional(),
});

export const RiskTrendResponseSchema = z.object({
  period_days: z.number(),
  points: z.array(RiskTrendPointSchema),
  freshness: DataFreshnessSchema.optional(),
});

export const RiskDriverSchema = z.object({
  driver: z.string(),
  contribution: z.number(),
  delta: z.number().optional(),
  description: z.string().optional(),
});

export const RiskDriverResponseSchema = z.object({
  total_risk: z.number(),
  drivers: z.array(RiskDriverSchema),
  period_days: z.number(),
});

export const ExecutiveFinancialRiskSchema = z.object({
  current_exposure: z.number(),
  potential_loss: z.number(),
  expected_annual_loss: z.number(),
  annualized_risk: z.number(),
  downtime_exposure: z.number(),
  recovery_cost: z.number(),
  response_cost: z.number(),
  compliance_exposure: z.number(),
  currency: z.string(),
  freshness: DataFreshnessSchema.optional(),
});

export const LossPercentileSchema = z.object({
  percentile: z.string(),
  value: z.number(),
  probability: z.number(),
});

export const LossDistributionResponseSchema = z.object({
  percentiles: z.array(LossPercentileSchema),
  mean: z.number(),
  median: z.number(),
  std_dev: z.number(),
  histogram_buckets: z.array(z.record(z.unknown())),
});

export const AttackPathRiskSchema = z.object({
  critical_attack_paths: z.number(),
  high_risk_attack_paths: z.number(),
  assets_exposed: z.number(),
  business_services_exposed: z.number(),
  financial_exposure: z.number(),
});

export const RecommendationItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  reason: z.string(),
  risk_impact: z.number(),
  financial_impact: z.number(),
  priority: RiskLevelSchema,
  estimated_cost: z.number().optional(),
  expected_risk_reduction: z.number(),
  expected_financial_benefit: z.number().optional(),
  owner: z.string().optional(),
  affected_assets: z.array(z.string()),
  affected_services: z.array(z.string()),
});

export const ExecutiveDashboardSchema = z.object({
  risk_score: RiskScoreCardSchema,
  financial: ExecutiveFinancialRiskSchema,
  critical_risks: z.number(),
  critical_assets: z.number(),
  open_incidents: z.number(),
  risk_reduction_pct: z.number(),
  compliance_risk: z.number(),
  attack_paths: AttackPathRiskSchema,
  top_recommendations: z.array(RecommendationItemSchema),
  freshness: DataFreshnessSchema,
});

export const ScenarioCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  scenario_type: z.enum(["remediation", "control", "investment", "asset_change", "risk_treatment"]),
  parameters: z.record(z.unknown()),
});

export const RiskAcceptanceCreateSchema = z.object({
  risk_id: z.string().uuid(),
  reason: z.string().min(10, "Provide a detailed reason"),
  business_justification: z.string().min(10, "Provide a business justification"),
  acceptance_duration_days: z.number().int().min(1).max(730),
  approver_id: z.string().uuid(),
  expiration_date: z.string().optional(),
});

export const ReportScheduleCreateSchema = z.object({
  report_name: z.string().min(1, "Report name is required"),
  report_type: z.string().min(1),
  frequency: z.enum(["daily", "weekly", "monthly", "quarterly"]),
  recipients: z.array(z.string().email()).min(1, "At least one recipient required"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export type RiskAcceptanceCreateFormData = z.infer<typeof RiskAcceptanceCreateSchema>;
export type ScenarioCreateFormData = z.infer<typeof ScenarioCreateSchema>;
export type ReportScheduleCreateFormData = z.infer<typeof ReportScheduleCreateSchema>;
