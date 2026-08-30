"use client";

import { useExecutiveDashboard, useExecutiveKPIs } from "../hooks";
import { MetricCard, RiskLevelBadge, DataFreshnessBadge, CardSkeleton } from "./shared";
import {
  ShieldAlert, DollarSign, TrendingDown, AlertTriangle,
  Building2, Activity, Clock, BarChart3,
} from "lucide-react";
import { RISK_LEVEL_COLORS, KPI_DRILL_DOWN_MAP } from "../constants";
import type { RiskLevel } from "../types";

// ─── Executive Dashboard KPI Strip ───────────────────────────────────────────

export function ExecutiveKPIStrip() {
  const { data: kpis, isLoading } = useExecutiveKPIs();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  const ICONS: Record<string, React.ReactNode> = {
    cyber_risk: <ShieldAlert className="h-4 w-4" />,
    financial_exposure: <DollarSign className="h-4 w-4" />,
    expected_annual_loss: <TrendingDown className="h-4 w-4" />,
    critical_assets: <AlertTriangle className="h-4 w-4" />,
    open_incidents: <Activity className="h-4 w-4" />,
    risk_reduction: <BarChart3 className="h-4 w-4" />,
    compliance_risk: <Building2 className="h-4 w-4" />,
    mttr: <Clock className="h-4 w-4" />,
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {kpis?.map((kpi) => (
        <MetricCard
          key={kpi.kpi_key}
          label={kpi.label}
          value={kpi.value}
          subValue={kpi.unit !== "score" ? kpi.unit : undefined}
          icon={ICONS[kpi.kpi_key]}
          level={kpi.level}
          trend={kpi.trend}
          change={typeof kpi.change === "number" ? kpi.change : undefined}
          drillDownUrl={KPI_DRILL_DOWN_MAP[kpi.kpi_key]}
          invertTrendColors={["cyber_risk", "financial_exposure", "open_incidents"].includes(kpi.kpi_key)}
        />
      ))}
    </div>
  );
}

// ─── Risk Score Gauge ─────────────────────────────────────────────────────────

