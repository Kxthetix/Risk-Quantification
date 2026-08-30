export const DETECTION_RULE_SOURCES = [
  { value: "SIEM", label: "SIEM Event Log Correlation" },
  { value: "EDR", label: "EDR Endpoint Behavioral Rule" },
  { value: "WAF", label: "WAF HTTP Inspection Rule" },
  { value: "NETWORK", label: "Network Flow / IDS Rule" },
  { value: "CLOUD", label: "Cloud Audit & IAM Telemetry" },
];

export const MITRE_TACTICS = [
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
];
