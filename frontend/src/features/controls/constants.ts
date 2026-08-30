import { ControlType } from "./types";

export const CONTROL_TYPES: { label: string; value: ControlType; description: string }[] = [
  {
    label: "Web Application Firewall (WAF)",
    value: "WAF",
    description: "Layer 7 inspection, SQLi, XSS, and automated virtual patching filter",
  },
  {
    label: "Endpoint Detection & Response (EDR)",
    value: "EDR",
    description: "Host-level behavioral anomaly telemetry and process containment",
  },
  {
    label: "Multi-Factor Authentication (MFA)",
    value: "MFA",
    description: "FIDO2 / WebAuthn phishing-resistant identity authentication",
  },
  {
    label: "Network Micro-Segmentation",
    value: "NETWORK_SEGMENTATION",
    description: "East-west traffic blast radius containment and eBPF network policies",
  },
  {
    label: "Privileged Access Management (PAM)",
    value: "PAM",
    description: "Just-in-time credential brokering, vaulting, and session recording",
  },
  {
    label: "Intrusion Detection/Prevention (IDS/IPS)",
    value: "IDS_IPS",
    description: "Network signature inspection and protocol anomaly blocking",
  },
  {
    label: "Immutable Backups & DR",
    value: "BACKUP",
    description: "WORM object storage, air-gapped snapshots, and recovery testing",
  },
  {
    label: "Zero Trust Network Access (ZTNA)",
    value: "ZERO_TRUST_ACCESS",
    description: "Contextual device identity, posture validation, and reverse proxying",
  },
  {
    label: "Security Information & Event Mgmt (SIEM)",
    value: "SIEM",
    description: "Centralized log correlation, threat analytics, and automated alerting",
  },
];

export const CONTROL_TYPE_BADGE_COLORS: Record<ControlType, string> = {
  WAF: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  EDR: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  MFA: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  NETWORK_SEGMENTATION: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  PAM: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  IDS_IPS: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  BACKUP: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  ZERO_TRUST_ACCESS: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  SIEM: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};
