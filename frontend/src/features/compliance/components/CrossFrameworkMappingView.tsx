"use client";

import React from "react";
import { CrossFrameworkMappingItem } from "../types";
import { Layers, ShieldCheck } from "lucide-react";

interface CrossFrameworkMappingViewProps {
  mappings?: CrossFrameworkMappingItem[];
  isLoading?: boolean;
}

export function CrossFrameworkMappingView({ mappings = [], isLoading }: CrossFrameworkMappingViewProps) {
  if (isLoading) {
    return <div className="h-64 bg-slate-900/60 rounded-xl border border-slate-800 animate-pulse" />;
  }

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden backdrop-blur-md">
      <div className="p-4 border-b border-slate-800">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          Cross-Framework Common Control Mappings
        </h3>
        <p className="text-xs text-slate-400">
          Harmonized control mapping across ISO/IEC 27001, NIST CSF 2.0, SOC 2, and PCI DSS 4.0
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/40 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Common Security Control</th>
              <th className="py-3 px-4">ISO 27001:2022</th>
              <th className="py-3 px-4">NIST CSF 2.0</th>
              <th className="py-3 px-4">SOC 2 Type II</th>
              <th className="py-3 px-4">PCI DSS 4.0</th>
              <th className="py-3 px-4">Effectiveness</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {mappings.map((m, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-4 font-semibold text-white">{m.common_control_name}</td>
                <td className="py-3 px-4 font-mono font-bold text-emerald-400">{m.iso_27001_control}</td>
                <td className="py-3 px-4 font-mono text-cyan-400">{m.nist_csf_control}</td>
                <td className="py-3 px-4 font-mono text-indigo-400">{m.soc2_control}</td>
                <td className="py-3 px-4 font-mono text-amber-400">{m.pci_dss_control}</td>
                <td className="py-3 px-4">
                  <span className="font-bold text-emerald-400">{m.effectiveness_score}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
