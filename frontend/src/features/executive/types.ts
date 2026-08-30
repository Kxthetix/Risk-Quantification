// Executive feature – TypeScript types (Phase 11)

export type RiskLevel = "Critical" | "High" | "Medium" | "Low" | "Minimal";
export type TrendDirection = "up" | "down" | "stable";
export type RiskTreatment = "Accept" | "Mitigate" | "Transfer" | "Avoid";
export type ScenarioType =
  | "remediation"
  | "control"
  | "investment"
  | "asset_change"
  | "risk_treatment";
export type ReportStatus =
  | "Draft"
  | "Queued"
  | "Generating"
  | "Completed"
  | "Failed"
  | "Cancelled";
export type ReportFrequency = "daily" | "weekly" | "monthly" | "quarterly";
export type ControlStatus =
  | "Effective"
  | "Partially Effective"
  | "Ineffective"
  | "Unknown";

// ─── Data Freshness ──────────────────────────────────────────────────────────

export interface DataFreshness {
  last_updated?: string;
  calculation_time?: string;
  data_coverage_pct: number;
}

// ─── Risk Score ───────────────────────────────────────────────────────────────

export interface RiskScoreCard {
  current_score: number;
  previous_score?: number;
  change?: number;
  level: RiskLevel;
  last_updated?: string;
}

// ─── Risk Trend ───────────────────────────────────────────────────────────────

export interface RiskTrendPoint {
  timestamp: string;
  cyber_risk: number;
  financial_risk?: number;
  operational_risk?: number;
  compliance_risk?: number;
}

export interface RiskTrendResponse {
  period_days: number;
  points: RiskTrendPoint[];
  freshness?: DataFreshness;
}

// ─── Risk Drivers ─────────────────────────────────────────────────────────────

export interface RiskDriver {
  driver: string;
  contribution: number;
  delta?: number;
  description?: string;
}

export interface RiskDriverResponse {
  total_risk: number;
  drivers: RiskDriver[];
  period_days: number;
}

// ─── Financial Risk ───────────────────────────────────────────────────────────

export interface ExecutiveFinancialRisk {
  current_exposure: number;
  potential_loss: number;
  expected_annual_loss: number;
  annualized_risk: number;
  downtime_exposure: number;
  recovery_cost: number;
  response_cost: number;
  compliance_exposure: number;
  currency: string;
  freshness?: DataFreshness;
}

export interface FinancialTrendPoint {
  timestamp: string;
  potential_loss: number;
  expected_loss: number;
  actual_loss?: number;
  risk_reduction?: number;
}

export interface FinancialTrendResponse {
  period_days: number;
  points: FinancialTrendPoint[];
}

// ─── Loss Distribution ────────────────────────────────────────────────────────

export interface LossPercentile {
  percentile: string;
  value: number;
  probability: number;
}

export interface LossDistributionResponse {
  percentiles: LossPercentile[];
  mean: number;
  median: number;
  std_dev: number;
  histogram_buckets: Array<{ range_start: number; range_end: number; frequency: number }>;
}

// ─── Business Service Risk ───────────────────────────────────────────────────

export interface BusinessServiceRiskItem {
  service_id: string;
  name: string;
  criticality: string;
  risk_score: number;
  financial_exposure: number;
  incident_count: number;
  attack_path_count: number;
}

export interface BusinessServiceRiskResponse {
  items: BusinessServiceRiskItem[];
  total_exposure: number;
}

// ─── Asset Risk ───────────────────────────────────────────────────────────────

export interface AssetRiskItem {
  asset_id: string;
  name: string;
  asset_type: string;
  criticality: string;
  risk_score: number;
  financial_exposure: number;
  vulnerability_count: number;
  incident_count: number;
  attack_path_count: number;
}

export interface AssetRiskResponse {
  items: AssetRiskItem[];
  critical_assets: number;
  high_risk_critical_assets: number;
  assets_under_attack: number;
}

// ─── Business Unit Risk ───────────────────────────────────────────────────────

export interface BusinessUnitRiskItem {
  unit_id: string;
  name: string;
  asset_count: number;
  critical_asset_count: number;
  risk_score: number;
  financial_exposure: number;
  incident_count: number;
  compliance_risk: number;
}

export interface BusinessUnitRiskResponse {
  items: BusinessUnitRiskItem[];
}

