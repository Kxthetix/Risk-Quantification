"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ComplianceGapItem } from "../types";
import { RiskBadge } from "@/components/ui/risk-badge";
import { AlertOctagon, Search, ArrowUpRight, ShieldAlert, GitFork, Bug } from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils/formatters";

interface ComplianceGapsTableProps {
  gaps?: ComplianceGapItem[];
  isLoading?: boolean;
}

export function ComplianceGapsTable({ gaps = [], isLoading }: ComplianceGapsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = gaps.filter(
    (g) =>
      g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.control_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.framework.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="h-64 bg-slate-900/60 rounded-xl border border-slate-800 animate-pulse" />;
  }

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden backdrop-blur-md">
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-400" />
            Compliance Gaps & Deficiencies
          </h3>
          <p className="text-xs text-slate-400">
            Unimplemented requirements directly enabling technical vulnerabilities and attack paths
          </p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search gaps..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/40 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Gap Title</th>
              <th className="py-3 px-4">Framework & Control</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Affected Service</th>
              <th className="py-3 px-4">Attack Paths</th>
              <th className="py-3 px-4">Financial Exposure</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filtered.map((g) => (
              <tr key={g.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-4 max-w-xs">
                  <div className="font-semibold text-white">{g.title}</div>
                  <div className="text-[11px] text-slate-400 truncate">{g.description}</div>
                </td>
                <td className="py-3 px-4">
                  <span className="font-mono font-bold text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                    {g.control_code}
                  </span>
                  <div className="text-[11px] text-slate-400 mt-1">{g.framework}</div>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      g.severity === "Critical"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {g.severity}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-300">{g.business_service || "Infrastructure"}</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1 font-semibold text-rose-400">
                    <GitFork className="w-3.5 h-3.5" />
                    {g.attack_paths_count} Paths
                  </span>
                </td>
                <td className="py-3 px-4 font-mono font-semibold text-rose-400">
                  {formatCurrencyINR(g.financial_exposure)}
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 font-medium">
                    {g.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <Link
                    href={`/compliance/gaps/${g.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors border border-rose-500/20"
                  >
                    Inspect
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
