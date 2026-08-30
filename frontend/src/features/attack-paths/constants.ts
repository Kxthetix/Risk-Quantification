import { NodeKind, EdgeKind } from "./types";

export const MITRE_TACTICS_ORDER = [
  "Reconnaissance",
  "Resource Development",
  "Initial Access",
  "Execution",
  "Persistence",
  "Privilege Escalation",
  "Defense Evasion",
  "Credential Access",
  "Discovery",
  "Lateral Movement",
  "Collection",
  "Command and Control",
  "Exfiltration",
  "Impact",
] as const;

export const NODE_TYPE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  INTERNET: {
    label: "Internet / External",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: "Globe",
  },
  ENTRY_POINT: {
    label: "Exposed Entry Point",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: "ShieldAlert",
  },
  ASSET: {
    label: "Asset / Server",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    icon: "Server",
  },
  APPLICATION: {
    label: "Application / Service",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/30",
    icon: "Layers",
  },
  DATABASE: {
    label: "Crown Jewel Database",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    icon: "Database",
  },
  IDENTITY: {
    label: "Identity / Privilege",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    icon: "Key",
  },
  USER: {
    label: "User Account",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    icon: "User",
  },
  BUSINESS_SERVICE: {
    label: "Business Service",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    icon: "Briefcase",
  },
  VULNERABILITY: {
    label: "Exploitable Vulnerability",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    icon: "Bug",
  },
  CREDENTIAL: {
    label: "Exposed Credential",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    icon: "Lock",
  },
  CLOUD_RESOURCE: {
    label: "Cloud Resource",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    icon: "Cloud",
  },
  SECURITY_CONTROL: {
    label: "Defensive Control",
    color: "text-teal-400",
    bg: "bg-teal-500/10",
    border: "border-teal-500/30",
    icon: "ShieldCheck",
  },
};

export const EDGE_TYPE_CONFIG: Record<
  string,
  { label: string; stroke: string; style: string }
> = {
  NETWORK_REACHABILITY: { label: "Connects To", stroke: "#3b82f6", style: "solid" },
  EXPLOITATION: { label: "Exploits (CVE)", stroke: "#ef4444", style: "dashed" },
  CREDENTIAL_ABUSE: { label: "Authenticates To", stroke: "#a855f7", style: "dashed" },
  LATERAL_MOVEMENT: { label: "Lateral Movement", stroke: "#f97316", style: "solid" },
  PRIVILEGE_ESCALATION: { label: "Privilege Escalation", stroke: "#ec4899", style: "solid" },
  DATA_ACCESS: { label: "Has Access To", stroke: "#10b981", style: "solid" },
  AUTHENTICATES_TO: { label: "Authenticates To", stroke: "#8b5cf6", style: "dashed" },
  DEPENDS_ON: { label: "Depends On", stroke: "#64748b", style: "dotted" },
  CONTAINS: { label: "Contains", stroke: "#475569", style: "solid" },
  EXPOSES: { label: "Exposes", stroke: "#f59e0b", style: "solid" },
};

export const DEFAULT_ATTACKER_PROFILES = [
  { value: "EXTERNAL_ATTACKER", label: "External Cybercriminal", description: "Remote opportunistic or targeted adversary exploiting edge perimeters." },
  { value: "INSIDER_THREAT", label: "Malicious Insider", description: "Authorized employee or contractor abusing existing credentialed access." },
  { value: "COMPROMISED_PARTNER", label: "Compromised Supply Chain Partner", description: "Third-party vendor with trusted network bridge or API tokens." },
  { value: "RANSOMWARE_ACTOR", label: "Ransomware Operator", description: "Financially motivated group seeking rapid lateral traversal and data encryption." },
  { value: "NATION_STATE", label: "Advanced Persistent Threat (APT)", description: "Well-funded state actor utilizing stealth lateral movement and zero-days." },
];
