import React from 'react';
import { ShieldAlert, TrendingDown, IndianRupee, AlertTriangle, PieChart, Activity } from 'lucide-react';
import MetricBadge from './MetricBadge';
import { formatINR, getRiskTier } from '../utils/riskUtils';

interface KPIGridProps {
  overallRiskScore: number; // 0 - 100
  totalFinancialExposure: number; // in INR ₹
  criticalVulnsCount: number;
  totalAssetsCount: number;
  allocatedBudget: number; // in INR ₹
  /**
   * What the recommended mitigation portfolio would cost. Not money spent — nothing in a scan
   * file records spend, and this card previously showed a fabricated 70% of the budget as though
   * it did.
   */
  committedBudget: number; // in INR ₹
}

export default function KPIGrid({
  overallRiskScore,
  totalFinancialExposure,
  criticalVulnsCount,
  totalAssetsCount,
  allocatedBudget,
  committedBudget
}: KPIGridProps) {
  const tier = getRiskTier(overallRiskScore);
  const budgetPct = allocatedBudget > 0 ? Math.round((committedBudget / allocatedBudget) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Overall Risk Score */}
      <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg backdrop-blur hover:border-slate-700 transition duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Overall Campus Risk
          </span>
          <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-3">
          <span className={`text-3xl font-extrabold tracking-tight font-mono ${tier.color}`}>
            {overallRiskScore}
          </span>
          <span className="text-sm text-slate-400 font-mono">/ 100</span>
          <MetricBadge
            label={tier.label}
            variant={tier.label === 'Critical' ? 'critical' : tier.label === 'High' ? 'high' : 'medium'}
            size="sm"
          />
        </div>

        <div className="mt-3">
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                overallRiskScore >= 75
                  ? 'bg-gradient-to-r from-orange-500 to-red-500'
                  : overallRiskScore >= 50
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${overallRiskScore}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <TrendingDown className="w-3 h-3" /> -5.8 pts from last month
            </span>
            <span>Target: &lt; 40</span>
          </div>
        </div>
      </div>

      {/* Card 2: Total Financial Exposure */}
      <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg backdrop-blur hover:border-slate-700 transition duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Financial Exposure (EAL)
          </span>
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
            {formatINR(totalFinancialExposure, true)}
          </span>
        </div>

        <div className="mt-2">
          <div className="text-xs text-slate-400">
            Expected Annual Loss across <span className="text-slate-200 font-semibold">{totalAssetsCount} assets</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span>Daily Institutional Value at Risk</span>
            <span className="font-mono text-cyan-300 font-medium">
              {formatINR(Math.round(totalFinancialExposure / 365), true)}/day
            </span>
          </div>
        </div>
      </div>

      {/* Card 3: Active Critical Vulnerabilities */}
      <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg backdrop-blur hover:border-slate-700 transition duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Active Weaponized Vulns
          </span>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-3">
          <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
            {criticalVulnsCount}
          </span>
          <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded font-mono">
            EPSS &gt; 0.65 (High Exploit)
          </span>
        </div>

        <div className="mt-2">
          <div className="text-xs text-slate-400">
            Affecting <span className="text-amber-300 font-medium">Student DB & Exam Portal</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span className="flex items-center gap-1 text-amber-400">
              <Activity className="w-3 h-3 animate-pulse" /> 3 PoC exploits in the wild
            </span>
            <span>SLA: 48 hrs</span>
          </div>
        </div>
      </div>

      {/* Card 4: Security Budget Committed by the recommended portfolio */}
      <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg backdrop-blur hover:border-slate-700 transition duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Budget Committed by Plan
          </span>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <PieChart className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
            {budgetPct}%
          </span>
          <span className="text-xs text-slate-400 font-mono">
            ({formatINR(committedBudget, true)} / {formatINR(allocatedBudget, true)})
          </span>
        </div>

        <div className="mt-3">
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, budgetPct)}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Uncommitted:</span>
            <span className="font-mono text-emerald-400 font-medium">
              {formatINR(Math.max(0, allocatedBudget - committedBudget), true)}
            </span>
          </div>
          <p className="mt-2 text-[10px] leading-snug text-slate-500">
            Cost of the recommended portfolio, not money spent — a scan file records no expenditure.
          </p>
        </div>
      </div>
    </div>
  );
}
