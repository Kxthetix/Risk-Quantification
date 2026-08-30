"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FrameworkItem } from "../types";
import { RiskBadge } from "@/components/ui/risk-badge";
import { ArrowUpRight, Search, ShieldCheck, AlertTriangle } from "lucide-react";

interface FrameworksTableProps {
  frameworks?: FrameworkItem[];
  isLoading?: boolean;
}

export function FrameworksTable({ frameworks = [], isLoading }: FrameworksTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = frameworks.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-800 animate-pulse space-y-4">
        <div className="h-6 w-48 bg-slate-800 rounded" />
        <div className="h-40 bg-slate-800/40 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden backdrop-blur-md">
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Compliance Frameworks
          </h3>
          <p className="text-xs text-slate-400">
            Authoritative compliance tracking across global standards & regulatory bodies
          </p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search framework..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/40 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Framework</th>
              <th className="py-3 px-4">Version</th>
              <th className="py-3 px-4">Controls</th>
              <th className="py-3 px-4">Implemented</th>
              <th className="py-3 px-4">Gaps</th>
              <th className="py-3 px-4">Compliance %</th>
              <th className="py-3 px-4">Risk Level</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filtered.map((f) => {
              const pct = f.compliance_pct;
              const isHighCompliance = pct >= 80;
              return (
                <tr key={f.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{f.name}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-xs">{f.description}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">{f.version}</td>
                  <td className="py-3 px-4 font-semibold text-slate-200">{f.total_controls}</td>
                  <td className="py-3 px-4 text-emerald-400 font-semibold">{f.implemented_controls}</td>
                  <td className="py-3 px-4">
                    {f.gaps_count > 0 ? (
                      <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {f.gaps_count}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isHighCompliance ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <span className={`font-semibold ${isHighCompliance ? "text-emerald-400" : "text-amber-400"}`}>
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <RiskBadge level={f.risk_level} />
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <Link
                      href={`/compliance/frameworks/${f.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
                    >
                      View
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
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
