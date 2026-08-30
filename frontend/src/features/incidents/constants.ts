export const INCIDENT_STATUSES = [
  { value: "ALL", label: "All Statuses" },
  { value: "DETECTED", label: "Detected", color: "text-blue-400 bg-blue-950/40 border-blue-800" },
  { value: "TRIAGED", label: "Triaged", color: "text-amber-400 bg-amber-950/40 border-amber-800" },
  { value: "INVESTIGATING", label: "Investigating", color: "text-purple-400 bg-purple-950/40 border-purple-800" },
  { value: "CONTAINED", label: "Contained", color: "text-indigo-400 bg-indigo-950/40 border-indigo-800" },
  { value: "ERADICATED", label: "Eradicated", color: "text-teal-400 bg-teal-950/40 border-teal-800" },
  { value: "RECOVERED", label: "Recovered", color: "text-emerald-400 bg-emerald-950/40 border-emerald-800" },
  { value: "CLOSED", label: "Closed", color: "text-slate-400 bg-slate-900 border-slate-700" },
];

export const INCIDENT_ACTIONS = [
  { value: "BLOCK_IP", label: "Block Source IP on Perimeter WAF / Firewall" },
  { value: "ISOLATE_ASSET", label: "Isolate Endpoint / Server Network Interface" },
  { value: "REVOKE_SESSION", label: "Revoke Active User OAuth & SSO Tokens" },
  { value: "RESET_CREDENTIAL", label: "Force Immediate Credential & SSH Key Reset" },
  { value: "BLOCK_IOC", label: "Add Domain / Hash to Global EDR Blacklist" },
];
