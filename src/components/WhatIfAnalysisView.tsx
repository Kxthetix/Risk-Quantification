import React, { useState, useMemo } from 'react';
import {
  RawCandidateInvestment,
  EnrichedFinding,
  simulateWhatIfScenario,
  formatINR,
  getRiskTier
} from '../utils/riskUtils';
import {
  Play,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Sparkles,
  Tag
} from 'lucide-react';

interface WhatIfAnalysisViewProps {
  candidateInvestments: RawCandidateInvestment[];
  baselineRiskScore: number;
  baselineExposure: number;
  findings: EnrichedFinding[];
}

export default function WhatIfAnalysisView({
  candidateInvestments,
  baselineRiskScore,
  baselineExposure,
  findings
}: WhatIfAnalysisViewProps) {
  const [selectedControlId, setSelectedControlId] = useState<string>(
    candidateInvestments[0]?.control_id || ''
  );
  const [selectedBudgetTier, setSelectedBudgetTier] = useState<number>(
    candidateInvestments[0]?.cost_inr || 1500000
  );
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulatedTimestamp, setSimulatedTimestamp] = useState<number>(Date.now());

  const currentControl = useMemo(() => {
    return (
      candidateInvestments.find((c) => c.control_id === selectedControlId) ||
      candidateInvestments[0]
    );
  }, [candidateInvestments, selectedControlId]);

  const findingMap = useMemo(() => {
    const map = new Map<string, EnrichedFinding>();
    findings.forEach((f) => map.set(f.finding_id, f));
    return map;
  }, [findings]);

  // When changing control, auto-set budget tier to match standard cost
  const handleControlChange = (id: string) => {
    setSelectedControlId(id);
    const ctrl = candidateInvestments.find((c) => c.control_id === id);
    if (ctrl) {
      setSelectedBudgetTier(ctrl.cost_inr);
    }
  };

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setSimulatedTimestamp(Date.now());
    }, 450);
  };

  // Run simulation
  const simulation = useMemo(() => {
    if (!currentControl) {
      return {
        reductionPct: 0,
        newRiskScore: baselineRiskScore,
        newExposure: baselineExposure,
        deltaExposure: 0,
        rosi: 0,
        feasibility: 'Insufficient Budget' as const
      };
    }
    return simulateWhatIfScenario(
      currentControl,
      selectedBudgetTier,
      baselineRiskScore,
      baselineExposure
    );
  }, [currentControl, selectedBudgetTier, baselineRiskScore, baselineExposure, simulatedTimestamp]);

  const simTier = getRiskTier(simulation.newRiskScore);

  const budgetPresets = [
    { label: '50% Partial Funding', val: Math.round((currentControl?.cost_inr || 1000000) * 0.5) },
    { label: '100% Full Funding', val: currentControl?.cost_inr || 1000000 },
    { label: '150% Accelerated Rollout', val: Math.round((currentControl?.cost_inr || 1000000) * 1.5) }
  ];

  return (
    <div className="space-y-6">
      {/* Top Description Banner */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Interactive "What-If" Cyber Risk Simulator
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate the quantitative impact of standalone security investments before committing capital.
            </p>
          </div>
        </div>
      </div>

      {/* Simulator Workbench: Form + Realtime Outcome */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Form */}
        <div className="lg:col-span-5 rounded-xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <Play className="w-4 h-4 text-cyan-400" />
            1. Select Intervention &amp; Budget Tier
          </h3>

          {/* Control Picker */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Candidate Security Investment:
            </label>
            <select
              value={selectedControlId}
              onChange={(e) => handleControlChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition"
            >
              {candidateInvestments.map((ctrl) => (
                <option key={ctrl.control_id} value={ctrl.control_id} className="bg-slate-900 text-white">
                  {ctrl.control_name} (Cost: {formatINR(ctrl.cost_inr, true)})
                </option>
              ))}
            </select>
          </div>

          {/* Budget Tier Presets */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <label className="block text-xs font-semibold text-slate-300">
              Budget Tier Preset:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {budgetPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedBudgetTier(preset.val)}
                  className={`p-2.5 rounded-lg text-xs font-mono text-left flex items-center justify-between border transition ${
                    selectedBudgetTier === preset.val
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 font-bold'
                      : 'bg-slate-800/70 text-slate-400 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <span>{preset.label}</span>
                  <span className="font-bold">{formatINR(preset.val)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Budget Slider */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Funding Level:</span>
              <span className="font-mono text-cyan-300 font-bold">
                {formatINR(selectedBudgetTier)}
              </span>
            </div>
            <input
              type="range"
              min={200000}
              max={3500000}
              step={100000}
              value={selectedBudgetTier}
              onChange={(e) => setSelectedBudgetTier(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Run Simulation Button */}
          <div className="pt-2">
            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 hover:opacity-95 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSimulating ? 'Simulating Posture...' : 'Run Simulation'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Simulation Output */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                2. Simulated Institutional Posture
              </h3>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold border ${
                  simulation.feasibility === 'Fully Funded'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : simulation.feasibility === 'Partially Funded'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-red-500/20 text-red-300 border-red-500/40'
                }`}
              >
                {simulation.feasibility}
              </span>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Box 1: Risk Score Before vs After */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-xs text-slate-400 uppercase font-semibold">Campus Risk Score</span>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-400">Baseline:</div>
                    <div className="text-2xl font-extrabold text-red-400 font-mono">
                      {baselineRiskScore}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-500" />
                  <div>
                    <div className="text-[11px] text-slate-400">Simulated:</div>
                    <div className={`text-2xl font-extrabold font-mono ${simTier.color}`}>
                      {simulation.newRiskScore}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" /> -{simulation.reductionPct}% drop
                  </span>
                  <span className="text-slate-400">Target: &lt; 40</span>
                </div>
              </div>

              {/* Box 2: Financial Exposure Before vs After */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-xs text-slate-400 uppercase font-semibold">Financial Exposure (EAL)</span>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-400">Baseline:</div>
                    <div className="text-xl font-extrabold text-red-400 font-mono">
                      {formatINR(baselineExposure, true)}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-500" />
                  <div>
                    <div className="text-[11px] text-slate-400">Simulated:</div>
                    <div className="text-xl font-extrabold text-emerald-300 font-mono">
                      {formatINR(simulation.newExposure, true)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between text-xs">
                  <span className="text-emerald-300 font-bold">
                    Saves: {formatINR(simulation.deltaExposure, true)}
                  </span>
                  <span className="font-mono text-cyan-300">
                    ROSI: +{simulation.rosi}%
                  </span>
                </div>
              </div>
            </div>

            {/* Impact Narrative Breakdown */}
            <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Simulated Impact Synthesis:
              </div>
              <p className="text-slate-300 leading-relaxed">
                Allocating <strong className="text-cyan-300">{formatINR(selectedBudgetTier)}</strong> toward{' '}
                <strong className="text-white">{currentControl?.control_name}</strong> yields an estimated{' '}
                <strong className="text-emerald-400">{simulation.reductionPct}%</strong> targeted risk reduction, averting{' '}
                <strong className="text-emerald-300">{formatINR(simulation.deltaExposure)}</strong> in expected annual loss.
              </p>
            </div>

            {/* Target Findings Addressed */}
            {currentControl && currentControl.addresses_findings.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Findings Targeted Under This Simulation:
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentControl.addresses_findings.map((fId) => {
                    const f = findingMap.get(fId);
                    return (
                      <span
                        key={fId}
                        className="text-xs bg-slate-800 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-md flex items-center gap-1.5"
                      >
                        <Tag className="w-3 h-3 text-cyan-400" />
                        <span className="font-mono text-cyan-300">{f?.cve_id || fId}</span>
                        <span className="text-slate-400 truncate max-w-[150px]">({f?.asset.asset_name || 'Asset'})</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
