export const INTEGRATION_CATEGORIES = [
  "ALL",
  "SIEM",
  "EDR",
  "VULNERABILITY_SCANNER",
  "IAM",
  "CLOUD",
  "NETWORK_SECURITY",
  "THREAT_INTELLIGENCE",
  "TICKETING",
  "WEBHOOK",
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  ALL: "All Categories",
  SIEM: "SIEM & Log Aggregation",
  EDR: "EDR / XDR Endpoints",
  VULNERABILITY_SCANNER: "Vulnerability Management",
  IAM: "Identity & Access (IAM)",
  CLOUD: "Cloud Security Posture",
  NETWORK_SECURITY: "Firewalls & Network",
  THREAT_INTELLIGENCE: "Threat Intelligence Feeds",
  TICKETING: "ITSM & Remediation Ticketing",
  WEBHOOK: "Inbound Webhooks",
};