// ─── Top Risks ────────────────────────────────────────────────────────────────

export interface ExecutiveTopRiskItem {
  risk_id: string;
  title: string;
  category: string;
  asset_name?: string;
  business_service?: string;
  likelihood: number;
  impact: number;
  financial_exposure: number;
  risk_score: number;
  status: string;
  level: RiskLevel;
}

export interface ExecutiveTopRisksResponse {
  items: ExecutiveTopRiskItem[];
  total_count: number;
}

// ─── Attack Path Risk ─────────────────────────────────────────────────────────

export interface AttackPathRiskResponse {
  critical_attack_paths: number;
  high_risk_attack_paths: number;
  assets_exposed: number;
  business_services_exposed: number;
  financial_exposure: number;
}

// ─── Recommendations ──────────────────────────────────────────────────────────

export interface RecommendationItem {
  id: string;
  title: string;
  reason: string;
  risk_impact: number;
  financial_impact: number;
  priority: RiskLevel;
  estimated_cost?: number;
  expected_risk_reduction: number;
  expected_financial_benefit?: number;
  owner?: string;
  affected_assets: string[];
  affected_services: string[];
}

export interface RecommendationsResponse {
  items: RecommendationItem[];
  total: number;
}

// ─── Executive KPI ────────────────────────────────────────────────────────────

export interface ExecutiveKPI {
  kpi_key: string;
  label: string;
  value: number | string;
  previous_value?: number | string;
  unit: string;
  change?: number;
  trend?: TrendDirection;
  drill_down_url?: string;
  level?: RiskLevel;
}

// ─── Executive Dashboard ──────────────────────────────────────────────────────

export interface ExecutiveDashboard {
  risk_score: RiskScoreCard;
  financial: ExecutiveFinancialRisk;
  critical_risks: number;
  critical_assets: number;
  open_incidents: number;
  risk_reduction_pct: number;
  compliance_risk: number;
  attack_paths: AttackPathRiskResponse;
  top_recommendations: RecommendationItem[];
  freshness: DataFreshness;
}

// ─── Executive Summary ────────────────────────────────────────────────────────

export interface ExecutiveSummary {
  period_start: string;
  period_end: string;
  current_risk: number;
  risk_change: number;
  risk_level: RiskLevel;
  financial_exposure: number;
  major_incidents: Array<Record<string, unknown>>;
  top_threats: string[];
  major_vulnerabilities: string[];
  risk_reduction: number;
  recommended_actions: string[];
  narrative?: string;
  generated_at: string;
}

// ─── Forecast ─────────────────────────────────────────────────────────────────

export interface ForecastPoint {
  timestamp: string;
  projected_risk: number;
  projected_financial_exposure: number;
  confidence_lower?: number;
  confidence_upper?: number;
  is_projection: boolean;
}

export interface ForecastScenario {
  label: string;
  projected_risk: number;
  projected_loss: number;
  investment: number;
  risk_reduction_pct: number;
}

export interface ForecastResponse {
  forecast_period_days: number;
  historical: ForecastPoint[];
  projected: ForecastPoint[];
  scenarios: ForecastScenario[];
  confidence_pct: number;
  freshness?: DataFreshness;
}

// ─── Control Effectiveness ────────────────────────────────────────────────────

export interface ControlEffectivenessItem {
  control_id: string;
  name: string;
  category: string;
  coverage_pct: number;
  effectiveness_pct: number;
  assets_protected: number;
  risks_reduced: number;
  failures: number;
  exceptions: number;
  status: ControlStatus;
}

export interface ControlEffectivenessResponse {
  items: ControlEffectivenessItem[];
  overall_effectiveness_pct: number;
  effective_count: number;
  partial_count: number;
  ineffective_count: number;
}

// ─── Compliance Risk ──────────────────────────────────────────────────────────

export interface ComplianceRiskFramework {
  framework_id: string;
  name: string;
  compliance_pct: number;
  open_gaps: number;
  critical_gaps: number;
  risk_score: number;
}

export interface ComplianceRiskResponse {
  overall_compliance_risk: number;
  critical_gaps: number;
  open_findings: number;
  high_risk_controls: number;
  compliance_exposure: number;
  frameworks: ComplianceRiskFramework[];
}

// ─── Domain-Specific Risk ─────────────────────────────────────────────────────

