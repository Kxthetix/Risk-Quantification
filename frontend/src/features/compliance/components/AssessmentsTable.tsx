"use client";

import React from "react";
import { AssessmentItem } from "../types";
import { ClipboardCheck, ArrowUpRight, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface AssessmentsTableProps {
  assessments?: AssessmentItem[];
  isLoading?: boolean;
  onOpenNew?: () => void;
}

export function AssessmentsTable({ assessments = [], isLoading, onOpenNew }: AssessmentsTableProps) {
  if (isLoading) {
    return <div className="h-64 bg-slate-900/60 rounded-xl border border-slate-800 animate-pulse" />;
  }

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden backdrop-blur-md">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-indigo-400" />
            Control Effectiveness Assessments
          </h3>
          <p className="text-xs text-slate-400">
            Internal and independent assessments of defensive security control execution
          </p>
        </div>
        {onOpenNew && (
          <button
            onClick={onOpenNew}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
          >
            + New Assessment
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/40 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Control</th>
              <th className="py-3 px-4">Framework</th>
              <th className="py-3 px-4">Assessor</th>
              <th className="py-3 px-4">Effectiveness</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Finding Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {assessments.map((ass) => {
              const isApproved = ass.status === "Approved";
              return (
                <tr key={ass.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-cyan-400">{ass.control_code}</span>
                    <div className="font-semibold text-white mt-0.5">{ass.control_name}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{ass.framework_name}</td>
                  <td className="py-3 px-4 text-slate-300 font-medium">{ass.assessor_name}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-emerald-400">{ass.effectiveness_score}%</span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                        isApproved
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"
                      }`}
                    >
                      {isApproved ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {ass.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-xs text-slate-400 truncate">
                    {ass.finding || "No deficiencies detected"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
