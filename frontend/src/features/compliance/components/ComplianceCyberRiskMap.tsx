"use client";

import React, { useState } from "react";
import { ComplianceCyberRiskMapResponse } from "../types";
import { formatCurrencyINR } from "@/lib/utils/formatters";
import { GitFork, ArrowRight, ShieldCheck, ShieldAlert, Bug, Server, Briefcase, Banknote } from "lucide-react";

interface ComplianceCyberRiskMapProps {
  data?: ComplianceCyberRiskMapResponse;
  isLoading?: boolean;
}

export function ComplianceCyberRiskMap({ data, isLoading }: ComplianceCyberRiskMapProps) {
  const [selectedChainIdx, setSelectedChainIdx] = useState<number>(0);

  if (isLoading || !data) {
    return <div className="h-96 bg-slate-900/60 rounded-xl border border-slate-800 animate-pulse" />;
  }

  const activeChain = data.chains[selectedChainIdx] || data.chains[0];

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 backdrop-blur-md space-y-6">
      <div>
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <GitFork className="w-5 h-5 text-indigo-400" />
          Multi-Tier Compliance-to-Cyber Risk Chain
        </h3>
        <p className="text-xs text-slate-400">
          Trace how compliance deficiencies propagate through technical vulnerabilities, attack paths, and critical business assets
        </p>
      </div>

      {/* Chain Selector */}
      <div className="flex flex-wrap gap-2">
        {data.chains.map((chain, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedChainIdx(idx)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              selectedChainIdx === idx
                ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20"
                : "bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white"
            }`}
          >
            Chain #{idx + 1}: {chain.control_code} ({chain.business_service})
          </button>
        ))}
      </div>

      {/* Visual Interactive Chain Workflow */}
      {activeChain && (
        <div className="p-6 bg-slate-950/80 rounded-xl border border-slate-800 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center text-xs">
            {/* Step 1: Compliance Requirement */}
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">1. Requirement</span>
              <div className="font-semibold text-white truncate">{activeChain.requirement}</div>
            </div>

            <div className="hidden md:flex justify-center text-slate-600">
              <ArrowRight className="w-4 h-4" />
            </div>

            {/* Step 2: Security Control */}
            <div className="p-3 bg-cyan-950/30 rounded-lg border border-cyan-500/30 text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">2. Control</span>
              <div className="font-mono font-bold text-cyan-300">{activeChain.control_code}</div>
              <div className="text-[11px] text-slate-400 truncate">{activeChain.control_name}</div>
            </div>

            <div className="hidden md:flex justify-center text-slate-600">
              <ArrowRight className="w-4 h-4" />
            </div>

            {/* Step 3: Vulnerability / Gap */}
            <div
              className={`p-3 rounded-lg border text-center space-y-1 ${
                activeChain.is_gap
                  ? "bg-rose-950/30 border-rose-500/30 text-rose-300"
                  : "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
              }`}
            >
              <span className="text-[10px] uppercase font-bold tracking-wider">3. Technical Flaw</span>
              <div className="font-semibold truncate">{activeChain.vulnerability_cve || activeChain.gap_title}</div>
            </div>

            <div className="hidden md:flex justify-center text-slate-600">
              <ArrowRight className="w-4 h-4" />
            </div>

            {/* Step 4: Attack Path & Financial Impact */}
            <div className="p-3 bg-purple-950/30 rounded-lg border border-purple-500/30 text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">4. Financial Exposure</span>
              <div className="font-mono font-bold text-rose-400 text-sm">
                {formatCurrencyINR(activeChain.financial_impact)}
              </div>
              <div className="text-[11px] text-slate-400 truncate">{activeChain.business_service}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">
            <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800">
              <span className="text-slate-400 font-medium">Exploited Attack Path:</span>
              <div className="font-semibold text-white mt-1">{activeChain.attack_path_name}</div>
            </div>
            <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800">
              <span className="text-slate-400 font-medium">Target Crown Jewel Asset:</span>
              <div className="font-semibold text-cyan-400 mt-1">{activeChain.affected_asset}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
