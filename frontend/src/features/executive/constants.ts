// Executive feature – constants (Phase 11)
import type { RiskLevel, ReportFrequency, ScenarioType } from "./types";

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  Critical: "#ef4444",
  High: "#f97316",
  Medium: "#eab308",
  Low: "#22c55e",
  Minimal: "#6b7280",
};

export const RISK_LEVEL_BG: Record<RiskLevel, string> = {
  Critical: "bg-red-500/10 text-red-400 border-red-500/30",
  High: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  Medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  Low: "bg-green-500/10 text-green-400 border-green-500/30",
  Minimal: "bg-gray-500/10 text-gray-400 border-gray-500/30",
};

export const RISK_TREND_COLORS = {
  cyber_risk: "#6366f1",
  financial_risk: "#f97316",
  operational_risk: "#22c55e",
  compliance_risk: "#a855f7",
};

export const FINANCIAL_RISK_COLORS = {
  potential_loss: "#ef4444",
  expected_loss: "#f97316",
  actual_loss: "#6b7280",
  risk_reduction: "#22c55e",
};

export const DRIVER_COLORS = [
  "#6366f1",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#a855f7",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

export const PERIOD_OPTIONS = [
  { label: "7 Days", value: 7 },
  { label: "30 Days", value: 30 },
  { label: "90 Days", value: 90 },
  { label: "6 Months", value: 180 },
  { label: "1 Year", value: 365 },
];

export const SCENARIO_TYPES: { label: string; value: ScenarioType }[] = [
  { label: "Remediation", value: "remediation" },
  { label: "Security Control", value: "control" },
  { label: "Investment", value: "investment" },
  { label: "Asset Change", value: "asset_change" },
  { label: "Risk Treatment", value: "risk_treatment" },
];

export const REPORT_FREQUENCIES: { label: string; value: ReportFrequency }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
];

export const REPORT_TYPES = [
  { label: "Executive Risk Report", value: "EXECUTIVE_RISK" },
  { label: "Cyber Risk Report", value: "CYBER_RISK" },
  { label: "Financial Risk Report", value: "FINANCIAL_RISK" },
  { label: "Incident Report", value: "INCIDENT" },
  { label: "Threat Intelligence Report", value: "THREAT_INTELLIGENCE" },
  { label: "Vulnerability Report", value: "VULNERABILITY" },
  { label: "Compliance Report", value: "COMPLIANCE" },
  { label: "Asset Risk Report", value: "ASSET_RISK" },
  { label: "Attack Path Report", value: "ATTACK_PATH" },
  { label: "Remediation Report", value: "REMEDIATION" },
  { label: "Audit Report", value: "AUDIT" },
];

export const CRITICALITY_COLORS: Record<string, string> = {
  Critical: "#ef4444",
  High: "#f97316",
  Medium: "#eab308",
  Low: "#22c55e",
};

export const RISK_TREATMENTS = [
  { label: "Mitigate", value: "Mitigate", color: "text-blue-400" },
  { label: "Accept", value: "Accept", color: "text-green-400" },
  { label: "Transfer", value: "Transfer", color: "text-yellow-400" },
  { label: "Avoid", value: "Avoid", color: "text-red-400" },
];

export const SORT_OPTIONS = [
  { label: "Highest Risk", value: "risk_score" },
  { label: "Highest Financial Exposure", value: "financial_exposure" },
  { label: "Highest Criticality", value: "criticality" },
];

export const KPI_DRILL_DOWN_MAP: Record<string, string> = {
  cyber_risk: "/executive",
  financial_exposure: "/financial-risk",
  expected_annual_loss: "/financial-risk",
  critical_assets: "/executive/assets",
  open_incidents: "/executive/incidents",
  risk_reduction: "/remediation/roi",
  compliance_risk: "/executive/compliance",
  critical_vulnerabilities: "/executive/vulnerabilities",
  mttr: "/soc/metrics",
};
