export const EXECUTION_STATUSES = [
  { value: "ALL", label: "All Statuses" },
  { value: "RUNNING", label: "Executing", color: "text-blue-400 bg-blue-950/40 border-blue-800" },
  { value: "WAITING_FOR_APPROVAL", label: "Waiting Approval", color: "text-amber-400 bg-amber-950/40 border-amber-800" },
  { value: "SUCCEEDED", label: "Succeeded", color: "text-emerald-400 bg-emerald-950/40 border-emerald-800" },
  { value: "FAILED", label: "Failed", color: "text-red-400 bg-red-950/40 border-red-800" },
  { value: "CANCELLED", label: "Cancelled / Rolled Back", color: "text-slate-400 bg-slate-900 border-slate-700" },
];
