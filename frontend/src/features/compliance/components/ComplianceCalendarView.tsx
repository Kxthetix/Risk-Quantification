"use client";

import React from "react";
import { Calendar, Clock, AlertTriangle, CheckCircle2, ShieldCheck, FileCheck } from "lucide-react";

export function ComplianceCalendarView() {
  const events = [
    { date: "Aug 31, 2026", title: "Quarterly ISO 27001 Access Control Review", type: "Assessment", status: "Upcoming", badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" },
    { date: "Sep 04, 2026", title: "CrowdStrike EDR Coverage Certificate Expiry", type: "Evidence Expiry", status: "Urgent", badge: "bg-rose-500/10 text-rose-400 border-rose-500/30" },
    { date: "Sep 12, 2026", title: "Payment DB Calico NetworkPolicy Deployment Due", type: "Remediation", status: "In Progress", badge: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
    { date: "Sep 20, 2026", title: "PCI DSS 4.0 RoC Onsite Auditor Visit", type: "External Audit", status: "Scheduled", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
    { date: "Oct 15, 2026", title: "SOC 2 Type II Gap Assessment Wrap-up", type: "Milestone", status: "Planned", badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" },
  ];

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 backdrop-blur-md space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            Compliance Deadlines & Audit Calendar
          </h3>
          <p className="text-xs text-slate-400">
            Upcoming audits, certification milestones, evidence renewals, and remediation due dates
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {events.map((ev, i) => (
          <div
            key={i}
            className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/50 flex items-center justify-between transition-all hover:bg-slate-800/60 text-xs"
          >
            <div className="flex items-center gap-3">
              <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-slate-300 font-bold">
                {ev.date}
              </div>
              <div>
                <div className="font-semibold text-white">{ev.title}</div>
                <div className="text-[11px] text-slate-400">{ev.type}</div>
              </div>
            </div>
            <span className={`px-2.5 py-0.5 rounded text-[11px] font-semibold border ${ev.badge}`}>
              {ev.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
