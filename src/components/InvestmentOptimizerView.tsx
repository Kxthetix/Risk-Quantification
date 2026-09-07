import React, { useState, useMemo } from 'react';
import {
  RawCandidateInvestment,
  EnrichedFinding,
  runKnapsackOptimization,
  formatINR,
  OptimizationResult
} from '../utils/riskUtils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  Sparkles,
  CheckCircle,
  TrendingDown,
  Layers,
  Sliders,
  ShieldCheck,
  Tag
} from 'lucide-react';

interface InvestmentOptimizerViewProps {
  candidateInvestments: RawCandidateInvestment[];
  initialBudget: number;
  currentOrgRiskScore: number;
  totalFinancialExposure: number;
  findings: EnrichedFinding[];
}

export default function InvestmentOptimizerView({
  candidateInvestments,
  initialBudget,
  currentOrgRiskScore,
  totalFinancialExposure,
  findings
}: InvestmentOptimizerViewProps) {
  // Budget initialized from scan_metadata, adjustable via slider
  const [budget, setBudget] = useState<number>(initialBudget || 5000000);

  // Map finding_id to finding details for quick lookup
  const findingMap = useMemo(() => {
    const map = new Map<string, EnrichedFinding>();
    findings.forEach((f) => map.set(f.finding_id, f));
    return map;
  }, [findings]);

  // Run Knapsack Optimization whenever budget changes
  const optimization: OptimizationResult = useMemo(() => {
    return runKnapsackOptimization(
      budget,
      candidateInvestments,
      currentOrgRiskScore,
      totalFinancialExposure
    );
  }, [budget, candidateInvestments, currentOrgRiskScore, totalFinancialExposure]);

  const selectedIds = useMemo(() => {
    return new Set(optimization.selectedControls.map((c) => c.control_id));
  }, [optimization]);

  // Data for Recharts comparative bar charts
  const comparisonData = [
    {
      metric: 'Risk Score (0-100)',
      Current: optimization.currentRiskScore,
      Optimized: optimization.projectedRiskScore
    },
    {
      metric: 'Financial Loss (₹ L)',
      Current: Math.round(optimization.currentExposure / 100000),
      Optimized: Math.round(optimization.projectedExposure / 100000)
    }
  ];

  const presets = [
    { label: '₹15 L', val: 1500000 },
    { label: '₹35 L', val: 3500000 },
    { label: '₹50 L (Scan Default)', val: initialBudget || 5000000 },
    { label: '₹75 L', val: 7500000 },
    { label: '₹1.0 Cr', val: 10000000 }
  ];

  return (
    <div className="space-y-6">
      {/* Header & Budget Configuration Box */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl backdrop-blur">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                AI Cyber Security Investment Optimizer
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Algorithmic 0-1 Knapsack selection over candidate controls to maximize risk reduction and financial loss prevented within your approved budget.
            </p>
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Budget Presets:</span>
            {presets.map((p) => (
              <button
                key={p.val}
                onClick={() => setBudget(p.val)}
                className={`px-3 py-1 text-xs rounded-lg font-mono transition border ${
                  budget === p.val
                    ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Budget Slider & Dynamic Number Field */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center mt-6">
          <div className="md:col-span-8 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Security Budget Cap (Initialized from Scan):
              </span>
              <span className="font-mono text-cyan-300 text-sm font-bold">
                {formatINR(budget)} ({formatINR(budget, true)})
              </span>
            </div>
            <input
              type="range"
              min={500000}
              max={12000000}
              step={250000}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>Min: ₹5 L</span>
              <span>₹35 L</span>
              <span>₹50 L (Scan Baseline)</span>
              <span>Max: ₹1.2 Cr</span>
            </div>
          </div>

          <div className="md:col-span-4 flex items-center justify-end">
            <button
              onClick={() => {}}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 hover:opacity-95 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Optimize Budget Allocation
            </button>
          </div>
        </div>
      </div>

      {/* Outcome KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Budget Utilization */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow backdrop-blur">
          <span className="text-xs text-slate-400 uppercase font-semibold">Budget Deployed</span>
          <div className="mt-2 text-2xl font-extrabold text-white font-mono">
            {formatINR(optimization.totalCost, true)}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Utilization:</span>
            <span className="font-mono text-cyan-300 font-bold">
              {optimization.budgetUtilizationPct}%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-cyan-400 h-full rounded-full"
              style={{ width: `${optimization.budgetUtilizationPct}%` }}
            />
          </div>
        </div>

        {/* Card 2: Risk Reduction */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow backdrop-blur">
          <span className="text-xs text-slate-400 uppercase font-semibold">Net Risk Mitigated</span>
          <div className="mt-2 text-2xl font-extrabold text-emerald-400 font-mono flex items-center gap-2">
            <span>-{optimization.totalRiskReductionPct}%</span>
            <TrendingDown className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Residual Score:</span>
            <span className="font-mono text-slate-200 font-bold">
              {optimization.currentRiskScore} → {optimization.projectedRiskScore} pts
            </span>
          </div>
        </div>

        {/* Card 3: Saved Financial Exposure */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow backdrop-blur">
          <span className="text-xs text-slate-400 uppercase font-semibold">Financial Loss Averted</span>
          <div className="mt-2 text-2xl font-extrabold text-white font-mono">
            {formatINR(optimization.savedExposure, true)}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Residual Exposure:</span>
            <span className="font-mono text-emerald-300 font-bold">
              {formatINR(optimization.projectedExposure, true)}
            </span>
          </div>
        </div>

        {/* Card 4: Findings Addressed */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow backdrop-blur">
          <span className="text-xs text-slate-400 uppercase font-semibold">Findings Mitigated</span>
          <div className="mt-2 text-2xl font-extrabold text-cyan-300 font-mono">
            {optimization.addressedFindingIds.length} of {findings.length}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Controls Selected:</span>
            <span className="font-mono text-slate-200 font-bold">
              {optimization.selectedControls.length} of {candidateInvestments.length}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Comparison: Current vs Optimized Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recharts Comparative Bar Chart */}
        <div className="lg:col-span-5 rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Before vs After Investment Comparison
            </h3>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              0-1 Knapsack
            </span>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonData}
                margin={{ top: 15, right: 10, left: -15, bottom: 0 }}
                barSize={28}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="metric" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-950 border border-slate-700 p-3 rounded-lg text-xs font-mono shadow-xl">
                          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 mb-1.5">
                            {label}
                          </div>
                          <div className="text-red-400">Current: {payload[0]?.value}</div>
                          <div className="text-emerald-400">
                            After Investment: {payload[1]?.value}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                <Bar dataKey="Current" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Optimized" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-xs text-slate-400 mt-2 border-t border-slate-800/80 pt-3">
            Deploying the recommended controls reduces organizational risk score from{' '}
            <strong className="text-red-400">{optimization.currentRiskScore} pts</strong> down to{' '}
            <strong className="text-emerald-400">{optimization.projectedRiskScore} pts</strong>.
          </p>
        </div>

        {/* Right: Addressed Findings Breakdown */}
        <div className="lg:col-span-7 rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg backdrop-blur flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                Findings Directly Neutralized by Selected Controls
              </h3>
            </div>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              The algorithm selected <strong className="text-cyan-300">{optimization.selectedControls.length} controls</strong> totaling{' '}
              <strong className="text-white">{formatINR(optimization.totalCost)}</strong>, directly mitigating{' '}
              <strong className="text-emerald-400">{optimization.addressedFindingIds.length} vulnerabilities</strong> across critical university servers:
            </p>

            <div className="max-h-[210px] overflow-y-auto space-y-2 pr-1">
              {optimization.addressedFindingIds.map((fId) => {
                const f = findingMap.get(fId);
                return (
                  <div
                    key={fId}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span className="font-mono text-cyan-400 font-semibold">{f?.cve_id || fId}</span>
                      <span className="text-slate-300 truncate">{f?.asset.asset_name || 'Target Asset'}</span>
                    </div>
                    <span className="font-mono text-emerald-400 text-[11px] font-semibold whitespace-nowrap ml-2">
                      Averts {formatINR(f?.expected_loss_inr || 0, true)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Buffer Remaining: <strong className="text-white font-mono">{formatINR(optimization.remainingBudget)}</strong></span>
            <span className="text-cyan-400 font-medium">ROSI: +{optimization.averageROSI}%</span>
          </div>
        </div>
      </div>

      {/* Candidate Security Investments Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Candidate Security Control Investments</h3>
            <p className="text-xs text-slate-400">
              Evaluated against scan findings, cost constraint, and marginal risk reduction %
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {optimization.selectedControls.length} Recommended / {candidateInvestments.length} Available
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                <th className="py-3 px-4">Selection</th>
                <th className="py-3 px-4">Control Name</th>
                <th className="py-3 px-4">Cost (₹)</th>
                <th className="py-3 px-4">Risk Reduction</th>
                <th className="py-3 px-4">Target Findings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans text-xs">
              {candidateInvestments.map((control) => {
                const isSelected = selectedIds.has(control.control_id);

                return (
                  <tr
                    key={control.control_id}
                    className={`transition ${
                      isSelected
                        ? 'bg-cyan-950/20 border-l-2 border-cyan-400'
                        : 'hover:bg-slate-800/30 opacity-70'
                    }`}
                  >
                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold">
                          <CheckCircle className="w-3 h-3" /> Selected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-400 border border-slate-700 text-[10px] px-2.5 py-0.5 rounded-full font-mono">
                          Out of Budget
                        </span>
                      )}
                    </td>

                    {/* Control Name */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white text-xs">{control.control_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        ID: {control.control_id}
                      </div>
                    </td>

                    {/* Cost */}
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {formatINR(control.cost_inr)}
                    </td>

                    {/* Risk Reduction */}
                    <td className="py-3 px-4 font-mono">
                      <span className="text-emerald-400 font-bold">-{control.estimated_risk_reduction_pct}%</span>
                    </td>

                    {/* Target Findings */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {control.addresses_findings.map((fId) => {
                          const f = findingMap.get(fId);
                          return (
                            <span
                              key={fId}
                              className="inline-flex items-center gap-1 text-[10px] font-mono bg-slate-800 text-cyan-300 border border-slate-700 px-1.5 py-0.5 rounded"
                              title={f?.vulnerability_name || fId}
                            >
                              <Tag className="w-2.5 h-2.5" />
                              {f?.cve_id || fId}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