export function RiskScoreGauge() {
  const { data, isLoading } = useExecutiveDashboard();

  if (isLoading) return <CardSkeleton className="h-48" />;
  if (!data) return null;

  const { current_score, level, change } = data.risk_score;
  const color = RISK_LEVEL_COLORS[level as RiskLevel] ?? "#6b7280";
  const pct = Math.min(100, Math.max(0, current_score));

  // SVG gauge constants
  const cx = 100, cy = 90, r = 70;
  const startAngle = Math.PI;
  const sweepAngle = Math.PI;
  const arcStart = { x: cx - r, y: cy };
  const arcEnd = { x: cx + r, y: cy };
  const progressAngle = Math.PI + (pct / 100) * Math.PI;
  const px = cx + r * Math.cos(progressAngle);
  const py = cy + r * Math.sin(progressAngle);

  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold text-white">Cyber Risk Score</h3>
        <DataFreshnessBadge lastUpdated={data.risk_score.last_updated} />
      </div>
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 200 110" className="w-48">
          {/* Background arc */}
          <path
            d={`M ${arcStart.x} ${arcStart.y} A ${r} ${r} 0 0 1 ${arcEnd.x} ${arcEnd.y}`}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Risk gradient zones */}
          {([
            { pct: 0.2, color: "#22c55e" },
            { pct: 0.2, color: "#eab308" },
            { pct: 0.2, color: "#f97316" },
            { pct: 0.2, color: "#ef4444" },
            { pct: 0.2, color: "#dc2626" },
          ]).reduce<React.ReactNode[]>((acc, zone, i, arr) => {
            const prev = arr.slice(0, i).reduce((s, z) => s + z.pct, 0);
            const from = Math.PI + prev * Math.PI;
            const to = Math.PI + (prev + zone.pct) * Math.PI;
            const x1 = cx + r * Math.cos(from);
            const y1 = cy + r * Math.sin(from);
            const x2 = cx + r * Math.cos(to);
            const y2 = cy + r * Math.sin(to);
            acc.push(
              <path
                key={i}
                d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                fill="none"
                stroke={zone.color}
                strokeWidth="4"
                opacity="0.25"
              />
            );
            return acc;
          }, [])}
          {/* Progress arc */}
          <path
            d={`M ${arcStart.x} ${arcStart.y} A ${r} ${r} 0 0 1 ${px} ${py}`}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
          />
          {/* Needle */}
          <line
            x1={cx}
            y1={cy}
            x2={px}
            y2={py}
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.8"
          />
          <circle cx={cx} cy={cy} r="5" fill={color} />
          {/* Score text */}
          <text x={cx} y={cy - 10} textAnchor="middle" className="fill-white" fontSize="24" fontWeight="bold">
            {current_score.toFixed(1)}
          </text>
          <text x={cx} y={cy + 8} textAnchor="middle" className="fill-gray-400" fontSize="11">
            / 100
          </text>
        </svg>
        <RiskLevelBadge level={level as RiskLevel} className="mt-2" />
        {change !== undefined && (
          <p className={`mt-1 text-xs ${change > 0 ? "text-red-400" : "text-green-400"}`}>
            {change > 0 ? "+" : ""}{change.toFixed(1)} from last period
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Financial Summary Tiles ──────────────────────────────────────────────────

export function ExecutiveFinancialSummary() {
  const { data, isLoading } = useExecutiveDashboard();

  if (isLoading) return <CardSkeleton className="h-40" />;
  if (!data) return null;

  const { financial } = data;

  const fmt = (v: number) =>
    v >= 10_000_000
      ? `₹${(v / 10_000_000).toFixed(1)} Cr`
      : v >= 100_000
      ? `₹${(v / 100_000).toFixed(1)} L`
      : `₹${(v / 1000).toFixed(0)}K`;

  const tiles = [
    { label: "Potential Exposure", value: financial.current_exposure, color: "text-red-400" },
    { label: "Expected Annual Loss", value: financial.expected_annual_loss, color: "text-orange-400" },
    { label: "Downtime Exposure", value: financial.downtime_exposure, color: "text-yellow-400" },
    { label: "Compliance Exposure", value: financial.compliance_exposure, color: "text-purple-400" },
    { label: "Recovery Cost", value: financial.recovery_cost, color: "text-blue-400" },
    { label: "Response Cost", value: financial.response_cost, color: "text-cyan-400" },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-white">Financial Risk Summary</h3>
        <span className="rounded-md bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-400">
          {financial.currency ?? "INR"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-lg bg-slate-900/50 p-3">
            <p className="text-xs text-gray-400">{t.label}</p>
            <p className={`mt-1 text-lg font-bold ${t.color}`}>{fmt(t.value)}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-gray-500">
        ⚠ Financial figures computed by backend risk engine. Frontend displays only.
      </p>
    </div>
  );
}

// ─── Attack Path Summary ──────────────────────────────────────────────────────

export function AttackPathSummaryCard() {
  const { data, isLoading } = useExecutiveDashboard();

  if (isLoading) return <CardSkeleton className="h-36" />;
  if (!data) return null;

  const { attack_paths } = data;

  const fmt = (v: number) =>
    v >= 10_000_000 ? `₹${(v / 10_000_000).toFixed(1)} Cr` : `₹${(v / 100_000).toFixed(1)} L`;

  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5">
      <h3 className="mb-4 font-semibold text-white">Attack Path Exposure</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-red-500/10 p-3 border border-red-500/20">
          <p className="text-xs text-red-300">Critical Paths</p>
          <p className="mt-1 text-2xl font-bold text-red-400">{attack_paths.critical_attack_paths}</p>
        </div>
        <div className="rounded-lg bg-orange-500/10 p-3 border border-orange-500/20">
          <p className="text-xs text-orange-300">High Risk Paths</p>
          <p className="mt-1 text-2xl font-bold text-orange-400">{attack_paths.high_risk_attack_paths}</p>
        </div>
        <div className="rounded-lg bg-yellow-500/10 p-3 border border-yellow-500/20">
          <p className="text-xs text-yellow-300">Assets Exposed</p>
          <p className="mt-1 text-2xl font-bold text-yellow-400">{attack_paths.assets_exposed}</p>
        </div>
        <div className="rounded-lg bg-purple-500/10 p-3 border border-purple-500/20">
          <p className="text-xs text-purple-300">Financial Exposure</p>
          <p className="mt-1 text-lg font-bold text-purple-400">{fmt(attack_paths.financial_exposure)}</p>
        </div>
      </div>
    </div>
  );
}
