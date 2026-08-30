import { RemediationPriorityLevel, RemediationStatus, RemediationType } from "./types";

export const REMEDIATION_TYPES: { label: string; value: RemediationType; description: string }[] = [
  { label: "Software Patch", value: "PATCH", description: "Vendor security update / package upgrade" },
  { label: "Major Version Upgrade", value: "UPGRADE", description: "Framework or OS migration" },
  { label: "Configuration Change", value: "CONFIGURATION_CHANGE", description: "Hardening flags, cipher suites, or ACLs" },
  { label: "Network Microsegmentation", value: "NETWORK_SEGMENTATION", description: "Isolate subnet & enforce zero-trust perimeter" },
  { label: "Access Control & IAM", value: "ACCESS_CONTROL", description: "Revoke over-permissive privileges & enforce least privilege" },
  { label: "Enforce MFA", value: "MFA", description: "Mandate WebAuthn/FIDO2 hardware tokens" },
  { label: "WAF Custom Rule", value: "WAF_RULE", description: "Virtual patch blocking malicious request payload" },
  { label: "Firewall Rule", value: "FIREWALL_RULE", description: "Drop unauthorized ports and protocols" },
  { label: "Virtual Patching", value: "VIRTUAL_PATCH", description: "Inline threat mitigation without binary modification" },
  { label: "Compensating Control", value: "COMPENSATING_CONTROL", description: "Alternative defense mitigating exposure" },
  { label: "Asset Decommissioning", value: "ASSET_RETIREMENT", description: "Retire and purge legacy vulnerable server" },
];

export const PRIORITY_BADGE_COLORS: Record<RemediationPriorityLevel, string> = {
  CRITICAL: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  HIGH: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  LOW: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export const STATUS_BADGE_COLORS: Record<RemediationStatus, string> = {
  OPEN: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PLANNED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  IN_PROGRESS: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  COMPLETED: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  VERIFIED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  ACCEPTED_RISK: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  REJECTED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};
