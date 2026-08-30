import { ThreatScenarioCategory } from "./types";

export const SCENARIO_CATEGORY_OPTIONS: {
  value: ThreatScenarioCategory;
  label: string;
  badgeClass: string;
}[] = [
  {
    value: "RANSOMWARE",
    label: "Ransomware & Double Extortion",
    badgeClass: "bg-rose-500/15 text-rose-500 border-rose-500/30",
  },
  {
    value: "BUSINESS_INTERRUPTION",
    label: "Business Outage & Operational Interruption",
    badgeClass: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  },
  {
    value: "DATA_BREACH",
    label: "Customer Data Breach & Exfiltration",
    badgeClass: "bg-purple-500/15 text-purple-500 border-purple-500/30",
  },
  {
    value: "CLOUD_OUTAGE",
    label: "Cloud Account & Control Plane Compromise",
    badgeClass: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  },
  {
    value: "SUPPLY_CHAIN",
    label: "Supply Chain & Third-Party Dependency Breach",
    badgeClass: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  },
  {
    value: "CREDENTIAL_THEFT",
    label: "Identity & Credential Stuffing / Access Hijacking",
    badgeClass: "bg-indigo-500/15 text-indigo-500 border-indigo-500/30",
  },
  {
    value: "INSIDER_THREAT",
    label: "Malicious / Negligent Insider Threat",
    badgeClass: "bg-red-500/15 text-red-500 border-red-500/30",
  },
  {
    value: "DDOS",
    label: "Distributed Denial of Service (DDoS)",
    badgeClass: "bg-cyan-500/15 text-cyan-500 border-cyan-500/30",
  },
  {
    value: "FRAUD",
    label: "Financial Wire Fraud & BEC",
    badgeClass: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  },
  {
    value: "THIRD_PARTY",
    label: "Vendor Risk & External SaaS Outage",
    badgeClass: "bg-muted text-muted-foreground border-border",
  },
];

export const SIMULATION_ITERATION_OPTIONS = [
  { value: 10000, label: "10,000 Iterations (Fast Preview)" },
  { value: 50000, label: "50,000 Iterations (Recommended Standard)" },
  { value: 100000, label: "100,000 Iterations (High Precision)" },
  { value: 500000, label: "500,000 Iterations (Regulatory Audit Grade)" },
];

export const CONFIDENCE_LEVEL_OPTIONS = [
  { value: "HIGH", label: "High Confidence (Historical Internal Data)", color: "text-emerald-500" },
  { value: "MEDIUM", label: "Medium Confidence (Industry Benchmark)", color: "text-amber-500" },
  { value: "LOW", label: "Low Confidence (Subject Matter Expert Estimate)", color: "text-orange-500" },
];

export const ASSUMPTION_SOURCE_OPTIONS = [
  { value: "INTERNAL_DATA", label: "Internal Finance & Telemetry" },
  { value: "HISTORICAL_INCIDENT", label: "Historical Incident Forensics" },
  { value: "INDUSTRY_BENCHMARK", label: "Industry Benchmark (FAIR / Ponemon)" },
  { value: "EXPERT_ESTIMATE", label: "Expert Consensus Estimation" },
];
