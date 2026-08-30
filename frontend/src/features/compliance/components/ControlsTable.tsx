"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FrameworkControlItem } from "../types";
import { RiskBadge } from "@/components/ui/risk-badge";
import { Search, ShieldAlert, ArrowUpRight, CheckCircle2, AlertOctagon, FileCheck, Layers } from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils/formatters";

interface ControlsTableProps {
  controls?: FrameworkControlItem[];
  isLoading?: boolean;
}

export function ControlsTable({ controls = [], isLoading }: ControlsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [gapOnly, setGapOnly] = useState(false);

  const categories = ["ALL", ...Array.from(new Set(controls.map((c) => c.category)))];

  const filtered = controls.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.requirement.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || c.category === categoryFilter;
    const matchesGap = !gapOnly || c.is_gap;
    return matchesSearch && matchesCategory && matchesGap;
  });

  if (isLoading) {
    return (
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 animate-pulse space-y-4">
        <div className="h-6 w-48 bg-slate-800 rounded" />
        <div className="h-48 bg-slate-800/40 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden backdrop-blur-md">
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Security Controls Library
          </h3>
          <p className="text-xs text-slate-400">
            Enterprise defensive controls mapped to assets, attack paths, and financial exposure
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search controls..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            onClick={() => setGapOnly(!gapOnly)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              gapOnly
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                : "bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Gaps Only
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/40 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Control Name & Requirement</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Effectiveness</th>
              <th className="py-3 px-4">Evidence</th>
              <th className="py-3 px-4">Financial Exposure</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filtered.map((c) => {
              const isEffective = c.effectiveness_score >= 80;
              return (
                <tr key={c.control_id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                      {c.code}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-sm">
                    <div className="font-semibold text-white">{c.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{c.requirement}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{c.category}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                        c.implementation_status === "Implemented" || c.implementation_status === "Effective"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : c.implementation_status === "Partially Implemented"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {c.implementation_status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isEffective ? "bg-emerald-500" : c.effectiveness_score >= 50 ? "bg-amber-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${c.effectiveness_score}%` }}
                        />
                      </div>
                      <span className={`font-semibold ${isEffective ? "text-emerald-400" : "text-amber-400"}`}>
                        {c.effectiveness_score.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {c.has_evidence ? (
                      <span className="inline-flex items-center gap-1 text-indigo-400 font-semibold">
                        <FileCheck className="w-3.5 h-3.5" />
                        {c.evidence_count}
                      </span>
                    ) : (
                      <span className="text-slate-500">None</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-rose-400">
                    {formatCurrencyINR(c.financial_exposure)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/compliance/controls/${c.control_id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors border border-cyan-500/20"
                    >
                      Inspect
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
