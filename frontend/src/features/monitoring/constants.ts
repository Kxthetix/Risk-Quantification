export const EVENT_SEVERITIES = [
  { value: "ALL", label: "All Severities" },
  { value: "CRITICAL", label: "Critical", color: "text-red-400 bg-red-950/40 border-red-800" },
  { value: "HIGH", label: "High", color: "text-amber-400 bg-amber-950/40 border-amber-800" },
  { value: "MEDIUM", label: "Medium", color: "text-yellow-400 bg-yellow-950/40 border-yellow-800" },
  { value: "LOW", label: "Low", color: "text-blue-400 bg-blue-950/40 border-blue-800" },
];

export const EVENT_TYPES = [
  { value: "ALL", label: "All Event Types" },
  { value: "RCE_ATTEMPT", label: "RCE Attempt" },
  { value: "SUSPICIOUS_EXEC", label: "Suspicious Execution" },
  { value: "LATERAL_TRAVERSAL", label: "Lateral Movement" },
  { value: "PORT_SCAN", label: "Port Scan" },
  { value: "AUTH_FAILED", label: "Auth Failure / Brute Force" },
  { value: "DATA_EXFIL", label: "Data Exfiltration" },
];

export const DATA_SOURCE_TYPES = [
  { value: "SIEM", label: "SIEM (Splunk, Elastic)" },
  { value: "EDR", label: "EDR (CrowdStrike, SentinelOne)" },
  { value: "WAF", label: "WAF (Cloudflare, AWS WAF)" },
  { value: "FIREWALL", label: "Next-Gen Firewall (Palo Alto)" },
  { value: "CLOUD_LOGS", label: "Cloud Logs (CloudTrail, GCP Audit)" },
];