export interface VulnerabilityRiskResponse {
  critical_vulnerabilities: number;
  exploitable_vulnerabilities: number;
  internet_facing_vulnerabilities: number;
  unpatched_critical_assets: number;
  financial_exposure: number;
  trend_points: Array<Record<string, unknown>>;
}

export interface ThreatRiskResponse {
  critical_threats: number;
  active_threat_actors: number;
  active_campaigns: number;
  ioc_matches: number;
  threat_exposure: number;
  threat_driven_financial_risk: number;
}

export interface IncidentCostAnalysis {
  detection_cost: number;
  investigation_cost: number;
  response_cost: number;
  recovery_cost: number;
  downtime_cost: number;
  total_estimated_cost: number;
}

export interface IncidentRiskResponse {
  open_incidents: number;
  critical_incidents: number;
  incident_financial_exposure: number;
  avg_response_time_hours: number;
  risk_from_incidents: number;
  cost_analysis: IncidentCostAnalysis;
}

// ─── Security Investments ─────────────────────────────────────────────────────

export interface SecurityInvestmentItem {
  investment_id: string;
  name: string;
  cost: number;
  risk_before: number;
  risk_after: number;
  risk_reduction_pct: number;
  financial_exposure_before: number;
  financial_exposure_after: number;
  estimated_loss_avoided: number;
  roi_multiplier: number;
  payback_months?: number;
}

export interface SecurityInvestmentResponse {
  items: SecurityInvestmentItem[];
  total_investment: number;
  total_risk_reduction_pct: number;
  total_loss_avoided: number;
}

// ─── Scenarios ────────────────────────────────────────────────────────────────

export interface ScenarioCreate {
  name: string;
  description?: string;
  scenario_type: ScenarioType;
  parameters: Record<string, unknown>;
}

export interface ScenarioState {
  risk_score: number;
  financial_exposure: number;
  expected_loss: number;
  risk_reduction_pct: number;
  investment_cost?: number;
  roi?: number;
}

export interface ScenarioResult {
  id: string;
  name: string;
  status: "queued" | "running" | "completed" | "failed";
  current_state?: ScenarioState;
  projected_state?: ScenarioState;
  created_at: string;
  completed_at?: string;
}

// ─── Risk Acceptance ──────────────────────────────────────────────────────────

export interface RiskAcceptanceCreate {
  risk_id: string;
  reason: string;
  business_justification: string;
  acceptance_duration_days: number;
  approver_id: string;
  expiration_date?: string;
}

export interface RiskAcceptanceResponse {
  id: string;
  risk_id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  reason: string;
  business_justification: string;
  acceptance_duration_days: number;
  requested_by: string;
  approver_id: string;
  created_at: string;
  expires_at?: string;
  approved_at?: string;
}

// ─── Risk Register ────────────────────────────────────────────────────────────

export interface RiskRegisterItem {
  risk_id: string;
  risk_ref: string;
  title: string;
  category: string;
  owner?: string;
  business_owner?: string;
  likelihood: number;
  impact: number;
  risk_score: number;
  financial_impact: number;
  treatment: RiskTreatment;
  status: string;
  review_date?: string;
}

export interface RiskRegisterResponse {
  items: RiskRegisterItem[];
  total: number;
  page: number;
  page_size: number;
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export interface ReportScheduleCreate {
  report_name: string;
  report_type: string;
  frequency: ReportFrequency;
  recipients: string[];
  start_date?: string;
  end_date?: string;
  parameters?: Record<string, unknown>;
}

export interface ReportSchedule {
  id: string;
  report_name: string;
  report_type: string;
  frequency: ReportFrequency;
  recipients: string[];
  start_date?: string;
  end_date?: string;
  last_sent?: string;
  next_scheduled?: string;
  status: string;
  created_at: string;
}

export interface ReportHistoryItem {
  id: string;
  report_name: string;
  report_type: string;
  generated_by: string;
  period_start?: string;
  period_end?: string;
  status: string;
  format: string;
  created_at: string;
}

export interface ReportHistoryResponse {
  items: ReportHistoryItem[];
  total: number;
  page: number;
  page_size: number;
}

// ─── Dashboard Filters ────────────────────────────────────────────────────────

export interface ExecutiveFilters {
  date_from?: string;
  date_to?: string;
  business_unit?: string;
  department?: string;
  risk_level?: RiskLevel;
  period_days?: number;
}
