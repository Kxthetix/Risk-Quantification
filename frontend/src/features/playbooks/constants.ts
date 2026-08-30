export const PLAYBOOK_CATEGORIES = [
  "Phishing Response",
  "Malware Response",
  "Credential Compromise",
  "Ransomware",
  "Suspicious Login",
  "Data Exfiltration",
  "Endpoint Compromise",
  "Cloud Account Compromise",
  "Network Attack",
  "Vulnerability Exploitation",
];

export const SOAR_ACTION_TYPES = [
  { value: "ISOLATE_ASSET", label: "Isolate Endpoint / Server Network Interface", highRisk: true },
  { value: "BLOCK_IP", label: "Block Ingress IP on Edge WAF / Firewall", highRisk: false },
  { value: "BLOCK_DOMAIN", label: "Block Malicious Domain in DNS Sinkhole", highRisk: false },
  { value: "DISABLE_ACCOUNT", label: "Disable Compromised User / IAM Account", highRisk: true },
  { value: "REVOKE_SESSION", label: "Revoke Active OAuth & SSO Tokens", highRisk: false },
  { value: "RESET_CREDENTIAL", label: "Force User Password & Credential Reset", highRisk: false },
  { value: "QUARANTINE_FILE", label: "Quarantine Malicious Executable in EDR", highRisk: false },
  { value: "CREATE_TICKET", label: "Create Jira / ServiceNow Incident Ticket", highRisk: false },
  { value: "SEND_NOTIFICATION", label: "Send Slack / PagerDuty Alert Notification", highRisk: false },
  { value: "COLLECT_EVIDENCE", label: "Capture Memory Forensics RAM Dump", highRisk: false },
  { value: "RUN_SCAN", label: "Trigger Vulnerability & Configuration Scan", highRisk: false },
  { value: "UPDATE_FIREWALL", label: "Deploy Custom Perimeter Firewall Rule", highRisk: true },
  { value: "RECALCULATE_RISK", label: "Recalculate Financial Risk Exposure", highRisk: false },
];
