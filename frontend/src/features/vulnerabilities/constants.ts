import { VulnerabilitySeverity } from "@/types/vulnerability";

export const VULNERABILITY_SEVERITY_OPTIONS: {
  value: VulnerabilitySeverity;
  label: string;
  badgeClass: string;
}[] = [
  {
    value: "CRITICAL",
    label: "Critical (CVSS 9.0–10.0)",
    badgeClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
  },
  {
    value: "HIGH",
    label: "High (CVSS 7.0–8.9)",
    badgeClass: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
  },
  {
    value: "MEDIUM",
    label: "Medium (CVSS 4.0–6.9)",
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  {
    value: "LOW",
    label: "Low (CVSS 0.1–3.9)",
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  {
    value: "NONE",
    label: "None (0.0)",
    badgeClass: "bg-muted text-muted-foreground border-border",
  },
];

export const EXPLOIT_MATURITY_OPTIONS = [
  { value: "ACTIVE_EXPLOITATION", label: "Active Weaponization (In the Wild)", color: "text-rose-500" },
  { value: "FUNCTIONAL", label: "Functional Exploit Available", color: "text-orange-500" },
  { value: "POC", label: "Proof-of-Concept (PoC) Published", color: "text-amber-500" },
  { value: "NO_KNOWN_EXPLOIT", label: "No Public Exploit Known", color: "text-emerald-500" },
];

export const THREAT_ACTIVITY_TIERS = [
  { value: "WIDESPREAD", label: "Widespread Campaign Activity", badge: "bg-rose-500 text-white" },
  { value: "ACTIVE", label: "Active Targeted Exploitation", badge: "bg-orange-500/15 text-orange-500" },
  { value: "EMERGING", label: "Emerging Threat Activity", badge: "bg-amber-500/15 text-amber-500" },
  { value: "NONE", label: "No Observed Threat Activity", badge: "bg-muted text-muted-foreground" },
];

export const PRIORITY_TIERS = [
  {
    tier: "P1",
    label: "Immediate Remediation (SLA 24-48h)",
    color: "text-rose-500 bg-rose-500/10 border-rose-500/30",
  },
  {
    tier: "P2",
    label: "High Priority (SLA 7 Days)",
    color: "text-orange-500 bg-orange-500/10 border-orange-500/30",
  },
  {
    tier: "P3",
    label: "Standard Priority (SLA 30 Days)",
    color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
  },
  {
    tier: "P4",
    label: "Low Urgency / Routine Maintenance",
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
  },
];

export const REMEDIATION_TYPE_OPTIONS = [
  { value: "PATCH", label: "Vendor Security Patch" },
  { value: "UPGRADE", label: "Major Software Version Upgrade" },
  { value: "CONFIGURATION_CHANGE", label: "Hardening / Configuration Change" },
  { value: "WAF_RULE", label: "Web Application Firewall (WAF) Rule" },
  { value: "FIREWALL_RULE", label: "Network Firewall / ACL Rule" },
  { value: "NETWORK_SEGMENTATION", label: "Network Segmentation / Isolation" },
  { value: "ACCESS_CONTROL", label: "Restrict Identity / Access Permissions" },
  { value: "MFA", label: "Enforce Multi-Factor Authentication" },
  { value: "VIRTUAL_PATCH", label: "Virtual Patch (IPS / Agent)" },
  { value: "COMPENSATING_CONTROL", label: "Apply Compensating Defensive Control" },
  { value: "ASSET_RETIREMENT", label: "Decommission / Retire Asset" },
];
