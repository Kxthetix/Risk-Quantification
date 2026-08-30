export const ALERT_STATUSES = [
  { value: "ALL", label: "All Statuses" },
  { value: "NEW", label: "New", color: "text-blue-400 bg-blue-950/40 border-blue-800" },
  { value: "ACKNOWLEDGED", label: "Acknowledged", color: "text-amber-400 bg-amber-950/40 border-amber-800" },
  { value: "INVESTIGATING", label: "Investigating", color: "text-purple-400 bg-purple-950/40 border-purple-800" },
  { value: "CONTAINED", label: "Contained", color: "text-indigo-400 bg-indigo-950/40 border-indigo-800" },
  { value: "RESOLVED", label: "Resolved", color: "text-emerald-400 bg-emerald-950/40 border-emerald-800" },
  { value: "FALSE_POSITIVE", label: "False Positive", color: "text-slate-400 bg-slate-900 border-slate-700" },
];

export const ALERT_SEVERITIES = [
  { value: "ALL", label: "All Severities" },
  { value: "CRITICAL", label: "Critical", color: "text-red-400 bg-red-950/40 border-red-800" },
  { value: "HIGH", label: "High", color: "text-amber-400 bg-amber-950/40 border-amber-800" },
  { value: "MEDIUM", label: "Medium", color: "text-yellow-400 bg-yellow-950/40 border-yellow-800" },
  { value: "LOW", label: "Low", color: "text-blue-400 bg-blue-950/40 border-blue-800" },
];
