export const ROOT_CAUSE_CATEGORIES = [
  "Configuration",
  "Vulnerability",
  "Credential",
  "Human Error",
  "Third Party",
  "Malware",
  "Policy",
  "Process",
  "Unknown",
];

export const NOTE_TYPES = [
  { value: "FINDING", label: "Forensic Finding", color: "text-red-400 bg-red-950/40 border-red-800" },
  { value: "HYPOTHESIS", label: "Threat Hypothesis", color: "text-amber-400 bg-amber-950/40 border-amber-800" },
  { value: "OBSERVATION", label: "Telemetry Observation", color: "text-indigo-400 bg-indigo-950/40 border-indigo-800" },
  { value: "RECOMMENDATION", label: "Remediation Recommendation", color: "text-emerald-400 bg-emerald-950/40 border-emerald-800" },
];

export const TASK_SLA_STATUSES = [
  { value: "ON_TRACK", label: "On Track", color: "text-emerald-400 bg-emerald-950/40 border-emerald-800" },
  { value: "AT_RISK", label: "At Risk", color: "text-amber-400 bg-amber-950/40 border-amber-800" },
  { value: "BREACHED", label: "SLA Breached", color: "text-red-400 bg-red-950/40 border-red-800" },
];
